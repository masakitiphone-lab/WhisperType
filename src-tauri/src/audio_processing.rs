use std::{
    ffi::OsString,
    fs,
    path::{Path, PathBuf},
    process::{Command, Output, Stdio},
    time::{SystemTime, UNIX_EPOCH},
};

use crate::log_store::append_log_line;
use webrtc_vad::{SampleRate, Vad, VadMode};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

const TARGET_SAMPLE_RATE_HZ: u32 = 16_000;
const TARGET_CHANNELS: u32 = 1;
const VAD_FRAME_DURATION_MS: usize = 30;
const VAD_MIN_SPEECH_FRAMES: usize = 3;
const API_GATE_VAD_MIN_SPEECH_FRAMES: usize = 4;
const DEFAULT_VOLUME_MULTIPLIER: f32 = 1.5;
#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(serde::Serialize)]
pub struct VadDetectionResult {
    has_speech: bool,
    total_frames: usize,
    speech_frames: usize,
}

struct TempAudioFiles {
    paths: Vec<PathBuf>,
}

impl TempAudioFiles {
    fn new(paths: Vec<PathBuf>) -> Self {
        Self { paths }
    }
}

impl Drop for TempAudioFiles {
    fn drop(&mut self) {
        for path in &self.paths {
            let _ = fs::remove_file(path);
        }
    }
}

fn temp_audio_dir() -> Result<PathBuf, String> {
    let mut dir = std::env::temp_dir();
    dir.push("whispertype-audio-processing");
    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    Ok(dir)
}

fn timestamp_millis() -> Result<u128, String> {
    Ok(SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?
        .as_millis())
}

fn ffmpeg_command() -> Command {
    let mut command = Command::new(resolve_ffmpeg_executable());
    #[cfg(target_os = "windows")]
    command.creation_flags(CREATE_NO_WINDOW);
    command
}

fn resolve_ffmpeg_executable() -> OsString {
    if let Ok(explicit_path) = std::env::var("WHISPERTYPE_FFMPEG_PATH") {
        let trimmed = explicit_path.trim();
        if !trimmed.is_empty() {
            let path = PathBuf::from(trimmed);
            if path.exists() {
                return path.into_os_string();
            }
        }
    }

    for candidate in ffmpeg_candidates() {
        if candidate.exists() {
            return candidate.into_os_string();
        }
    }

    OsString::from("ffmpeg")
}

fn ffmpeg_candidates() -> Vec<PathBuf> {
    let mut candidates = Vec::new();

    if let Ok(current_exe) = std::env::current_exe() {
        if let Some(exe_dir) = current_exe.parent() {
            #[cfg(target_os = "windows")]
            {
                candidates.push(exe_dir.join("ffmpeg.exe"));
                candidates.push(exe_dir.join("ffmpeg").join("ffmpeg.exe"));
                candidates.push(exe_dir.join("resources").join("ffmpeg.exe"));
                candidates.push(exe_dir.join("resources").join("ffmpeg").join("ffmpeg.exe"));
                candidates.push(
                    exe_dir
                        .join("resources")
                        .join("ffmpeg")
                        .join("bin")
                        .join("ffmpeg.exe"),
                );
            }
            #[cfg(not(target_os = "windows"))]
            {
                candidates.push(exe_dir.join("ffmpeg"));
                candidates.push(exe_dir.join("ffmpeg").join("ffmpeg"));
                candidates.push(exe_dir.join("resources").join("ffmpeg"));
                candidates.push(exe_dir.join("Frameworks").join("ffmpeg"));
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
            let winget_packages = Path::new(&local_app_data)
                .join("Microsoft")
                .join("WinGet")
                .join("Packages");
            if let Ok(entries) = fs::read_dir(winget_packages) {
                for entry in entries.flatten() {
                    let package_path = entry.path();
                    let package_name = package_path
                        .file_name()
                        .and_then(|name| name.to_str())
                        .unwrap_or_default();
                    if !package_name.starts_with("Gyan.FFmpeg_") {
                        continue;
                    }
                    if let Ok(package_entries) = fs::read_dir(package_path) {
                        for package_entry in package_entries.flatten() {
                            let install_root = package_entry.path();
                            candidates.push(install_root.join("bin").join("ffmpeg.exe"));
                        }
                    }
                }
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        candidates.push(PathBuf::from("/usr/local/bin/ffmpeg"));
        candidates.push(PathBuf::from("/opt/homebrew/bin/ffmpeg"));
        candidates.push(PathBuf::from("/usr/bin/ffmpeg"));
        if let Ok(home) = std::env::var("HOME") {
            candidates.push(PathBuf::from(&home).join(".homebrew/bin/ffmpeg"));
            candidates.push(PathBuf::from(&home).join("bin/ffmpeg"));
        }
    }

    candidates
}

fn run_ffmpeg(args: &[&str]) -> Result<Output, String> {
    let program = resolve_ffmpeg_executable();
    let program_display = PathBuf::from(&program).display().to_string();

    let output = ffmpeg_command()
        .args(args)
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .output()
        .map_err(|error| {
            let message = format!("ffmpeg_spawn_failed program={program_display} error={error}");
            append_log_line(&format!("[FFmpeg] {message}"));
            message
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        append_log_line(&format!(
            "[FFmpeg] failed code={:?} stderr={}",
            output.status.code(),
            stderr
        ));
    }

    Ok(output)
}

fn decode_webm_to_pcm_wav(bytes: &[u8]) -> Result<(PathBuf, TempAudioFiles, Vec<i16>, u32), String> {
    let dir = temp_audio_dir()?;
    let stamp = timestamp_millis()?;
    let input_path = dir.join(format!("whispertype-vad-input-{stamp}.webm"));
    let output_path = dir.join(format!("whispertype-vad-output-{stamp}.wav"));
    let temp_files = TempAudioFiles::new(vec![input_path.clone(), output_path.clone()]);
    let sample_rate = TARGET_SAMPLE_RATE_HZ.to_string();
    let channels = TARGET_CHANNELS.to_string();

    fs::write(&input_path, bytes).map_err(|error| error.to_string())?;

    let output = run_ffmpeg(&[
            "-hide_banner",
            "-loglevel",
            "error",
            "-nostats",
            "-y",
            "-i",
            input_path.to_string_lossy().as_ref(),
            "-vn",
            "-ar",
            &sample_rate,
            "-ac",
            &channels,
            "-c:a",
            "pcm_s16le",
            "-f",
            "wav",
            output_path.to_string_lossy().as_ref(),
        ])?;

    if !output.status.success() {
        return Err(format!(
            "ffmpeg_decode_failed:{:?}:{}",
            output.status.code(),
            String::from_utf8_lossy(&output.stderr).trim()
        ));
    }

    let wav_bytes = fs::read(&output_path).map_err(|error| error.to_string())?;
    if wav_bytes.len() <= 44 {
        return Ok((input_path, temp_files, Vec::new(), 16_000));
    }

    let mut samples = Vec::with_capacity((wav_bytes.len().saturating_sub(44)) / 2);
    for chunk in wav_bytes[44..].chunks_exact(2) {
        samples.push(i16::from_le_bytes([chunk[0], chunk[1]]));
    }

    Ok((input_path, temp_files, samples, 16_000))
}

fn detect_speech_frames(
    samples: &[i16],
    sample_rate_hz: u32,
    min_speech_frames: usize,
) -> Result<VadDetectionResult, String> {
    if samples.is_empty() {
        return Ok(VadDetectionResult {
            has_speech: false,
            total_frames: 0,
            speech_frames: 0,
        });
    }

    let frame_rate_hz = sample_rate_hz as usize;
    let sample_rate = SampleRate::try_from(sample_rate_hz as i32).map_err(|error| error.to_string())?;
    let mut vad = Vad::new_with_rate_and_mode(sample_rate, VadMode::VeryAggressive);
    let frame_size = (frame_rate_hz * VAD_FRAME_DURATION_MS) / 1000;
    if frame_size == 0 {
        return Err("invalid_vad_frame_size".to_string());
    }

    let mut speech_frames = 0usize;
    let mut total_frames = 0usize;
    for frame in samples.chunks(frame_size) {
        if frame.len() < frame_size {
            break;
        }
        total_frames += 1;
        if vad.is_voice_segment(frame).map_err(|_| "invalid_vad_frame".to_string())? {
            speech_frames += 1;
            if speech_frames >= min_speech_frames {
                break;
            }
        }
    }

    Ok(VadDetectionResult {
        has_speech: total_frames > 0 && speech_frames >= min_speech_frames,
        total_frames,
        speech_frames,
    })
}

#[tauri::command]
pub fn detect_speech_with_vad(bytes: Vec<u8>) -> Result<VadDetectionResult, String> {
    let (_, _temp_files, samples, sample_rate_hz) = decode_webm_to_pcm_wav(&bytes)?;
    detect_speech_frames(&samples, sample_rate_hz, API_GATE_VAD_MIN_SPEECH_FRAMES)
}

#[tauri::command]
pub fn process_audio_with_ffmpeg(bytes: Vec<u8>) -> Result<Vec<u8>, String> {
    let (input_path, mut temp_files, samples, sample_rate_hz) = decode_webm_to_pcm_wav(&bytes)?;
    if samples.is_empty() {
        append_log_line("[FFmpeg] decoded audio was empty; using original recording");
        return Ok(bytes);
    }

    let vad_result = match detect_speech_frames(&samples, sample_rate_hz, VAD_MIN_SPEECH_FRAMES) {
        Ok(result) => result,
        Err(error) if error == "invalid_vad_frame_size" => {
            append_log_line("[FFmpeg] invalid VAD frame size; using original recording");
            return Ok(bytes);
        }
        Err(error) => return Err(error),
    };
    if !vad_result.has_speech {
        return Ok(bytes);
    }

    let dir = temp_audio_dir()?;
    let stamp = timestamp_millis()?;
    let output_path = dir.join(format!("whispertype-output-{stamp}.webm"));
    temp_files.paths.push(output_path.clone());
    let sample_rate = TARGET_SAMPLE_RATE_HZ.to_string();
    let channels = TARGET_CHANNELS.to_string();

    let filter = format!("volume={DEFAULT_VOLUME_MULTIPLIER}");

    let output = run_ffmpeg(&[
            "-hide_banner",
            "-loglevel",
            "error",
            "-nostats",
            "-y",
            "-i",
            input_path.to_string_lossy().as_ref(),
            "-vn",
            "-af",
            &filter,
            "-ar",
            &sample_rate,
            "-ac",
            &channels,
            "-c:a",
            "libopus",
            "-b:a",
            "48k",
            "-vbr",
            "on",
            "-f",
            "webm",
            output_path.to_string_lossy().as_ref(),
        ])?;

    if !output.status.success() {
        return Err(format!(
            "ffmpeg_failed:{:?}:{}",
            output.status.code(),
            String::from_utf8_lossy(&output.stderr).trim()
        ));
    }

    fs::read(&output_path).map_err(|error| error.to_string())
}

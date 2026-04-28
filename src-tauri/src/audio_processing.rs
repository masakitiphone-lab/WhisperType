use std::{
    fs,
    path::PathBuf,
    process::{Command, Stdio},
    time::{SystemTime, UNIX_EPOCH},
};

use webrtc_vad::{SampleRate, Vad, VadMode};

const TARGET_SAMPLE_RATE_HZ: u32 = 16_000;
const TARGET_CHANNELS: u32 = 1;
const VAD_FRAME_DURATION_MS: usize = 30;
const VAD_MIN_SPEECH_FRAMES: usize = 3;
const DEFAULT_VOLUME_MULTIPLIER: f32 = 1.5;

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

fn decode_webm_to_pcm_wav(bytes: &[u8]) -> Result<(PathBuf, Vec<i16>, u32), String> {
    let dir = temp_audio_dir()?;
    let stamp = timestamp_millis()?;
    let input_path = dir.join(format!("whispertype-vad-input-{stamp}.webm"));
    let output_path = dir.join(format!("whispertype-vad-output-{stamp}.wav"));
    let sample_rate = TARGET_SAMPLE_RATE_HZ.to_string();
    let channels = TARGET_CHANNELS.to_string();

    fs::write(&input_path, bytes).map_err(|error| error.to_string())?;

    let status = Command::new("ffmpeg")
        .args([
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
        ])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .map_err(|error| error.to_string())?;

    if !status.success() {
        return Err(format!("ffmpeg_decode_failed:{:?}", status.code()));
    }

    let wav_bytes = fs::read(&output_path).map_err(|error| error.to_string())?;
    if wav_bytes.len() <= 44 {
        return Ok((output_path, Vec::new(), 16_000));
    }

    let mut samples = Vec::with_capacity((wav_bytes.len().saturating_sub(44)) / 2);
    for chunk in wav_bytes[44..].chunks_exact(2) {
        samples.push(i16::from_le_bytes([chunk[0], chunk[1]]));
    }

    Ok((output_path, samples, 16_000))
}

#[tauri::command]
pub fn process_audio_with_ffmpeg(bytes: Vec<u8>) -> Result<Vec<u8>, String> {
    let (input_path, samples, sample_rate_hz) = decode_webm_to_pcm_wav(&bytes)?;
    if samples.is_empty() {
        return Ok(Vec::new());
    }

    let frame_rate_hz = sample_rate_hz as usize;
    let sample_rate = SampleRate::try_from(sample_rate_hz as i32).map_err(|error| error.to_string())?;
    let mut vad = Vad::new_with_rate_and_mode(sample_rate, VadMode::VeryAggressive);
    let frame_size = (frame_rate_hz * VAD_FRAME_DURATION_MS) / 1000;
    if frame_size == 0 {
        return Ok(Vec::new());
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
            if speech_frames >= VAD_MIN_SPEECH_FRAMES {
                break;
            }
        }
    }

    if !(total_frames > 0 && speech_frames >= VAD_MIN_SPEECH_FRAMES) {
        return Ok(Vec::new());
    }

    let dir = temp_audio_dir()?;
    let stamp = timestamp_millis()?;
    let output_path = dir.join(format!("whispertype-output-{stamp}.webm"));
    let sample_rate = TARGET_SAMPLE_RATE_HZ.to_string();
    let channels = TARGET_CHANNELS.to_string();

    let filter = format!("volume={DEFAULT_VOLUME_MULTIPLIER}");

    let status = Command::new("ffmpeg")
        .args([
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
        ])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .map_err(|error| error.to_string())?;

    if !status.success() {
        return Err(format!("ffmpeg_failed:{:?}", status.code()));
    }

    fs::read(&output_path).map_err(|error| error.to_string())
}

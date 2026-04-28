export function getAudioFileName(blob: Blob): string {
  if (blob.type.includes("wav")) return "audio.wav";
  if (blob.type.includes("mp4")) return "audio.m4a";
  if (blob.type.includes("ogg")) return "audio.ogg";
  return "audio.webm";
}

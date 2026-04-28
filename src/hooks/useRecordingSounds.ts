import { useEffect, useRef } from "react";

export function useRecordingSounds() {
  const startSoundRef = useRef<HTMLAudioElement | null>(null);
  const stopSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    startSoundRef.current = new Audio("/sounds/recording-start.mp3");
    stopSoundRef.current = new Audio("/sounds/recording-stop.mp3");
    startSoundRef.current.preload = "auto";
    stopSoundRef.current.preload = "auto";
    startSoundRef.current.volume = 0.25;
    stopSoundRef.current.volume = 0.25;
    return () => {
      startSoundRef.current?.pause();
      stopSoundRef.current?.pause();
      startSoundRef.current = null;
      stopSoundRef.current = null;
    };
  }, []);

  return { startSoundRef, stopSoundRef };
}

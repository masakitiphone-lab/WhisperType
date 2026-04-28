import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CapsuleShell } from "@/components/overlay/CapsuleShell";
import { OverlayNoticePanel } from "@/components/overlay/OverlayNoticePanel";
import { TransitioningOverlayIcon } from "@/components/overlay/TransitioningOverlayIcon";
import { WaveformStrip } from "@/components/overlay/WaveformStrip";
import { useRecordingController } from "@/hooks/RecordingControllerContext";
import {
  BASE_HEIGHT,
  CAPSULE_EXPANDED_WIDTH,
  WAVEFORM_BAR_COUNT,
  WAVEFORM_BAR_GAP,
  WAVEFORM_BAR_WIDTH,
  WAVEFORM_VIEW_HEIGHT,
  getCapsuleExpandedWidth,
  getCapsuleAnimationWidth,
  getCapsuleWidthProgress,
  getIconTravelX,
  getPhaseAnimationProgress,
  getWaveformPhaseOpacity,
} from "@/lib/overlayLayout";

const TRANSITION_EASE = [0.25, 0.1, 0.25, 1] as const;

const glassShellMotion = {
  initial: { opacity: 0, y: 14, scale: 0.955 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      opacity: { duration: 0.22, ease: TRANSITION_EASE },
      y: { duration: 0.26, ease: TRANSITION_EASE },
      scale: { duration: 0.3, ease: TRANSITION_EASE },
    },
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.975,
    transition: {
      opacity: { duration: 0.16, ease: TRANSITION_EASE },
      y: { duration: 0.18, ease: TRANSITION_EASE },
      scale: { duration: 0.2, ease: TRANSITION_EASE },
    },
  },
} as const;

export default function OverlayPage() {
  const {
    recordingState,
    overlayNotice,
    overlayPresentationVersion,
    isOverlayVisible,
    waveformLevels,
    capsulePhase,
    capsulePhaseStartedAt,
    capsuleMounted,
    spinnerPhase,
    overlayScale,
    clearOverlayNotice,
    openAppFromOverlay,
    stageWidth,
    stageHeight,
    shouldReduceMotion,
  } = useRecordingController();

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      setNow(Date.now());
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const showCapsule = recordingState === "recording" && !overlayNotice;
  const showWaveform = recordingState === "recording";
  const showCapsuleContent = capsulePhase === "settled" && showCapsule;
  const capsuleRadius = BASE_HEIGHT / 2;
  const iconBallSize = BASE_HEIGHT - 4;
  const iconBallInnerSize = 24;
  const capsuleContentBandWidth = getCapsuleExpandedWidth();
  const showTransitionIcon = showCapsule || capsulePhase === "closing" || spinnerPhase !== "hidden";
  const capsuleAnimationProgress = getPhaseAnimationProgress(capsulePhase, now - capsulePhaseStartedAt);
  const capsuleWidthProgress = getCapsuleWidthProgress(capsulePhase, now - capsulePhaseStartedAt);
  const capsuleAnimatedWidth = getCapsuleAnimationWidth(capsuleWidthProgress);
  const iconTravelX = getIconTravelX(capsuleAnimationProgress, stageWidth, capsuleContentBandWidth, iconBallSize);
  const waveformOpacity = getWaveformPhaseOpacity(capsulePhase, now - capsulePhaseStartedAt);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "40px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        height: `${stageHeight * overlayScale}px`,
        width: `${stageWidth * overlayScale}px`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: `${stageWidth}px`,
          height: `${stageHeight}px`,
          transform: `translate(-50%, -50%) scale(${overlayScale})`,
          transformOrigin: "center center",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <AnimatePresence mode="wait" initial={false}>
            {isOverlayVisible && overlayNotice ? (
              <motion.div
                key={`notice-${overlayPresentationVersion}`}
                initial={glassShellMotion.initial}
                animate={glassShellMotion.animate}
                exit={glassShellMotion.exit}
                style={{
                  position: "absolute",
                  left: `${(stageWidth - 320) / -2}px`,
                  top: `${(stageHeight - 96) / -2}px`,
                  width: "320px",
                  minHeight: "96px",
                  borderRadius: "12px",
                  background: "transparent",
                  border: "none",
                  boxShadow: "none",
                  padding: "0",
                  pointerEvents: "auto",
                }}
              >
                <OverlayNoticePanel
                  notice={overlayNotice}
                  reduceMotion={!!shouldReduceMotion}
                  onClose={() => {
                    void clearOverlayNotice();
                  }}
                  onOpenApp={async () => {
                    await openAppFromOverlay();
                  }}
                  onCopy={
                    overlayNotice.copyLabel && overlayNotice.text
                      ? async () => {
                          await navigator.clipboard.writeText(overlayNotice.text ?? "");
                        }
                      : undefined
                  }
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            {isOverlayVisible && capsuleMounted ? (
              <CapsuleShell
                show={capsuleMounted}
                width={Math.max(capsuleAnimatedWidth, CAPSULE_EXPANDED_WIDTH)}
                height={BASE_HEIGHT}
                radius={capsuleRadius}
                reduceMotion={!!shouldReduceMotion}
                phase={capsulePhase}
                contentVisible={showCapsuleContent}
              >
                <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "transparent" }}>
                  <WaveformStrip
                    show={showWaveform}
                    showContent={showCapsuleContent}
                    isClosing={capsulePhase === "closing"}
                    opacity={waveformOpacity}
                    capsuleWidth={Math.max(capsuleAnimatedWidth, CAPSULE_EXPANDED_WIDTH)}
                    barWidth={WAVEFORM_BAR_WIDTH}
                    barGap={WAVEFORM_BAR_GAP}
                    barCount={WAVEFORM_BAR_COUNT}
                    barViewHeight={WAVEFORM_VIEW_HEIGHT}
                    levels={waveformLevels}
                    reduceMotion={!!shouldReduceMotion}
                  />
                </div>
              </CapsuleShell>
            ) : null}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {showTransitionIcon ? (
              <TransitioningOverlayIcon
                key={`transition-icon-${overlayPresentationVersion}`}
                phase={capsulePhase}
                spinnerPhase={spinnerPhase}
                x={iconTravelX}
                height={BASE_HEIGHT}
                iconSize={iconBallSize}
                innerSize={iconBallInnerSize}
                reduceMotion={!!shouldReduceMotion}
              />
            ) : null}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}

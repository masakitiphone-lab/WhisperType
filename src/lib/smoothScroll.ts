type SmoothScrollOptions = {
  offset?: number;
  durationMs?: number;
};

const DEFAULT_DURATION_MS = 360;

function easeInOutCubic(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function getScrollContainer(element: HTMLElement) {
  let current: HTMLElement | null = element.parentElement;
  while (current) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    if (/(auto|scroll|overlay)/.test(overflowY) && current.scrollHeight > current.clientHeight) {
      return current;
    }
    current = current.parentElement;
  }
  return document.scrollingElement as HTMLElement | null;
}

export function smoothScrollElementIntoView(element: HTMLElement, options: SmoothScrollOptions = {}) {
  const container = getScrollContainer(element);
  if (!container) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const durationMs = reduceMotion ? 0 : options.durationMs ?? DEFAULT_DURATION_MS;
  const offset = options.offset ?? 16;
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const targetTop = container.scrollTop + (elementRect.top - containerRect.top) - offset;

  if (durationMs <= 0) {
    container.scrollTop = targetTop;
    return;
  }

  const startTop = container.scrollTop;
  const delta = targetTop - startTop;
  const startAt = performance.now();

  const tick = (now: number) => {
    const progress = Math.min(1, (now - startAt) / durationMs);
    container.scrollTop = startTop + delta * easeInOutCubic(progress);
    if (progress < 1) {
      window.requestAnimationFrame(tick);
    }
  };

  window.requestAnimationFrame(tick);
}

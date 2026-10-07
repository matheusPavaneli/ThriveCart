import { type AnimationEvent, type CSSProperties, type PointerEvent, useRef } from 'react';
import type { Channel } from '../products';

const MAX_TILT_DEG = 6;
const FULL_GLOW_AT = 4;

const powerDelay: Record<Channel, string> = { red: '0ms', green: '140ms', blue: '280ms' };

function canTilt(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches;
}

interface WidgetLensProps {
  channel: Channel;
  count: number;
  className?: string;
}

export function WidgetLens({ channel, count, className = '' }: WidgetLensProps) {
  const ref = useRef<HTMLDivElement>(null);
  const glow = 0.45 + (0.55 * Math.min(count, FULL_GLOW_AT)) / FULL_GLOW_AT;

  function tilt(event: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || !canTilt()) return;
    const box = el.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    el.style.setProperty('--tilt-x', `${(-y * MAX_TILT_DEG * 2).toFixed(2)}deg`);
    el.style.setProperty('--tilt-y', `${(x * MAX_TILT_DEG * 2).toFixed(2)}deg`);
  }

  function reset() {
    ref.current?.style.removeProperty('--tilt-x');
    ref.current?.style.removeProperty('--tilt-y');
  }

  function settle(event: AnimationEvent<HTMLDivElement>) {
    if (event.target instanceof HTMLElement) event.target.style.animation = 'none';
  }

  const style = {
    '--lens-ink': `var(--color-${channel}-ink)`,
    '--lens-light': `var(--color-${channel}-light)`,
    '--glow': glow.toFixed(3),
    '--power-delay': powerDelay[channel],
  } as CSSProperties;

  return (
    <div ref={ref} aria-hidden="true" className={`lens ${className}`} style={style} onPointerMove={tilt} onPointerLeave={reset} onAnimationEnd={settle}>
      <div className="lens-glass">
        <div className="lens-core" />
      </div>
      <div className="lens-specular" />
      {count > 0 && <div key={count} className="lens-flash" />}
    </div>
  );
}

import type { CSSProperties } from 'react';
import type { Intensities } from '../basket/mix';
import { channels } from '../products';

const STANDBY = 0.14;

export function LightField({ intensities, className = '' }: { intensities: Intensities; className?: string }) {
  const standby = channels.every((channel) => intensities[channel] === 0);
  return (
    <div aria-hidden="true" className={`light-field ${className}`}>
      {channels.map((channel) => (
        <span
          key={channel}
          className={`light light-${channel}`}
          style={{ '--intensity': (standby ? STANDBY : intensities[channel]).toFixed(3) } as CSSProperties}
        />
      ))}
    </div>
  );
}

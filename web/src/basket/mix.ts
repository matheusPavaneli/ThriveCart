import { type Channel, channelOf, channels } from '../products';

export type Intensities = Readonly<Record<Channel, number>>;

export const MAX_INTENSITY = 0.85;

const light: Readonly<Record<Channel, readonly [number, number, number]>> = {
  red: [255, 92, 106],
  green: [52, 211, 153],
  blue: [107, 140, 255],
};

export function intensitiesOf(codes: readonly string[]): Intensities {
  const counts: Record<Channel, number> = { red: 0, green: 0, blue: 0 };
  for (const code of codes) {
    const channel = channelOf(code);
    if (channel) counts[channel] += 1;
  }
  const max = Math.max(...channels.map((c) => counts[c]));
  if (max === 0) return { red: 0, green: 0, blue: 0 };
  return {
    red: Math.sqrt(counts.red / max) * MAX_INTENSITY,
    green: Math.sqrt(counts.green / max) * MAX_INTENSITY,
    blue: Math.sqrt(counts.blue / max) * MAX_INTENSITY,
  };
}

export function mixOf(intensities: Intensities): string {
  const rgb = [0, 1, 2].map((i) =>
    Math.min(255, Math.round(channels.reduce((sum, c) => sum + (light[c][i] ?? 0) * intensities[c], 0))),
  );
  return `rgb(${rgb.join(' ')})`;
}

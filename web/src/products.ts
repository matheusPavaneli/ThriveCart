export type Channel = 'red' | 'green' | 'blue';

export const channels: readonly Channel[] = ['red', 'green', 'blue'];

const channelByCode: Readonly<Record<string, Channel>> = { R01: 'red', G01: 'green', B01: 'blue' };

export function channelOf(code: string): Channel | null {
  return channelByCode[code] ?? null;
}

export const ink: Readonly<Record<Channel, string>> = {
  red: 'bg-red-ink',
  green: 'bg-green-ink',
  blue: 'bg-blue-ink',
};

export const dot: Readonly<Record<Channel, string>> = {
  red: 'bg-red-light',
  green: 'bg-green-light',
  blue: 'bg-blue-light',
};

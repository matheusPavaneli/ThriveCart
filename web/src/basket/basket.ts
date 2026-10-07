export type BasketAction =
  | { type: 'add'; code: string }
  | { type: 'remove'; code: string }
  | { type: 'replace'; codes: readonly string[] };

export function basketReducer(codes: readonly string[], action: BasketAction): readonly string[] {
  switch (action.type) {
    case 'add':
      return [...codes, action.code];
    case 'remove': {
      const index = codes.lastIndexOf(action.code);
      return index === -1 ? codes : codes.toSpliced(index, 1);
    }
    case 'replace':
      return [...action.codes];
  }
}

export interface BasketLine {
  code: string;
  count: number;
}

export function linesOf(codes: readonly string[]): BasketLine[] {
  const counts = new Map<string, number>();
  for (const code of codes) counts.set(code, (counts.get(code) ?? 0) + 1);
  return [...counts].map(([code, count]) => ({ code, count }));
}

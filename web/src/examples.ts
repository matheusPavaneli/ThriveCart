export const exampleBaskets: readonly { codes: readonly string[]; expectedTotal: number }[] = [
  { codes: ['B01', 'G01'], expectedTotal: 3785 },
  { codes: ['R01', 'R01'], expectedTotal: 5437 },
  { codes: ['R01', 'G01'], expectedTotal: 6085 },
  { codes: ['B01', 'B01', 'R01', 'R01', 'R01'], expectedTotal: 9827 },
];

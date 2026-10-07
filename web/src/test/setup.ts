import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, vi } from 'vitest';

vi.mock('@number-flow/react', () => ({
  default: ({ value }: { value: number }) => createElement('span', null, String(value)),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { stubApi } from './test/fakeApi';

function desktop() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(min-width: 1024px)',
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

async function totalShows(amount: string) {
  const total = await screen.findByTestId('total');
  await vi.waitFor(() => expect(within(total).getByText(amount)).toBeInTheDocument());
}

describe('App', () => {
  beforeEach(() => {
    desktop();
    stubApi();
  });

  it.each([
    ['Blue Widget, Green Widget', '$37.85'],
    ['Red Widget, Red Widget', '$54.37'],
    ['Red Widget, Green Widget', '$60.85'],
    ['Blue Widget, Blue Widget, Red Widget, Red Widget, Red Widget', '$98.27'],
  ])('shows the PHP total for the example basket %s', async (names, total) => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: new RegExp(`^${names}\\. Expected total`) }));

    await totalShows(total);
    expect(await screen.findByRole('button', { name: new RegExp(`^${names}\\..*matches$`) })).toBeInTheDocument();
  });

  it('prices two red widgets added by hand, with the offer line', async () => {
    const user = userEvent.setup();
    render(<App />);

    const addRed = await screen.findByRole('button', { name: 'Add Red Widget' });
    await user.click(addRed);
    await totalShows('$37.90');
    await user.click(addRed);

    await totalShows('$54.37');
    const basket = screen.getByRole('region', { name: 'Your basket' });
    expect(within(basket).getByText('Red Widget offer')).toBeInTheDocument();
    expect(within(basket).getByText('$16.48')).toBeInTheDocument();
    expect(within(basket).getByText('$0.58 more for $2.95 delivery')).toBeInTheDocument();
  });

  it('shows an empty basket without a total', async () => {
    render(<App />);

    expect(await screen.findByText('Your basket is empty. Add a widget to switch the screen on.')).toBeInTheDocument();
    expect(screen.queryByTestId('total')).not.toBeInTheDocument();
  });

  it('tells the user how to start the service when it is down', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))),
    );
    render(<App />);

    const alerts = await screen.findAllByRole('alert');
    expect(alerts[0]).toHaveTextContent("Prices can't load because the basket service isn't responding.");
  });
});

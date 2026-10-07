interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  tone?: 'page' | 'screen';
}

export function ErrorState({ message, onRetry, tone = 'page' }: ErrorStateProps) {
  const button =
    tone === 'page'
      ? 'bg-ink text-fog hover:bg-ink/90'
      : 'bg-phosphor text-screen hover:bg-phosphor/90';
  return (
    <div role="alert" className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <p className={`max-w-[60ch] text-base ${tone === 'page' ? 'text-ink' : 'text-phosphor'}`}>{message}</p>
      <button type="button" onClick={onRetry} className={`button-press rounded-pill px-4 py-2 text-base font-medium ${button}`}>
        Try again
      </button>
    </div>
  );
}

import { AnimatePresence, m } from 'motion/react';
import { Dialog } from 'radix-ui';
import type { ComponentProps } from 'react';
import { BasketScreen } from './BasketScreen';

const DISMISS_DISTANCE_PX = 120;

type BasketSheetProps = Omit<ComponentProps<typeof BasketScreen>, 'renderTitle' | 'className'> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: () => void;
};

export default function BasketSheet({ open, onOpenChange, returnFocus, ...screen }: BasketSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <m.div
                className="fixed inset-0 z-50 bg-ink/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              forceMount
              aria-describedby={undefined}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                returnFocus();
              }}
            >
              <m.div
                className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-screen bg-screen pt-2 outline-none"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.6 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > DISMISS_DISTANCE_PX) onOpenChange(false);
                }}
              >
                <div aria-hidden="true" className="mx-auto mb-1 h-1 w-10 rounded-pill bg-white/20" />
                <BasketScreen
                  {...screen}
                  className="shadow-none"
                  renderTitle={(title, className) => <Dialog.Title className={className}>{title}</Dialog.Title>}
                />
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

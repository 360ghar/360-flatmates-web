import { Share, PlusSquare, ArrowUpToLine } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

interface PWAInstallInstructionsModalProps {
  open: boolean;
  onClose: () => void;
}

export function PWAInstallInstructionsModal({ open, onClose }: PWAInstallInstructionsModalProps) {
  return (
    <Modal
      open={open}
      title="Install 360 Flatmates"
      description="Add the app to your home screen for quick, one-tap access and a native app experience."
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={onClose} className="w-full">
          Got it
        </Button>
      }
    >
      <div className="flex flex-col gap-5 py-2">
        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-cut-md text-accent">
            <Share aria-hidden="true" className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-body-md font-semibold text-ink">1. Tap the Share button</h4>
            <p className="mt-1 text-caption text-ink-3">
              Look for the Safari share icon <Share className="inline-block h-3.5 w-3.5 mx-0.5" /> in the browser toolbar (typically at the bottom of your screen).
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-cut-md text-accent">
            <PlusSquare aria-hidden="true" className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-body-md font-semibold text-ink">2. Select "Add to Home Screen"</h4>
            <p className="mt-1 text-caption text-ink-3">
              Scroll down the share sheet menu list and tap <strong className="text-ink font-medium">Add to Home Screen</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-cut-md text-accent">
            <ArrowUpToLine aria-hidden="true" className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-body-md font-semibold text-ink">3. Confirm and Add</h4>
            <p className="mt-1 text-caption text-ink-3">
              Tap <strong className="text-ink font-medium">Add</strong> in the top-right corner. The icon will appear on your home screen like a standard app.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

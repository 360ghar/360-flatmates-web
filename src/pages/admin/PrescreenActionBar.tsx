import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PrescreenActionBar({
  disabled,
  onReject,
  onApprove
}: {
  disabled: boolean;
  onReject: () => void;
  onApprove: () => void;
}) {
  return (
    <div className="sticky bottom-0 z-[var(--z-sticky)] -mx-5 mt-6 border-t border-line bg-paper/88 px-5 py-3 backdrop-blur-[9px] md:-mx-6 md:px-6">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-end gap-3">
        <Button
          size="compact"
          variant="secondary"
          leadingIcon={<XCircle aria-hidden="true" className="h-4 w-4" />}
          onClick={onReject}
          disabled={disabled}
        >
          Reject
        </Button>
        <Button
          size="compact"
          variant="primary"
          leadingIcon={<CheckCircle2 aria-hidden="true" className="h-4 w-4" />}
          onClick={onApprove}
          disabled={disabled}
        >
          Approve
        </Button>
      </div>
    </div>
  );
}

import { CreditCard, Trash2 } from "lucide-react";
import { Page, PageHeader } from "@/components/ui/Layout";
import { useNavigate } from "react-router";
import { useState } from "react";
import { useDeletePaymentMethod, usePaymentMethods, useUpdatePaymentMethod } from "@/features/settings/hooks/usePayments";
import { uiStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { AsyncView, EmptyState } from "@/components/ui/StateViews";
import { PaymentMethodRowSkeleton } from "@/features/settings/components/PaymentMethodRowSkeleton";
import type { PaymentMethod } from "@/lib/api/types";

interface PaymentMethodRowProps {
  method: PaymentMethod;
  onDelete: (method: PaymentMethod) => void;
  onMakeDefault: (method: PaymentMethod) => void;
  actionsDisabled?: boolean;
  makeDefaultPending?: boolean;
}

function PaymentMethodRow({
  method,
  onDelete,
  onMakeDefault,
  actionsDisabled = false,
  makeDefaultPending = false
}: PaymentMethodRowProps) {
  const methodLabel = formatPaymentMethodLabel(method);

  return (
    <div className="flex flex-col gap-4 rounded-hand bg-surface paper-grain shadow-sm p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <CreditCard aria-hidden="true" className="h-5 w-5 shrink-0 text-ink-3" />
        <div className="flex flex-col min-w-0">
          <span className="truncate text-body-md text-ink font-semibold">
            {methodLabel}
            {method.nickname ? ` (${method.nickname})` : null}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {method.is_default ? (
          <span className="text-label-md text-pine">Default</span>
        ) : (
          <Button
            variant="secondary"
            size="compact"
            onClick={() => onMakeDefault(method)}
            loading={makeDefaultPending}
            disabled={actionsDisabled}
          >
            Make default
          </Button>
        )}
        <Button
          variant="icon"
          size="icon"
          aria-label={`Delete ${methodLabel} payment method`}
          onClick={() => onDelete(method)}
          disabled={actionsDisabled}
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function PaymentsPage() {
  const navigate = useNavigate();
  const { data: methods, isLoading, error, refetch } = usePaymentMethods();
  const deleteMethod = useDeletePaymentMethod();
  const updateMethod = useUpdatePaymentMethod();
  const [pendingDelete, setPendingDelete] = useState<PaymentMethod | null>(null);

  const handleMakeDefault = (method: PaymentMethod) => {
    if (method.is_default) return;
    updateMethod.mutate(
      { id: method.id, payload: { is_default: true } },
      {
        onSuccess: () =>
          uiStore.getState().pushToast({
            type: "success",
            title: "Default payment method updated"
          }),
        onError: () =>
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not update default"
          })
      }
    );
  };

  return (
    <Page width="narrow">
      <PageHeader title="Payment methods" />

      <p className="text-body-md text-ink-2 max-w-2xl">
        Save cards, UPI ids, and other payment instruments to make future
        bookings faster. Your full card details are tokenised by Razorpay and
        never touch our servers.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => navigate("/payments/new")}>Add payment method</Button>
      </div>

      <AsyncView
        data={methods ?? []}
        isLoading={isLoading}
        error={error}
        isEmpty={(data) => data.length === 0}
        onRetry={() => refetch()}
        loading={<PaymentMethodRowSkeleton count={3} />}
        empty={
          <EmptyState
            title="No payment methods yet"
            description="Add a card or UPI id to enable faster checkout."
            actionLabel="Add your first method"
            onAction={() => navigate("/payments/new")}
          />
        }
      >
        {(data) => (
          <div className="flex flex-col gap-3">
            {data.map((method) => (
              <PaymentMethodRow
                key={method.id}
                method={method}
                onDelete={setPendingDelete}
                onMakeDefault={handleMakeDefault}
                actionsDisabled={updateMethod.isPending || deleteMethod.isPending}
                makeDefaultPending={updateMethod.isPending}
              />
            ))}
          </div>
        )}
      </AsyncView>

      <Modal
        open={!!pendingDelete}
        title="Remove payment method?"
        onClose={() => setPendingDelete(null)}
      >
        {pendingDelete ? (
          <div className="flex flex-col gap-4">
            <p className="text-body-md text-ink-2">
              Are you sure you want to remove{" "}
              <strong>
                {pendingDelete.brand}
                {pendingDelete.last4 ? ` · •••• ${pendingDelete.last4}` : null}
              </strong>
              ? Future bookings will fall back to the gateway&apos;s default flow.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPendingDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                loading={deleteMethod.isPending}
                disabled={deleteMethod.isPending}
                onClick={() => {
                  if (!pendingDelete) return;
                  const id = pendingDelete.id;
                  deleteMethod.mutate(id, {
                    onSuccess: () => {
                      uiStore.getState().pushToast({
                        type: "success",
                        title: "Payment method removed"
                      });
                      setPendingDelete(null);
                    },
                    onError: () => {
                      uiStore.getState().pushToast({
                        type: "error",
                        title: "Could not remove payment method"
                      });
                    }
                  });
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </Page>
  );
}

function formatPaymentMethodLabel(method: PaymentMethod) {
  const brand = method.brand ?? method.method_type;
  return method.last4 ? `${brand} · •••• ${method.last4}` : brand;
}

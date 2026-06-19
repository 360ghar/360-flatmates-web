import { ArrowLeft, CreditCard, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import {
  useDeletePaymentMethod,
  usePaymentMethods,
  useUpdatePaymentMethod
} from "@/hooks/queries";
import { uiStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { AsyncView } from "@/components/ui/StateViews";
import { Skeleton } from "@/components/ui/Skeleton";
import type { PaymentMethod } from "@/lib/api/types";

interface PaymentMethodRowProps {
  method: PaymentMethod;
  onDelete: (method: PaymentMethod) => void;
  onMakeDefault: (method: PaymentMethod) => void;
}

function PaymentMethodRow({
  method,
  onDelete,
  onMakeDefault
}: PaymentMethodRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
          <CreditCard aria-hidden="true" className="h-4 w-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="truncate text-body-md text-ink font-semibold">
            {method.brand}
            {method.last4 ? ` · •••• ${method.last4}` : method.vpa ? ` · ${method.vpa}` : null}
            {method.nickname ? ` (${method.nickname})` : null}
          </span>
          {method.exp_month && method.exp_year ? (
            <span className="text-eyebrow text-ink-3 uppercase">
              Expires {String(method.exp_month).padStart(2, "0")}/{method.exp_year}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {method.is_default ? (
          <span className="rounded-full bg-accent-soft px-3 py-1 text-label-md text-accent font-semibold">
            Default
          </span>
        ) : (
          <Button
            variant="secondary"
            size="compact"
            className="rounded-full"
            onClick={() => onMakeDefault(method)}
          >
            Make default
          </Button>
        )}
        <Button
          variant="icon"
          size="icon"
          aria-label={`Delete ${method.brand} payment method`}
          onClick={() => onDelete(method)}
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
    <div className="flex flex-col gap-5 page-fade">
      <div className="flex items-center gap-3">
        <Button variant="icon" size="icon" onClick={() => navigate("/profile")}>
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        <h1 className="text-h1">Payment methods</h1>
      </div>

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
        loading={
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm"
              >
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-20 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        }
        empty={
          <Card className="p-8 text-center">
            <p className="text-h3 text-ink-2 font-semibold">No payment methods yet</p>
            <p className="mt-2 text-body-md text-ink-3">
              Add a card or UPI id to enable faster checkout.
            </p>
            <Button
              className="mt-4"
              onClick={() => navigate("/payments/new")}
            >
              Add your first method
            </Button>
          </Card>
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
                variant="primary"
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
    </div>
  );
}

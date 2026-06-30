import { ArrowLeft, CreditCard } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAddPaymentMethod } from "@/hooks/queries";
import { uiStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, SelectField } from "@/components/ui/Input";

/**
 * Form schema for adding a new payment method. Only the minimum surface is
 * enforced client-side — the actual sensitive fields (PAN, full card number,
 * UPI PIN) are tokenised by Razorpay and never see the wire from this page.
 */
const addPaymentMethodSchema = z
  .object({
    brand: z.string().min(1, "Brand is required"),
    razorpay_reference: z.string().trim().min(1, "Razorpay token or payment ID is required"),
    last4: z
      .string()
      .max(4, "Use the last 4 digits only")
      .regex(/^\d{0,4}$/, "Digits only")
      .optional()
      .or(z.literal("")),
    nickname: z.string().max(60).optional().or(z.literal("")),
    is_default: z.boolean().optional()
  })
  .superRefine((data, ctx) => {
    if (data.brand.toLowerCase() !== "upi") {
      if (!data.last4 || data.last4.length !== 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["last4"],
          message: "Last 4 digits are required for cards"
        });
      }
    }
  });

type AddPaymentMethodForm = z.infer<typeof addPaymentMethodSchema>;

const BRAND_OPTIONS = [
  { value: "Visa", label: "Visa" },
  { value: "Mastercard", label: "Mastercard" },
  { value: "American Express", label: "American Express" },
  { value: "RuPay", label: "RuPay" },
  { value: "UPI", label: "UPI" }
];

export function AddPaymentMethodPage() {
  const navigate = useNavigate();
  const addMethod = useAddPaymentMethod();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting }
  } = useForm<AddPaymentMethodForm>({
    resolver: zodResolver(addPaymentMethodSchema),
    defaultValues: {
      brand: "Visa",
      razorpay_reference: "",
      last4: "",
      nickname: "",
      is_default: false
    }
  });

  const selectedBrand = useWatch({ control, name: "brand" }) ?? "Visa";
  const isUpi = selectedBrand === "UPI";

  const onSubmit = (values: AddPaymentMethodForm) => {
    setServerError(null);
    const reference = values.razorpay_reference.trim();
    const referenceField = reference.startsWith("token_")
      ? { razorpay_token: reference }
      : { razorpay_payment_id: reference };
    addMethod.mutate(
      {
        method_type: isUpi ? "upi" : "card",
        brand: values.brand || undefined,
        last4: values.last4 || undefined,
        nickname: values.nickname || undefined,
        is_default: values.is_default,
        ...referenceField
      },
      {
        onSuccess: () => {
          uiStore.getState().pushToast({
            type: "success",
            title: "Payment method added"
          });
          navigate("/payments");
        },
        onError: (error) => {
          setServerError(
            error instanceof Error
              ? error.message
              : "Could not add payment method"
          );
        }
      }
    );
  };

  return (
    <div className="flex flex-col gap-5 page-fade max-w-2xl">
      <div className="flex items-center gap-3">
        <Button
          variant="icon"
          size="icon"
          aria-label="Back to payment methods"
          onClick={() => navigate("/payments")}
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        <h1 className="text-h1">Add payment method</h1>
      </div>

      <p className="text-body-md text-ink-2">
        Add a saved-method reference after Razorpay has tokenised the payment
        instrument. This page stores the token or payment ID plus display
        details only; never enter a full card number or UPI PIN here.
      </p>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <CreditCard aria-hidden="true" className="h-5 w-5 text-accent" />
            <span className="text-body-md text-ink font-semibold">Method details</span>
          </div>

          <div className="rounded-xl border border-warning/30 bg-warning-soft p-3 text-body-sm text-ink-2">
            Use the Razorpay checkout flow first, then paste the returned
            token ID or payment ID below. Card number, CVV, expiry, and UPI PIN
            belong in Razorpay, not in 360 Flatmates.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Brand"
              options={BRAND_OPTIONS}
              error={errors.brand?.message}
              {...register("brand")}
            />

            <Input
              label="Nickname"
              placeholder="e.g. Personal Visa"
              error={errors.nickname?.message}
              {...register("nickname")}
            />
          </div>

          <Input
            label={isUpi ? "Razorpay UPI reference" : "Razorpay card reference"}
            helperText="Accepted values are a Razorpay token ID, or the payment ID returned by a completed checkout."
            placeholder="token_... or pay_..."
            error={errors.razorpay_reference?.message}
            autoComplete="off"
            {...register("razorpay_reference")}
          />

          {!isUpi ? (
            <Input
              label="Last 4 digits"
              inputMode="numeric"
              maxLength={4}
              placeholder="1234"
              error={errors.last4?.message}
              {...register("last4")}
            />
          ) : null}

          <label className="flex items-center gap-2 text-body-md text-ink-2">
            <input
              type="checkbox"
              {...register("is_default")}
              className="h-4 w-4 rounded border-line text-accent"
            />
            <span>Use as default payment method</span>
          </label>

          {serverError ? (
            <p className="text-body-sm text-red-600" role="alert">
              {serverError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate("/payments")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting || addMethod.isPending}
              disabled={isSubmitting || addMethod.isPending}
            >
              Save method
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

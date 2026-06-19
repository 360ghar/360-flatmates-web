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
import { Input } from "@/components/ui/Input";

/**
 * Form schema for adding a new payment method. Only the minimum surface is
 * enforced client-side — the actual sensitive fields (PAN, full card number,
 * UPI PIN) are tokenised by Razorpay and never see the wire from this page.
 */
const addPaymentMethodSchema = z
  .object({
    brand: z.string().min(1, "Brand is required"),
    last4: z
      .string()
      .max(4, "Use the last 4 digits only")
      .regex(/^\d{0,4}$/, "Digits only")
      .optional()
      .or(z.literal("")),
    exp_month: z.string().optional().or(z.literal("")),
    exp_year: z.string().optional().or(z.literal("")),
    cardholder_name: z.string().max(120).optional().or(z.literal("")),
    vpa: z
      .string()
      .max(120)
      .regex(/^[a-zA-Z0-9._-]+@[a-zA-Z]{2,}$/, "Use a valid UPI handle")
      .optional()
      .or(z.literal("")),
    nickname: z.string().max(60).optional().or(z.literal("")),
    is_default: z.boolean().optional()
  })
  .superRefine((data, ctx) => {
    if (data.brand.toLowerCase() === "upi" && !data.vpa) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["vpa"],
        message: "UPI handle is required for UPI methods"
      });
    }
    if (data.brand.toLowerCase() !== "upi") {
      if (!data.last4 || data.last4.length !== 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["last4"],
          message: "Last 4 digits are required for cards"
        });
      }
      if (!data.exp_month || !data.exp_year) {
        if (!data.exp_month) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["exp_month"],
            message: "Expiry month is required"
          });
        }
        if (!data.exp_year) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["exp_year"],
            message: "Expiry year is required"
          });
        }
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
      last4: "",
      exp_month: undefined,
      exp_year: undefined,
      cardholder_name: "",
      vpa: "",
      nickname: "",
      is_default: false
    }
  });

  const selectedBrand = useWatch({ control, name: "brand" }) ?? "Visa";
  const isUpi = selectedBrand === "UPI";

  const onSubmit = (values: AddPaymentMethodForm) => {
    setServerError(null);
    addMethod.mutate(
      {
        brand: values.brand,
        last4: values.last4 || undefined,
        exp_month:
          values.exp_month && values.exp_month !== ""
            ? Number(values.exp_month)
            : undefined,
        exp_year:
          values.exp_year && values.exp_year !== ""
            ? Number(values.exp_year)
            : undefined,
        cardholder_name: values.cardholder_name || undefined,
        vpa: values.vpa || undefined,
        nickname: values.nickname || undefined,
        is_default: values.is_default
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
        <Button variant="icon" size="icon" onClick={() => navigate("/payments")}>
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        <h1 className="text-h1">Add payment method</h1>
      </div>

      <p className="text-body-md text-ink-2">
        Provide a tokenised reference to your payment method. Sensitive data
        (full card number, UPI PIN) must be collected through the Razorpay
        checkout widget — never store those fields directly.
      </p>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <CreditCard aria-hidden="true" className="h-5 w-5 text-accent" />
            <span className="text-body-md text-ink font-semibold">Method details</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-eyebrow uppercase tracking-widest text-ink-3">
                Brand
              </span>
              <select
                {...register("brand")}
                className="rounded-xl border border-line bg-surface px-3 py-2 text-body-md text-ink"
              >
                {BRAND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.brand ? (
                <span className="text-body-sm text-red-600">{errors.brand.message}</span>
              ) : null}
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-eyebrow uppercase tracking-widest text-ink-3">
                Nickname
              </span>
              <Input
                placeholder="e.g. Personal Visa"
                {...register("nickname")}
              />
            </label>
          </div>

          {isUpi ? (
            <label className="flex flex-col gap-1">
              <span className="text-eyebrow uppercase tracking-widest text-ink-3">
                UPI handle
              </span>
              <Input placeholder="name@bank" {...register("vpa")} />
              {errors.vpa ? (
                <span className="text-body-sm text-red-600">{errors.vpa.message}</span>
              ) : null}
            </label>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-eyebrow uppercase tracking-widest text-ink-3">
                    Last 4 digits
                  </span>
                  <Input
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="1234"
                    {...register("last4")}
                  />
                  {errors.last4 ? (
                    <span className="text-body-sm text-red-600">
                      {errors.last4.message}
                    </span>
                  ) : null}
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-eyebrow uppercase tracking-widest text-ink-3">
                    Cardholder name
                  </span>
                  <Input
                    placeholder="As on card"
                    {...register("cardholder_name")}
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-eyebrow uppercase tracking-widest text-ink-3">
                    Expiry month
                  </span>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    placeholder="MM"
                    {...register("exp_month")}
                  />
                  {errors.exp_month ? (
                    <span className="text-body-sm text-red-600">
                      {errors.exp_month.message}
                    </span>
                  ) : null}
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-eyebrow uppercase tracking-widest text-ink-3">
                    Expiry year
                  </span>
                  <Input
                    type="number"
                    min={2024}
                    max={2099}
                    placeholder="YYYY"
                    {...register("exp_year")}
                  />
                  {errors.exp_year ? (
                    <span className="text-body-sm text-red-600">
                      {errors.exp_year.message}
                    </span>
                  ) : null}
                </label>
              </div>
            </>
          )}

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
            <Button type="submit" disabled={isSubmitting || addMethod.isPending}>
              {addMethod.isPending ? "Saving…" : "Save method"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { ProfileFormData } from "./ProfileEditPage";

interface ProfileContactInfoSectionProps {
  register: UseFormRegister<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
  hasEmail: boolean;
  hasPhone: boolean;
}

export function ProfileContactInfoSection({
  register,
  errors,
  hasEmail,
  hasPhone
}: ProfileContactInfoSectionProps) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-h3">Contact Information</h2>
      <Input
        label="Email"
        type="email"
        readOnly={hasEmail}
        disabled={hasEmail}
        error={errors.email?.message}
        helperText={hasEmail ? "Email is verified and cannot be changed here." : undefined}
        placeholder={hasEmail ? undefined : "you@example.com"}
        {...register("email")}
      />
      <Input
        label="Phone Number"
        type="tel"
        readOnly={hasPhone}
        disabled={hasPhone}
        error={errors.phone?.message}
        helperText={hasPhone ? "Phone is verified and cannot be changed here." : "Enter a 10-digit mobile number."}
        placeholder={hasPhone ? undefined : "9876543210"}
        {...register("phone")}
      />
    </Card>
  );
}

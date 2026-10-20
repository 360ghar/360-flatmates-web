import { Link } from "react-router";
import { Card } from "@/components/ui/Card";
import { FactList } from "@/components/ui/FactList";

interface ProfileContactInfoSectionProps {
  email?: string | null;
  phone?: string | null;
}

/**
 * Sign-in email and phone, read only. The profile route does not accept
 * either: a phone is added through the add-phone step, and the email belongs
 * to the sign-in method.
 */
export function ProfileContactInfoSection({ email, phone }: ProfileContactInfoSectionProps) {
  const hasPhone = typeof phone === "string" && phone.trim().length > 0;
  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-h3 text-ink">Contact information</h2>
      <FactList
        className="sm:grid-cols-2"
        facts={[
          ["Email", email?.trim() || "Not set"],
          ["Phone", hasPhone ? phone : "Not set"]
        ]}
      />
      {hasPhone ? (
        <p className="text-caption text-ink-3">Email and phone are verified at sign-in and cannot be changed here.</p>
      ) : (
        <p className="text-caption text-ink-3">
          This account has no phone number.{" "}
          <Link to="/add-phone" className="font-semibold text-clay">Add a phone number</Link>.
        </p>
      )}
    </Card>
  );
}

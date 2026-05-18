import { Link } from "react-router";
import { Search } from "lucide-react";
import { focusRing } from "@/components/ui/component-utils";
import { FullPageMessage } from "@/components/ui/FullPageMessage";

export function NotFoundPage() {
  return (
    <FullPageMessage
      icon={<Search aria-hidden className="size-12" />}
      iconClassName="bg-accent-soft text-accent"
      title="Page not found"
      description="The page you are looking for does not exist or has been moved."
      action={
        <Link
          to="/"
          className={`inline-flex h-12 items-center justify-center rounded-[10px] bg-accent px-6 text-label-lg text-white shadow-cta ${focusRing}`}
        >
          Go Home
        </Link>
      }
    />
  );
}

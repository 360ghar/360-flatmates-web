import { Link } from "react-router";
import { TriangleAlert } from "lucide-react";

import { buttonClasses } from "@/components/ui/Button";
import { FullPageMessage } from "@/components/ui/FullPageMessage";

export function ErrorPage() {
  return (
    <FullPageMessage
      icon={<TriangleAlert aria-hidden className="size-12" />}
      title="Something went wrong"
      description="We are having trouble loading this page. Please try again."
      action={
        <Link to="/" className={buttonClasses("primary", "default", false)}>
          Try Again
        </Link>
      }
      className="px-5"
    />
  );
}

import { Link } from "react-router";
import { Settings } from "lucide-react";

import { buttonClasses } from "@/components/ui/Button";
import { FullPageMessage } from "@/components/ui/FullPageMessage";

export function MaintenancePage() {
  return (
    <FullPageMessage
      icon={<Settings aria-hidden className="size-12" />}
      title="We will be back soon"
      description="We are making some improvements. Estimated downtime: 30 minutes."
      action={
        <Link to="/stats" className={buttonClasses("tertiary", "default", false)}>
          Check Status
        </Link>
      }
      className="px-5"
    />
  );
}

import { Link } from "react-router";
import { SeoHelmet, SITE_URL } from "@/lib/seo";
import { buttonClasses } from "@/components/ui/component-utils";
import { FullPageMessage } from "@/components/ui/FullPageMessage";

export function MaintenancePage() {
  return (
    <>
      <SeoHelmet
        title="Site Maintenance"
        description="360 Flatmates is currently undergoing scheduled maintenance. We'll be back shortly."
        canonicalUrl={`${SITE_URL}/maintenance`}
        noindex
      />
      <FullPageMessage
        scene="house"
        title="We will be right back"
        description="360 Flatmates is down for planned maintenance. Your chats, visits and listings are safe."
        action={<Link to="/" className={buttonClasses("primary")}>Try the home page</Link>}
      />
    </>
  );
}

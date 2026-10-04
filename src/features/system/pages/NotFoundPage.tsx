import { Link } from "react-router";
import { SeoHelmet, SITE_URL } from "@/lib/seo";
import { buttonClasses } from "@/components/ui/component-utils";
import { FullPageMessage } from "@/components/ui/FullPageMessage";

export function NotFoundPage() {
  return (
    <>
      <SeoHelmet
        title="Page Not Found"
        description="The page you are looking for does not exist or has been moved. Return to the 360 Flatmates homepage to find compatible flatmates and verified rooms."
        canonicalUrl={`${SITE_URL}/404`}
        noindex
      />
      <FullPageMessage
        scene="magnifier"
        title="This page is not here"
        description="It may have moved, or the link has a typo."
        action={
          <>
            <Link to="/" className={buttonClasses("primary")}>Go to the home page</Link>
            <Link to="/discover" className={buttonClasses("tertiary")}>Browse rooms</Link>
          </>
        }
      />
    </>
  );
}

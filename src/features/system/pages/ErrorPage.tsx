import { Link } from "react-router";
import { SeoHelmet, SITE_URL } from "@/lib/seo";
import { Button } from "@/components/ui/Button";
import { buttonClasses } from "@/components/ui/component-utils";
import { FullPageMessage } from "@/components/ui/FullPageMessage";

export function ErrorPage() {
  return (
    <>
      <SeoHelmet
        title="Something Went Wrong"
        description="An unexpected error occurred on 360 Flatmates. Please try again or return to the homepage."
        canonicalUrl={`${SITE_URL}/error`}
        noindex
      />
      <FullPageMessage
        title="Something went wrong"
        description="Refresh the page to try again. If it keeps happening, come back in a few minutes."
        action={
          <>
            <Button onClick={() => window.location.reload()}>Refresh the page</Button>
            <Link to="/" className={buttonClasses("tertiary")}>Go to the home page</Link>
          </>
        }
      />
    </>
  );
}

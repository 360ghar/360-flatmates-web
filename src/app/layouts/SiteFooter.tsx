import { Link } from "react-router";
import type { SVGProps } from "react";
import { Instagram, Linkedin } from "lucide-react";
import { PaperScene } from "@/components/paper/PaperScene";
import { Logo } from "@/components/ui/Logo";
import { buttonClasses, cn, focusRing } from "@/components/ui/component-utils";
import { APP_STORE_URL, PLAY_STORE_URL, SUPPORTED_CITIES } from "@/lib/seo/config";

/** The X mark (Simple Icons, CC0). lucide only has the retired Twitter bird. */
function XLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { href: "https://www.instagram.com/360ghar", label: "Instagram", Icon: Instagram },
  { href: "https://www.linkedin.com/company/360ghar", label: "LinkedIn", Icon: Linkedin },
  { href: "https://x.com/360ghar", label: "X", Icon: XLogo }
] as const;

const LINK_GROUPS = [
  {
    title: "Find a place",
    links: [
      { to: "/discover", label: "Browse rooms" },
      { to: "/search", label: "Search" },
      ...SUPPORTED_CITIES.map((city) => ({ to: `/cities/${city.slug}`, label: city.name }))
    ]
  },
  {
    title: "Learn",
    links: [
      { to: "/blog", label: "Guides" },
      { to: "/compare/360-flatmates-vs-nobroker", label: "Compare apps" },
      { to: "/about", label: "About" }
    ]
  },
  {
    title: "Legal",
    links: [
      { to: "/terms", label: "Terms" },
      { to: "/privacy", label: "Privacy" }
    ]
  }
];

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.46 2.208 3.09 3.792 3.029 1.52-.065 2.09-.987 3.925-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
    </svg>
  );
}

function GooglePlayLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.485 1.485 0 0 0-.227.795v21.44a1.49 1.49 0 0 0 .227.852l11.268-11.19L1.337.924zm11.625 12.376l1.696-1.688L3.334 23.15c.276.177.609.22.918.071l12.214-6.904-3.504-3.017zM3.334.822l11.324 11.579 3.504-3.017L6.252.751A1.49 1.49 0 0 0 3.334.822z" />
    </svg>
  );
}

const STORE_BADGES = [
  { href: APP_STORE_URL, Icon: AppleLogo, small: "Download on the", name: "App Store" },
  { href: PLAY_STORE_URL, Icon: GooglePlayLogo, small: "Get it on", name: "Google Play" }
];

/**
 * Every public page ends at night: the same neighbourhood under the moon with
 * the closing line in its sky, and the links on the ground below. The subtree
 * is data-theme="dark", so it uses the night tokens in either theme.
 */
export function SiteFooter() {
  return (
    <footer data-theme="dark" className="paper-edge-torn-top relative mt-10 bg-sky text-ink">
      <PaperScene time="night" edgeClassName="bg-paper-1" className="h-[480px] md:h-[540px]">
        <div className="page-container pt-[calc(var(--torn-depth)+48px)] md:pt-20">
          <p className="max-w-[24ch] text-h1 text-ink md:text-display">Your next home is a few good conversations away.</p>
          <Link to="/discover" className={cn(buttonClasses("primary", "tall"), "mt-7")}>
            Start matching
          </Link>
        </div>
      </PaperScene>

      <div className="paper-grain bg-paper-1 pb-[calc(24px+env(safe-area-inset-bottom))]">
        <div className="page-container grid gap-10 py-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <Logo compact />
            <p className="mt-3 max-w-[38ch] text-body-lg text-ink-2">
              Rooms and flatmates matched on how you live, with visits and chat in one place.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {STORE_BADGES.map(({ href, Icon, small, name }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${small} ${name} (opens in a new tab)`}
                  className={cn("inline-flex min-h-12 items-center gap-2.5 rounded-cut-md bg-ink px-4 text-sky shadow-xs hover:bg-ink-2", focusRing)}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="flex flex-col leading-none">
                    <span className="text-micro font-normal">{small}</span>
                    <span className="mt-0.5 text-label-lg">{name}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
            {LINK_GROUPS.map((group) => (
              <div key={group.title}>
                <h2 className="text-h3 text-ink">{group.title}</h2>
                <ul className="mt-2 flex flex-col">
                  {group.links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className={cn("-mx-2 inline-flex min-h-11 items-center rounded-cut-sm px-2 text-body-lg text-ink-2 hover:text-ink", focusRing)}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="page-container flex flex-col-reverse items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-caption text-ink-3">&copy; {new Date().getFullYear()} 360 Flatmates, by 360 Ghar.</p>
          <div className="-ml-2.5 flex items-center gap-1 sm:ml-0 sm:-mr-2.5">
            {SOCIAL_LINKS.map(({ href, label, Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${label} (opens in a new tab)`}
                className={cn("grid h-11 w-11 place-items-center rounded-cut-md text-ink-2 hover:bg-surface-soft hover:text-ink", focusRing)}
              >
                <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

import { Link } from "react-router";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  HelpCircle,
  MessageSquare,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MenuItemRow } from "@/components/molecules";

const HELP_CATEGORIES = [
  {
    icon: BookOpen,
    label: "Getting Started",
    description: "Setup, onboarding, and first steps",
    href: "/about",
  },
  {
    icon: FileText,
    label: "Listings & Properties",
    description: "Posting, managing, and finding rooms",
    href: "#listings",
  },
  {
    icon: Shield,
    label: "Safety & Verification",
    description: "Account security, reporting, and trust",
    href: "#safety",
  },
  {
    icon: MessageSquare,
    label: "Chat & Communication",
    description: "Messaging, notifications, and preferences",
    href: "#chat",
  },
];

export function HelpPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-5 page-fade">
      <div className="flex items-center gap-3">
        <Button
          aria-label="Back to profile"
          variant="icon"
          size="icon"
          onClick={() => navigate("/profile")}
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        <h1 className="text-h1">Help & Support</h1>
      </div>

      <Card className="p-5">
        <div className="flex items-start gap-3">
          <HelpCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <h2 className="text-h3">How can we help?</h2>
            <p className="mt-1 text-body-md text-ink-2">
              Browse common topics below or contact our support team.
            </p>
          </div>
        </div>
      </Card>

      <Card className="divide-y divide-line p-0">
        {HELP_CATEGORIES.map((item) => {
          const Icon = item.icon;
          return (
            <MenuItemRow
              key={item.label}
              icon={Icon}
              label={item.label}
              description={item.description}
              onClick={() => {
                if (item.href.startsWith("#")) {
                  document
                    .getElementById(item.href.slice(1))
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                } else {
                  navigate(item.href);
                }
              }}
            />
          );
        })}
      </Card>

      <section id="listings" className="flex flex-col gap-3 scroll-mt-4">
        <h2 className="text-h2">Listings &amp; Properties</h2>
        <Card className="p-5 flex flex-col gap-3 text-body-md text-ink-2">
          <p>
            Listings are rooms or properties shared by room posters. Use the{" "}
            <Link to="/post" className="text-accent underline">Post a Room</Link>{" "}
            flow to publish a new listing, and visit{" "}
            <Link to="/manage" className="text-accent underline">Manage Listings</Link>{" "}
            to edit, pause, or remove a listing you have already created.
          </p>
          <p>
            Looking for a room? Open{" "}
            <Link to="/explore" className="text-accent underline">Explore</Link>{" "}
            to browse available listings and save filters for later.
          </p>
        </Card>
      </section>

      <section id="safety" className="flex flex-col gap-3 scroll-mt-4">
        <h2 className="text-h2">Safety &amp; Verification</h2>
        <Card className="p-5 flex flex-col gap-3 text-body-md text-ink-2">
          <p>
            Your safety matters. Use{" "}
            <Link to="/settings/blocked-users" className="text-accent underline">Blocked Users</Link>{" "}
            to manage who can contact you, report suspicious accounts from any
            profile or chat thread, or send product issues through{" "}
            <Link to="/settings/report-problem" className="text-accent underline">Report a Problem</Link>.
          </p>
          <p>
            Trust badges and profile completeness indicators are shown directly
            on profiles. Keep your profile details and photos current so other
            users can assess your fit accurately.
          </p>
        </Card>
      </section>

      <section id="chat" className="flex flex-col gap-3 scroll-mt-4">
        <h2 className="text-h2">Chat &amp; Communication</h2>
        <Card className="p-5 flex flex-col gap-3 text-body-md text-ink-2">
          <p>
            Conversations live in the{" "}
            <Link to="/chats" className="text-accent underline">Chats</Link>{" "}
            tab. Adjust notification delivery and quiet hours from{" "}
            <Link to="/settings/notifications" className="text-accent underline">Notification Settings</Link>.
          </p>
          <p>
            Need to reschedule or cancel a property visit? Open the{" "}
            <Link to="/visits" className="text-accent underline">Visits</Link>{" "}
            page to manage upcoming and past visits.
          </p>
        </Card>
      </section>

      <Card className="p-5">
        <h2 className="text-h3 mb-2">Need more help?</h2>
        <p className="text-body-md text-ink-2 mb-4">
          Our support team typically responds within 24 hours.
        </p>
        {/* TODO: replace mailto with a dedicated /support route once the
            backend exposes a support-ticket endpoint. Until then this link
            opens the user's mail client to support@360ghar.com. */}
        <Button as="a" href="mailto:support@360ghar.com" variant="secondary" fullWidth>
          Contact Support
        </Button>
      </Card>
    </div>
  );
}

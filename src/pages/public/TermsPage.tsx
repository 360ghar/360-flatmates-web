import { SeoHelmet, SITE_URL } from "@/lib/seo";

import { LegalPage } from "@/components/molecules/LegalPage";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing and using 360 Flatmates, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you must not use our services.",
  },
  {
    title: "2. Service Description",
    content:
      "360 Flatmates is a platform that helps users find compatible flatmates and verified rental listings across India. We provide matching algorithms, listing tools, visit scheduling, and in-app communication features.",
  },
  {
    title: "3. User Accounts",
    content:
      "You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Phone verification via OTP is required for all accounts.",
  },
  {
    title: "4. User Content",
    content:
      "You retain ownership of content you submit to the platform. By posting listings, profiles, or messages, you grant 360 Flatmates a non-exclusive, worldwide license to display and distribute your content within the service. You must not post content that is misleading, offensive, or violates any third-party rights.",
  },
  {
    title: "5. Listings and Verification",
    content:
      "All property listings are subject to review before publication. 360 Flatmates reserves the right to reject, modify, or remove listings that do not meet our quality standards or that contain inaccurate information. Verification badges indicate that our team has reviewed the listing; they do not constitute a guarantee of accuracy.",
  },
  {
    title: "6. Compatibility Matching",
    content:
      "Our matching algorithm provides compatibility scores based on self-reported lifestyle preferences. These scores are advisory only and do not guarantee a successful living arrangement. Users should exercise their own judgment when selecting flatmates.",
  },
  {
    title: "7. Payments and Refunds",
    content:
      "Certain features may require payment. All fees are listed in Indian Rupees (INR) and are inclusive of applicable taxes. Refunds are handled on a case-by-case basis per our refund policy. We do not store payment card details on our servers.",
  },
  {
    title: "8. Prohibited Conduct",
    content:
      "You must not use the service for any illegal purpose, harass other users, post fraudulent listings, attempt to circumvent security measures, or use automated tools to scrape or collect data from the platform without authorization.",
  },
  {
    title: "9. Termination",
    content:
      "We may suspend or terminate your access to the service at any time for violation of these terms or for conduct that we reasonably believe is harmful to other users or the platform. You may delete your account at any time through your account settings.",
  },
  {
    title: "10. Limitation of Liability",
    content:
      "360 Flatmates provides a platform for connecting users and does not participate in any transactions between users. We are not liable for any disputes, damages, or losses arising from interactions between users, including but not limited to rental agreements, security deposits, or living arrangements.",
  },
  {
    title: "11. Changes to Terms",
    content:
      "We may update these terms from time to time. Material changes will be communicated via email or in-app notification at least 14 days before they take effect. Continued use of the service after changes take effect constitutes acceptance of the updated terms.",
  },
  {
    title: "12. Governing Law",
    content:
      "These terms are governed by the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka.",
  },
] as const;

export function TermsPage() {
  return (
    <>
      <SeoHelmet
        title="Terms & Conditions"
        description="Read the 360 Flatmates terms and conditions. Understand your rights and responsibilities when using our flatmate matching, listing, and communication services."
        canonicalUrl={`${SITE_URL}/terms`}
      />
      <LegalPage
        heading="Terms & Conditions"
        updatedAt="January 2025"
        sections={SECTIONS.map((s) => ({ title: s.title, content: s.content }))}
      />
    </>
  );
}

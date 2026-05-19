import { SeoHelmet, SITE_URL } from "@/lib/seo";

import { LegalPage } from "@/components/organisms/LegalPage";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    content:
      "We collect information you provide directly: your name, phone number, email, profile details, lifestyle preferences, and listing content. We also collect usage data such as pages visited, features used, and device information for analytics and service improvement.",
  },
  {
    title: "2. How We Use Your Information",
    content:
      "We use your information to provide and improve the flatmate matching service, verify your identity via phone OTP, display compatibility scores, facilitate communication between matched users, send relevant notifications, and ensure platform safety through moderation.",
  },
  {
    title: "3. Information Sharing",
    content:
      "We do not sell your personal information. We share limited profile data with matched flatmates as needed for the service. Your phone number is never displayed publicly; communication happens through in-app chat until you choose to share contact details. We may disclose information to comply with legal obligations.",
  },
  {
    title: "4. Data Storage and Security",
    content:
      "Your data is stored on secure servers with encryption at rest and in transit. We use Supabase for authentication and data storage, which provides industry-standard security measures including SOC 2 compliance. We retain your data for as long as your account is active or as needed to provide services.",
  },
  {
    title: "5. Cookies and Tracking",
    content:
      "We use essential cookies for authentication and session management. Analytics cookies help us understand usage patterns and improve the service. You can control cookie preferences through your browser settings. We do not use cookies for third-party advertising.",
  },
  {
    title: "6. Your Rights",
    content:
      "You have the right to access, correct, or delete your personal data. You can download your data or delete your account through app settings. Upon account deletion, we will remove your personal information within 30 days, except where retention is required by law.",
  },
  {
    title: "7. Third-Party Services",
    content:
      "We use third-party services for authentication (Supabase), analytics, and image hosting. These services have their own privacy policies. We only share the minimum information necessary for these services to function. We do not grant third parties access to your data for their own marketing purposes.",
  },
  {
    title: "8. Children's Privacy",
    content:
      "360 Flatmates is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that a child under 18 has provided us with personal data, we will take steps to delete such information.",
  },
  {
    title: "9. International Data Transfers",
    content:
      "Your data may be processed on servers located outside India. By using our service, you consent to the transfer of your data to these jurisdictions. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws.",
  },
  {
    title: "10. Changes to This Policy",
    content:
      "We may update this privacy policy from time to time. Material changes will be communicated via email or in-app notification at least 14 days before they take effect. We encourage you to review this page periodically for the latest information on our privacy practices.",
  },
  {
    title: "11. Contact Us",
    content:
      "If you have questions about this privacy policy or your personal data, please contact us at privacy@360ghar.com. We will respond to your request within 30 days.",
  },
] as const;

export function PrivacyPage() {
  return (
    <>
      <SeoHelmet
        title="Privacy Policy"
        description="Read the 360 Flatmates privacy policy. Learn how we collect, use, and protect your personal data, including phone verification, profile information, and communication records."
        canonicalUrl={`${SITE_URL}/privacy`}
      />
      <LegalPage
        heading="Privacy Policy"
        updatedAt="January 2025"
        sections={SECTIONS.map((s) => ({ title: s.title, content: s.content }))}
      />
    </>
  );
}

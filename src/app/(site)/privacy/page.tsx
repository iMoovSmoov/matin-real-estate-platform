import type { Metadata } from "next";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { company } from "@/lib/data";

export const metadata: Metadata = {
  title: "Privacy Policy | Matin Real Estate",
  description: "Learn how Matin Real Estate collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <Section className="pt-28">
      <Container>
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            eyebrow="Legal"
            title="Privacy Policy"
            intro="Effective June 2026"
          />

          <div className="mt-12 space-y-10 text-[0.95rem] leading-relaxed text-slate">

            <div>
              <h2 className="font-display text-xl text-ink mb-3">Information We Collect</h2>
              <p>
                We collect information you provide directly — such as your name, email address, phone number,
                and property preferences — when you submit forms, request information, or create an account on
                our site. We also collect usage data automatically, including pages visited, browser type, IP
                address, and referring URLs, through standard web analytics tools.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl text-ink mb-3">How We Use Information</h2>
              <p>
                We use your information to respond to inquiries, match you with relevant listings and agents,
                send market updates and property alerts you have requested, and improve our website and
                services. We may also use contact details to send periodic newsletters or promotional
                communications; you may opt out at any time via the unsubscribe link in any email.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl text-ink mb-3">Information Sharing</h2>
              <p>
                We do not sell or rent your personal information to third parties. We may share your
                information with licensed Matin Real Estate brokers working on your transaction, trusted
                service providers (such as lenders, title companies, or email platforms) under confidentiality
                agreements, and as required by law or to protect our legal rights. Any third party we work
                with is contractually obligated to use your data only to perform services on our behalf.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl text-ink mb-3">Cookies</h2>
              <p>
                Our website uses cookies and similar tracking technologies to remember your preferences,
                analyze site traffic, and support marketing efforts. You can control cookie settings through
                your browser preferences. Disabling cookies may affect certain site functionality, such as
                saved searches and personalized listing alerts.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl text-ink mb-3">Your Rights</h2>
              <p>
                You have the right to access, correct, or delete the personal information we hold about you.
                Oregon and Washington residents may have additional rights under applicable state privacy
                laws. To exercise any of these rights, please contact us using the information below. We will
                respond to verified requests within 30 days.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl text-ink mb-3">Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or how we handle your information, please
                reach out to us at:
              </p>
              <address className="mt-3 not-italic text-ink/80">
                <strong>{company.name}</strong><br />
                {company.address.street}<br />
                {company.address.city}, {company.address.state} {company.address.zip}<br />
                <a href={`mailto:${company.email}`} className="text-ink underline underline-offset-2 hover:opacity-70 transition-opacity">
                  {company.email}
                </a>
              </address>
              <p className="mt-4 text-sm text-slate/70">
                We may update this Privacy Policy periodically. Material changes will be communicated by
                updating the effective date at the top of this page.
              </p>
            </div>

          </div>
        </div>
      </Container>
    </Section>
  );
}

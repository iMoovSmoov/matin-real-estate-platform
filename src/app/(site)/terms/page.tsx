import type { Metadata } from "next";
import { Section, Container, SectionHeading } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Terms of Service | Matin Real Estate",
  description: "The terms and conditions governing your use of the Matin Real Estate website and services.",
};

export default function TermsPage() {
  return (
    <Section className="pt-28">
      <Container>
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            eyebrow="Legal"
            title="Terms of Service"
            intro="Effective June 2026"
          />

          <div className="mt-12 space-y-10 text-[0.95rem] leading-relaxed text-slate">

            <div>
              <h2 className="font-display text-xl text-ink mb-3">Acceptance</h2>
              <p>
                By accessing or using the Matin Real Estate website (matinrealestate.com) or any of our
                services, you agree to be bound by these Terms of Service. If you do not agree to these
                terms, please do not use our site. We reserve the right to modify these terms at any time;
                continued use after changes are posted constitutes your acceptance of the revised terms.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl text-ink mb-3">Use of Services</h2>
              <p>
                You agree to use our website and services only for lawful purposes and in a manner that does
                not infringe the rights of others. You may not: (a) use automated tools to scrape or copy
                listing data without written permission; (b) transmit any unsolicited commercial communications;
                (c) attempt to gain unauthorized access to any part of our systems; or (d) misrepresent your
                identity or affiliation when using our services. We reserve the right to suspend or terminate
                access for violations of these terms.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl text-ink mb-3">Intellectual Property</h2>
              <p>
                All content on this website — including text, images, logos, listing data, and software — is
                the property of Matin Real Estate or its licensors and is protected by applicable copyright,
                trademark, and intellectual property laws. You may view and print content for personal,
                non-commercial use only. Any other reproduction, distribution, or modification without our
                prior written consent is prohibited.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl text-ink mb-3">Disclaimer</h2>
              <p>
                The information on this website — including property listings, market data, and neighborhood
                guides — is provided for general informational purposes only. While we strive for accuracy,
                we make no warranties, express or implied, regarding the completeness, reliability, or
                suitability of any information for a particular purpose. Real estate transactions involve
                significant financial decisions; always verify information independently and consult with
                qualified professionals before acting.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl text-ink mb-3">Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, Matin Real Estate and its agents, officers, and
                employees shall not be liable for any indirect, incidental, consequential, or punitive damages
                arising from your use of, or inability to use, this website or our services. Our total
                liability for any claim arising from these terms shall not exceed the amount you paid us for
                the specific service giving rise to the claim, or one hundred dollars ($100), whichever is
                greater.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl text-ink mb-3">Contact</h2>
              <p>
                Questions about these Terms of Service? Please contact us:
              </p>
              <address className="mt-3 not-italic text-ink/80">
                <strong>Matin Real Estate</strong><br />
                1900 SW 4th Ave, Suite 100<br />
                Portland, OR 97201<br />
                <a href="mailto:info@matinrealestate.com" className="text-ink underline underline-offset-2 hover:opacity-70 transition-opacity">
                  info@matinrealestate.com
                </a>
              </address>
              <p className="mt-4 text-sm text-slate/70">
                These Terms of Service are governed by the laws of the State of Oregon without regard to
                conflict of law principles.
              </p>
            </div>

          </div>
        </div>
      </Container>
    </Section>
  );
}

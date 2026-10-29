import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "@/components/doc-page";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Community guidelines" };

export default function GuidelinesPage() {
  return (
    <DocPage title="Community guidelines" updated="October 29, 2026">
      <p>
        Aggie Connect works because Aggies trust each other. By joining, you
        agree to these guidelines and our <Link href="/privacy">privacy policy</Link>.
      </p>

      <h2>Be a real Aggie</h2>
      <ul>
        <li>Use your real name and a real photo of yourself (or no photo).</li>
        <li>
          Join only if you are a current or former NC A&amp;T student, and list
          your real class year.
        </li>
        <li>One account per person.</li>
      </ul>

      <h2>Be respectful</h2>
      <ul>
        <li>No harassment, hate speech, threats or bullying.</li>
        <li>
          If someone ignores or declines your connection request, let it go.
        </li>
        <li>Keep it professional: this is a career and community network.</li>
      </ul>

      <h2>No spam or selling</h2>
      <ul>
        <li>
          No mass connection requests, pyramid or MLM pitches, crypto schemes, or
          unsolicited sales.
        </li>
        <li>
          Job postings and referrals are welcome when they&apos;re real and
          relevant.
        </li>
      </ul>

      <h2>Protect each other&apos;s privacy</h2>
      <ul>
        <li>
          Don&apos;t copy, scrape or share other members&apos; information
          outside Aggie Connect.
        </li>
        <li>Don&apos;t post anyone else&apos;s private information.</li>
      </ul>

      <h2>When something&apos;s wrong</h2>
      <p>
        Use <strong>Report</strong> at the bottom of any profile. Reports go
        only to the site admins, and the member you report isn&apos;t told who
        reported them.
        {CONTACT_EMAIL && (
          <>
            {" "}
            For anything else, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </>
        )}
      </p>
      <p>
        Admins may suspend or remove accounts that break these guidelines,
        including fake accounts and anyone who isn&apos;t an Aggie.
      </p>
    </DocPage>
  );
}

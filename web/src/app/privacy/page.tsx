import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "@/components/doc-page";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <DocPage title="Privacy policy" updated="October 29, 2026">
      <p>
        Aggie Connect is a student-run network for North Carolina A&amp;T
        students and alumni. It is not affiliated with or endorsed by the
        university. This page says, in plain language, what we collect, who can
        see it, and how to delete it.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Your account:</strong> name, email address, password (stored
          only as a secure hash), whether you&apos;re a student or alumni, and
          your class year.
        </li>
        <li>
          <strong>What you add to your profile:</strong> photo, headline, job
          title, company, major, city, LinkedIn URL, bio, and what you&apos;re
          open to helping with. All of it is optional.
        </li>
        <li>
          <strong>Your connections:</strong> who you connect with, and any
          reports you file about other members.
        </li>
        <li>
          <strong>Basic sign-in records:</strong> when your account was created
          and when you last signed in.
        </li>
      </ul>
      <p>
        We don&apos;t use analytics, advertising or tracking cookies. The only
        cookies are the ones that keep you signed in. Photos are re-encoded when
        you upload them, which removes hidden data such as GPS location.
      </p>

      <h2>Who can see it</h2>
      <ul>
        <li>
          <strong>Approved members</strong> can see your profile and photo.
          Nothing is public on the open web or visible to search engines.
        </li>
        <li>
          <strong>Your email address is never shown to other members.</strong>{" "}
          Only site admins can see it, to manage accounts.
        </li>
        <li>
          Admins can see reports and the admin activity log. Every admin action
          is recorded.
        </li>
      </ul>

      <h2>Who we share it with</h2>
      <p>
        We never sell your data or share it for marketing. It&apos;s stored and
        processed by the services that run the site: Supabase (database, sign-in
        and photos), Vercel (hosting) and our email provider (to send
        confirmation and password-reset emails).
      </p>

      <h2>Deleting your account</h2>
      <p>
        You can delete your account at any time from{" "}
        <Link href="/profile/edit">Edit profile</Link>, at the bottom of the
        page. It removes your profile, photo and connections right away. Copies
        can stay in our database backups for a short time (up to about a week)
        until those backups expire.
      </p>

      <h2>Keeping it safe</h2>
      <p>
        Access to member data is enforced by the database itself, admins must
        use two-factor authentication, and all traffic to the site is encrypted. No system
        is perfect: if we ever learn of a breach that affects you, we&apos;ll tell
        you.
      </p>

      <h2>Students</h2>
      <p>
        Aggie Connect is not a university system and doesn&apos;t receive any
        records from NC A&amp;T. Only share what you&apos;re comfortable with
        other members seeing.
      </p>

      <h2>Changes and questions</h2>
      <p>
        If this policy changes in a way that matters, we&apos;ll update the date
        above and let members know.{" "}
        {CONTACT_EMAIL ? (
          <>
            Questions? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </>
        ) : (
          <>Questions? Reach out to a site admin.</>
        )}
      </p>
      <p>
        See also the <Link href="/guidelines">community guidelines</Link>.
      </p>
    </DocPage>
  );
}

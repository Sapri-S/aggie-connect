import Link from "next/link";

const FEATURES = [
  {
    title: "Find a mentor",
    body: "Get matched with former students in the field you're aiming for, and see why each match fits.",
  },
  {
    title: "Hiring Aggies",
    body: "Jobs posted by former students who want to hire Ags, with referral requests built in.",
  },
  {
    title: "Your class, your city",
    body: "Search by class year, major, industry or city. See which Aggies are near you.",
  },
];

// Static: signed-in visitors are sent to /home by the proxy.
export default function Landing() {
  return (
    <div>
      <section className="bg-brand text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <p className="text-sm font-semibold uppercase tracking-widest opacity-80">
            Howdy, Ags
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Every Aggie, one handshake away.
          </h1>
          <p className="mt-5 max-w-xl text-lg opacity-90">
            Current students and former students, connected by class year,
            career and the Spirit of Aggieland.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-md bg-white px-5 py-2.5 font-semibold text-brand hover:bg-white/90"
            >
              Join Aggie Connect
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-white/40 px-5 py-2.5 font-semibold hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-14 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-line bg-surface p-6"
          >
            <h2 className="text-lg font-bold">{f.title}</h2>
            <p className="mt-2 text-muted">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

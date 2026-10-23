import Link from "next/link";

const FEATURES = [
  {
    title: "Find a mentor",
    body: "Get matched with A&T alumni in the field you're aiming for, and see why each match fits.",
  },
  {
    title: "Hiring Aggies",
    body: "Jobs posted by alumni who want to hire Aggies, with referral requests built in.",
  },
  {
    title: "Your class, your city",
    body: "Search by class year, major, industry or city. Find Aggies in Greensboro, Charlotte, Atlanta, D.C. and beyond.",
  },
];

// Static: signed-in visitors are sent to /home by the proxy.
export default function Landing() {
  return (
    <div>
      <section className="border-b-4 border-gold bg-brand text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-28">
          <p className="text-sm font-bold uppercase tracking-widest text-gold">
            Aggie Pride!
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Every Aggie, one connection away.
          </h1>
          <p className="mt-5 max-w-xl text-lg opacity-90">
            Students and alumni of North Carolina A&amp;T, connected by class
            year, career and the city you call home.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-md bg-gold px-5 py-2.5 text-center font-semibold text-on-gold hover:brightness-95"
            >
              Join Aggie Connect
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-white/40 px-5 py-2.5 text-center font-semibold hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:grid-cols-3 sm:py-14">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-line border-t-4 border-t-gold bg-surface p-6"
          >
            <h2 className="text-lg font-bold">{f.title}</h2>
            <p className="mt-2 text-muted">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

// Placeholder home-feed content: recent headlines from ncat.edu.
//
// ncat.edu has no RSS feed or news API (checked 2026-11-19), so this is a
// hand-kept list. Headlines, dates and links only: no article text or
// photos are copied, and every link goes back to ncat.edu. Update it by
// copying the newest items from https://www.ncat.edu/news/latest/index.php.
// Replace it with member posts if a feed feature is ever built.

export type NewsItem = {
  title: string;
  /** YYYY-MM-DD */
  date: string;
  url: string;
};

const NCAT_PREFIX = "https://www.ncat.edu/";

const ITEMS: NewsItem[] = [
  {
    title: "Bioengineer Receives $410K Grant to Advance Brain Health Research",
    date: "2026-11-19",
    url: "https://www.ncat.edu/news/2026/11/brain-health-nih-grant.php",
  },
  {
    title:
      "e.l.f. Beauty, N.C. A&T to Co-Host Inaugural Change the Board Game Student Leadership Symposium",
    date: "2026-11-18",
    url: "https://www.ncat.edu/news/2026/11/elf-symposium.php",
  },
  {
    title: "Aramark Collegiate Hospitality Selected as A&T Dining Partner",
    date: "2026-11-17",
    url: "https://www.ncat.edu/news/2026/11/aramark-dining-partner.php",
  },
  {
    title: "Physics Professor Recalls Role in Nobel-Winning IceCube Neutrino Observatory Research",
    date: "2026-11-12",
    url: "https://www.ncat.edu/news/2026/11/meli-icecube-research.php",
  },
  {
    title: "N.C. A&T Joins Inaugural Power4+ HBCU Esports League",
    date: "2026-11-11",
    url: "https://www.ncat.edu/news/2026/11/esports-power4.php",
  },
  {
    title: "University Police and Public Safety Announces Pedestrian Safety Campaign",
    date: "2026-11-09",
    url: "https://www.ncat.edu/news/2026/11/pedestrian-safety-campaign.php",
  },
  {
    title:
      "Beyond the Lab: N.C. A&T Research Explores New Way to Identify Corruption Risk Through Google Searches",
    date: "2026-11-04",
    url: "https://www.ncat.edu/news/2026/11/kws-btl-research.php",
  },
  {
    title: "Cole '93, Uzzell '91 to Serve as Fall 2026 Commencement Speakers",
    date: "2026-11-02",
    url: "https://www.ncat.edu/news/2026/11/fall-2026-commencement-speakers.php",
  },
];

// Only https links to ncat.edu ever reach the page, even if a bad entry is
// added above by mistake. Newest first.
export const NCAT_NEWS: NewsItem[] = ITEMS.filter((n) => n.url.startsWith(NCAT_PREFIX)).sort(
  (a, b) => b.date.localeCompare(a.date),
);

export function newsDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

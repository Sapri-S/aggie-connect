# UI patch plan: Facebook-style layout, less "AI template"

Status: plan only, nothing built yet. Written 2026-11-19.

## 1. Decisions so far

| Question | Decision |
| --- | --- |
| How much like Facebook | **Layout only.** Top bar, left shortcuts, center column, right column on laptops, profile with cover and tabs. No new features (no posts). |
| Home feed content | **NC A&T news as placeholder.** ncat.edu has no RSS feed or API (checked: `/news/rss.xml`, `/feed`, `*.xml`, `*.json` all 404; the headlines are only in the page HTML). So: a **fixed list** in one file, updated by hand. |
| Colors | **White (light) or near-black (dark) base.** Aggie Blue is the one main color. Gold only for rare accents (badges, class-year marks). |
| Fonts | **System fonts** (San Francisco, Segoe UI, Roboto), like Facebook. Drop Montserrat and Open Sans. |
| Dark mode | **Follow the device, plus a Light / Dark / Auto switch** in the account menu. |
| Profile cover | **Plain Aggie Blue cover for everyone, no upload.** |
| Right column (laptops) | **All three:** your invitations, people to meet, your connections. |
| Signed-out landing page | **Facebook-style:** short pitch on one side, sign-in box on the other (stacked on phones), "Create account" button. |

## 2. Why it looks AI-made today

These are the specific spots in the current code that match the common "AI template" tells:

- **Hero formula** on the landing page: small uppercase kicker ("AGGIE PRIDE!"), big headline, subhead, two buttons ([page.tsx](../web/src/app/page.tsx)).
- **Three equal feature cards** with a colored top stripe (`border-t-4 border-t-gold`), same file.
- **Accent stripe on ordinary cards**: gold left border on the home profile card ([home/page.tsx](../web/src/app/home/page.tsx)), blue banner with gold bottom stripe on home and profile.
- **Frosted glass** (`backdrop-blur`) on the header and tab bar where nothing sits behind them ([site-header.tsx](../web/src/components/site-header.tsx), [mobile-tab-bar.tsx](../web/src/components/mobile-tab-bar.tsx)).
- **Same box everywhere**: every section is `rounded-xl border border-line bg-surface`, with no change in weight between primary and secondary content.
- **Gold pills everywhere** (class year, role, "Open to helping", filters), so gold stops meaning anything.
- **Template font pair**: Montserrat headings + Open Sans text.
- **Cheerleading copy**: "Aggie Pride, {name}!", "Bring your Aggie Pride and invite your classmates!", lots of exclamation marks.

## 3. What we take from Facebook (and what we don't)

Take the **structure**, not the look. Copying Facebook's logo, exact blue, icons or wording would be trade-dress copying, and it would also just look like a knock-off.

**Take:**
- Fixed top bar, about 56px: logo + search on the left, icon tabs in the middle (laptop), account menu on the right.
- Active tab shown by a colored bar under the icon, not a filled pill.
- Light gray page background with white cards, subtle shadow instead of borders, small radius (about 8px).
- Laptop: three columns. Left shortcuts, center content (about 680px wide), right column with people.
- Phone: one column, bottom tab bar (Facebook moved its main tabs to the bottom in its 2025 app redesign, and it is the thumb-friendly spot).
- Profile: cover banner, avatar overlapping it, name and actions, then tabs (About, Connections), then a two-column body on laptops (Intro card left, details right).
- Dense lists: avatar + name + one line of detail, full row is the tap target.

**Don't take:** Facebook blue, its logo or icon set, Reels/Marketplace-style tabs we don't need, infinite scroll, "online now" dots (we don't track that, and it's a privacy cost).

## 4. Design system

### Colors

Light base is white, dark base is near-black. Blue does the work; gold is rare.

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `canvas` | `#f0f2f5` | `#0d0f12` | page background |
| `surface` | `#ffffff` | `#18191c` | cards, top bar |
| `surface-2` | `#f2f4f7` | `#232529` | hover, inputs, secondary buttons |
| `ink` | `#111418` | `#e6e8eb` | main text |
| `muted` | `#5f6670` | `#a3a9b1` | secondary text |
| `line` | `#e3e6ea` | `#2c2f34` | dividers only |
| `primary` | `#004684` (Aggie Blue) | `#5b9be0` (lighter, readable on black) | buttons, links, active tab |
| `primary-soft` | `#e6eef7` | `#16263a` | selected rows, active tab background |
| `gold` | `#fdb927` (Aggie Gold) | same | **only**: notification badge, class-year mark, one highlight per screen at most |

Rule of thumb: if a screen has more than one or two gold things, one of them is wrong.

All text/background pairs get checked for WCAG AA contrast (4.5:1 for text) in both themes before merging.

### Type

- Font stack: `system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`. Remove the `next/font/google` imports.
- Sizes: 13 (meta), 15 (body, Facebook-like density), 17 (card titles), 20 (page titles), 28 (profile name). Weights: 400, 600, 700. No all-caps labels.

### Shape and spacing

- Radius: 8px cards, 6px buttons and inputs, full circle avatars. Not one big radius on everything.
- Cards: no border, a soft shadow in light mode (`0 1px 2px rgba(0,0,0,.1)`), a 1px `line` border in dark mode (shadows don't show on black).
- Spacing: 4px base. Tight inside lists (8 to 12px), roomier between sections (16 to 24px).
- No backdrop blur, no gradients, no colored stripes on cards, no entrance animations. Hover and pressed states only.

### Icons

Keep drawing our own inline SVG icons (as today). No icon library, which keeps the bundle small and avoids the "Lucide default" look. Filled icon for the active tab, outline for the rest.

## 5. Layout by screen size

| Width | Layout |
| --- | --- |
| Phone, under 640px | Top bar: logo, search icon, account avatar. Bottom tab bar: Home, Directory, Network (badge), Profile, Menu. One column. |
| Tablet, 640 to 1023px | Top bar with center icon tabs (bottom bar goes away). One centered column, max about 680px. |
| Laptop, 1024 to 1279px | Center column + right column (about 300px). |
| Wide, 1280px and up | Left shortcuts (about 280px) + center + right. |

Phone details:
- Use `100dvh` only where something truly needs the full screen; otherwise let the page scroll normally.
- Keep the existing `env(safe-area-inset-bottom)` padding for the bottom bar (iPhone home indicator).
- Every tap target at least 44×44px.
- Inputs at least 16px font so iPhone Safari doesn't zoom in on focus.

## 6. Page by page

**Top bar (all signed-in pages).** Logo "Aggie Connect" (wordmark, blue). Search box that submits to `/directory?q=` (no live typeahead; see security). Center tabs on tablet and up: Home, Directory, Network (with gold count badge). Right: avatar button opening the account menu (View profile, Edit profile, Display: Light / Dark / Auto, Admin if admin, Sign out).

**Signed-out landing (`/`).** Left: wordmark and one plain sentence ("Find NC A&T students and alumni by class, major, company and city."). Right: the sign-in card (email, password, Sign in, Forgot password, divider, then an outlined blue "Create account" button). Phones: stacked, form first. Reuses the existing login server action and Turnstile.

**Home (`/home`).**
- Left (wide only): your avatar + name, then shortcuts: Directory, My network, Open to helping (directory filter), Edit profile, Admin.
- Center: a small "you" row (avatar + "Complete your profile" nudge if empty), status notices (pending, suspended), then **News from N.C. A&T**: cards with date, headline, "Read on ncat.edu ↗". Then "Newest Aggies" as a compact card.
- Right: Invitations (Accept / Ignore inline), People to meet (newest or open-to-helping, with Connect), Your connections (up to 8, link to see all).

**Directory.** Search + filter chips in one card at the top (chips neutral gray, selected = blue soft background). Results as a white card list: avatar, name + class year, work · city, Connect button on the right. Filters move into the left column on wide screens.

**Network.** Facebook "Friends" style: tabs or sections for Invitations, Connections, Sent. Invitations as cards with Confirm / Delete-style buttons (our wording: Accept / Ignore).

**Profile (`/u/[id]`).** Blue cover, avatar overlapping bottom-left, name, class year, headline, buttons (Connect / Message on LinkedIn / Edit profile). Tabs: About, Connections (**own profile only**, see privacy). Laptop: Intro card on the left (work, major, city, role, LinkedIn), About + "Open to helping" on the right. Report link moves into a "..." menu.

**Edit profile, auth pages, privacy, guidelines, admin.** Restyle with the new tokens and components only; no structural changes. Admin keeps its current layout.

**Footer.** Signed-in pages: footer links move into the left column on wide screens (like Facebook) and the account menu on phones. Signed-out pages keep a small footer.

## 7. Placeholder news

- File: `web/src/lib/ncat-news.ts`, an array of `{ title, date, url }`.
- Content: headlines, dates and links only. No article text or photos copied (copyright, and hotlinking photos would need a CSP change and leak visitor IPs to ncat.edu).
- Labeled on the page: "News from N.C. A&T" with "From ncat.edu" under it, so nobody thinks Aggie Connect wrote them.
- Update by hand when it gets stale; the card shows the newest date so staleness is visible. Replace with real member posts if a feed feature is built later.
- Starting list (from ncat.edu/news/latest, checked 2026-11-19):
  1. Nov 19: Bioengineer Receives $410K Grant to Advance Brain Health Research
  2. Nov 18: e.l.f. Beauty, N.C. A&T to Co-Host Inaugural Change the Board Game Student Leadership Symposium
  3. Nov 17: Aramark Collegiate Hospitality Selected as A&T Dining Partner
  4. Nov 12: Physics Professor Recalls Role in Nobel-Winning IceCube Neutrino Observatory Research
  5. Nov 11: N.C. A&T Joins Inaugural Power4+ HBCU Esports League
  6. Nov 9: University Police and Public Safety Announces Pedestrian Safety Campaign
  7. Nov 4: Beyond the Lab: N.C. A&T Research Explores New Way to Identify Corruption Risk Through Google Searches
  8. Nov 2: Cole '93, Uzzell '91 to Serve as Fall 2026 Commencement Speakers

## 8. Dark mode switch

- Setting stored in `localStorage` (`theme = light | dark | auto`). Default `auto`.
- A tiny inline script in `<head>` sets `data-theme` on `<html>` before the page paints, so there's no white flash. Reading a cookie on the server instead would make every page dynamic under Cache Components, so the script is the better fit.
- CSS: `:root` = light, `@media (prefers-color-scheme: dark)` applies dark unless `data-theme="light"`, and `[data-theme="dark"]` forces dark.
- Also update the `theme-color` meta so the phone's browser bar matches.

## 9. Possible vulnerabilities and how the plan handles them

The current app is in good shape (RLS on every table, sanitized directory search, `safeNext` for redirects, LinkedIn URLs validated, avatars re-encoded with sharp, no `dangerouslySetInnerHTML`, CSP, clickjacking headers). The redesign could weaken that in these places:

1. **Leaking data into the browser through new client components.** The account menu, theme switch, right-column buttons and profile tabs will be client components. Anything passed to them as props ends up in the page source. Pass only the fields each one shows (id, name, avatar URL), never whole profile rows.
2. **Showing someone's connections.** A "Connections" tab on other people's profiles would expose the social graph (who knows whom) to every member. This patch shows connections **only on your own profile and in your own right column**. Showing others' connections needs its own privacy decision.
3. **"People to meet" and the right column.** These add queries to most pages. They must keep relying on RLS (approved members only), exclude yourself, people you're connected to and people you've blocked or reported if that exists, and stay small (limit 5 to 8).
4. **Inline Accept / Ignore / Connect buttons.** Reuse the existing server actions, which check the signed-in user. No new endpoints. Double-submit protection (disable while pending) stays.
5. **Header search.** A live typeahead would be a new endpoint that makes scraping the member list easy. This patch keeps search as a plain form that goes to `/directory` (already sanitized and paginated). If typeahead is added later: server-side rate limit, minimum 2 characters, max 5 results.
6. **Login form on the home page.** It must keep the Turnstile CAPTCHA, the same server action, the same generic error ("email or password is wrong", never "no such account"), correct `autocomplete` attributes, and `next` must still go through `safeNext`.
7. **External news links.** Hard-code `https://www.ncat.edu/` URLs only, open in a new tab with `rel="noopener noreferrer"`, and add a check that every URL in `ncat-news.ts` starts with that prefix. No images from ncat.edu.
8. **Inline theme script vs. CSP.** The CSP is report-only today and allows inline scripts. When it is switched to enforced, the theme script needs a hash in `script-src`. The script must only accept the three known values from `localStorage`.
9. **No UI kits or icon packs.** Adding component libraries adds supply-chain risk and the generic look. Build the handful of components ourselves.
10. **Next.js update.** `npm audit` reports a moderate advisory in `next` 16.2.0 to 16.4.4 (cache leak across root params with `use cache`, GHSA-mfr8-8qww-v76h and GHSA-vc7v-qv4w-wrv8). Fixed in 16.4.6. Merge the open Dependabot PR or bump `next` before or with this patch. Don't start using `use cache` for per-user data in the redesign.
11. **Admin link is cosmetic.** Moving it into the account menu doesn't change security; `/admin` already checks the role and two-factor on the server. Keep it that way.
12. **Report button.** Moving "Report" into a "..." menu must not make it harder to find; keep it one tap away on every profile.

## 10. Build order (one PR per step, each shippable)

1. **Foundations:** new color tokens (light/dark), system fonts, theme script + switch, card/button/input styles, bump `next`.
2. **App shell:** new top bar, account menu, bottom tab bar restyle, three-column layout component, footer move.
3. **Home:** news feed, left shortcuts, right column (invitations, people to meet, connections).
4. **Profile:** cover, header, tabs, two-column body, "..." menu with Report.
5. **Directory and Network** in the new list style.
6. **Landing / login page** Facebook-style, then restyle auth, edit profile, privacy, guidelines, admin.
7. **Copy pass:** plainer wording, fewer exclamation marks.

## 11. How we check it

- Widths: 360, 390, 430 (phones), 768 (tablet), 1024, 1280, 1440, 1920.
- Real devices: an iPhone in Safari and an Android phone in Chrome (desktop emulators miss the address bar, safe areas and zoom-on-focus).
- Light and dark, plus the switch, with no white flash on reload.
- Keyboard only: tab through the top bar, menus, and forms; focus is always visible.
- Contrast check on every color pair; Lighthouse accessibility 95+.
- Security spot checks: view page source on home and profile for over-shared fields; confirm another member's connections are not visible anywhere.

## 12. Still open

- Logo: keep "Aggie Connect" as a text wordmark, or design a small mark?
- "People to meet": newest members, people open to mentoring, or same major / class year?
- Should the Facebook-style landing page show any real numbers (member count) once there are enough members?

## Sources

- Facebook app navigation changes: [Android Headlines, Dec 2025](https://www.androidheadlines.com/2025/12/facebook-app-redesign-makes-it-look-and-feel-a-lot-more-like-instagram.html), [Piunika Web, May 2026](https://piunikaweb.com/2026/05/21/facebook-app-update-bottom-navigation/), [TechCrunch](https://techcrunch.com/?p=2986725)
- Facebook desktop: [Piunika Web, Apr 2026](https://piunikaweb.com/2026/04/24/facebook-friends-sidebar-gone-desktop/), [Creative Bloq, 2022](https://www.creativebloq.com/news/facebook-desktop-redesign)
- AI-design tells: [signs-of-ai-design](https://github.com/febbhav/signs-of-ai-design), [vibecoded-design-tells](https://github.com/JCarterJohnson/vibecoded-design-tells), [925 Studios](https://www.925studios.co/blog/ai-slop-design-tells)
- Mobile practices: [OpenReplay, mobile web papercuts](https://blog.openreplay.com/5-mobile-web-papercuts-fixes/), [Clay](https://clay.global/blog/practices-for-mobile-web-design)
- Next.js security: [Next.js July 2026 security release](https://nextjs.org/blog/july-2026-security-release), [GHSA-mfr8-8qww-v76h](https://github.com/advisories/GHSA-mfr8-8qww-v76h)
- N.C. A&T news: [ncat.edu/news/latest](https://www.ncat.edu/news/latest/index.php)

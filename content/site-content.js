// Canonical portfolio content. Run `npm run content:sync` after editing so the
// animated list, static page, and no-JavaScript fallback stay synchronized.

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

export const REEL_SIGNOFF = "and cool websites too :)";

// Collector statistics keep their provenance below for auditing; the page
// shows only the headline number per project, without confidence labels.

export const DATA_COLLECTION_PROJECTS = deepFreeze([
  {
    id: "social-code-collector",
    label: "Social Code Collector",
    summary: "Checks social posts, reads image text, removes repeats, and alerts on new codes.",
    scope: "Instagram · Facebook · Discord · OCR · deduplication",
    sourceLabel: "Private source · ChardXBT/social-code-scraper",
    historicalStat: {
      display: "100+ tracked run snapshots",
      unit: "run/state commits",
      kind: "verified lower bound",
      earliestDate: "2026-05-28",
      period: "May 28–September 13, 2026",
      source: "Commit history through 99ecab9",
      method: "Counted 103 commits that record a completed scraper run.",
      discount: "Rounded down to 100+ and did not describe every snapshot as a completed run.",
      confidence: "medium"
    }
  },
  {
    id: "cross-market-price-comparison",
    label: "Cross-Market Price Comparison",
    summary: "Normalizes marketplace prices, caches lookups, ranks value, and exports reviewable results.",
    scope: "Price comparison · normalization · SQLite · export",
    sourceLabel: "Private source · ChardXBT/csgo-price-checker",
    historicalStat: {
      display: "1,447 listings in the latest saved scan",
      unit: "listing rows",
      kind: "current scope",
      earliestDate: "2026-07-01",
      period: "Saved September 2026 scan exports",
      source: "exports/latest_scan.csv at 6bd14ee",
      method: "Counted 1,447 non-header rows in the latest committed CSV export.",
      discount: "Reported as a current snapshot; overlapping saved exports were not summed.",
      confidence: "high"
    }
  },
  {
    id: "skinport-price-monitor",
    label: "Skinport Price Monitor",
    summary: "Checks configured searches, validates listing conditions, and alerts on matches.",
    scope: "Skinport · conditions · source health · alerts",
    sourceLabel: "Private source · ChardXBT/Skinport_skin_finder",
    historicalStat: {
      display: "2,700+ archived checks",
      unit: "Skinport source checks",
      kind: "verified lower bound",
      earliestDate: "2026-06-01",
      period: "June 1–September 5, 2026",
      source: "data/past_run_archive.jsonl at f494abb",
      method: "Counted 2,733 archived check records whose source is Skinport.",
      discount: "Rounded down and excluded the current prev_run.json snapshot.",
      confidence: "high"
    }
  },
  {
    id: "csmoney-price-monitor",
    label: "CS.Money Price Monitor",
    summary: "Runs as its own stage inside the Skinport monitor, with its own labels and health checks.",
    scope: "CS.Money · normalization · source isolation · alerts",
    sourceLabel: "Shared codebase · ChardXBT/Skinport_skin_finder",
    historicalStat: {
      display: "13,000+ archived checks",
      unit: "CS.Money source checks",
      kind: "verified lower bound",
      earliestDate: "2026-06-01",
      period: "June 1–September 5, 2026",
      source: "data/past_run_archive.jsonl at f494abb",
      method: "Counted 13,462 archived check records whose source is CS.Money.",
      discount: "Rounded down, excluded the current snapshot, and did not treat this stage as a separate codebase.",
      confidence: "high"
    }
  },
  {
    id: "steam-market-monitor",
    label: "Steam Market Monitor",
    summary: "Schedules searches, converts prices to USD, filters conditions, and ranks alerts.",
    scope: "Steam · Playwright · FX normalization · scheduled alerts",
    sourceLabel: "Private source · ChardXBT/steam-market-monitor",
    historicalStat: {
      display: "9,000+ archived checks",
      unit: "Steam source checks",
      kind: "verified lower bound",
      earliestDate: "2026-06-01",
      period: "June 1–September 1, 2026",
      source: "data/past_run_archive.jsonl at 44edace",
      method: "Counted 9,055 checks across 95 archived structured run records.",
      discount: "Rounded down and excluded the current prev_run.json snapshot.",
      confidence: "high"
    }
  },
  {
    id: "buff-market-monitor",
    label: "BUFF Market Monitor",
    summary: "Keeps browser checks recoverable with retries, circuit breakers, archives, and alerts.",
    scope: "BUFF · browser automation · circuit breakers · recovery state",
    sourceLabel: "Private source · ChardXBT/buff-market-monitor",
    historicalStat: {
      display: "40+ substantial archived runs",
      unit: "committed run-log artifacts",
      kind: "verified lower bound",
      earliestDate: "2026-06-02",
      period: "June 2–September 12, 2026",
      source: "data/local-logs tree at 466600e",
      method: "Counted 41 committed run logs of at least 50 KB without reading encrypted operational state.",
      discount: "Excluded 25 short, failed, or incomplete log artifacts and did not infer item totals.",
      confidence: "medium"
    }
  }
]);

// Each project picks a `layout` so the detail view is shaped by its story
// instead of one repeated template. `metric` is the single headline proof
// number; everything else stays in plain prose.
export const PROJECTS = deepFreeze([
  {
    id: "appraisals",
    layout: "compare",
    categoryLabel: "Internal tools",
    label: "Property Appraisal Workspace",
    listMetric: "Lookups: 15–20 min → 1–3 min",
    description: "A map-first workspace where an appraisal team finds past reports.",
    provenance: "Public repo · in production at an appraisal office",
    metric: "15–20 min → 1–3 min",
    metricNote: "Time to look up comparable properties and reports",
    compare: { before: "15–20 min", after: "1–3 min", beforeLabel: "Before", afterLabel: "Now" },
    pitch: "I pulled 225+ appraisal reports into one protected, map-first workspace, so researching a property starts from a single search.",
    highlights: [
      "Search by map, address, square footage, or property details",
      "Upload report details, photos, PDFs, and the documents that go with them",
      "Sign-in, row-level security, roles, and signed links keep the records locked down"
    ],
    stack: ["React", "Supabase", "PostgreSQL", "Google Maps", "Leaflet"],
    links: [
      { label: "GitHub", href: "https://github.com/Teamhousing123/appraisal-map" }
    ]
  },
  {
    id: "runway",
    layout: "story",
    categoryLabel: "Creator tools",
    label: "Runway",
    listMetric: "Used on a 280K+ follower channel",
    description: "A research and scheduling tool for a creator, built on their past posts.",
    provenance: "Public repo · the creator’s data stays private",
    metric: "280K+ followers",
    metricNote: "on the channel it makes live posts for",
    pitch: "I built Runway so a creator could actually search their own back catalogue. It indexes 770+ past posts, drafts captions grounded in them, and schedules a post only after a person signs off.",
    story: [
      "It’s used for live posts on a channel with 280K+ followers.",
      "Under the hood it keeps thousands of searchable image and text records, a cache of comparisons between them, and nearly 400 labeled creator preferences. I tested two ranking models and kept the stronger baseline."
    ],
    highlights: [],
    stack: ["Python", "FastAPI", "SQLAlchemy", "SQLite", "Next.js", "TypeScript", "NumPy"],
    links: [
      { label: "GitHub", href: "https://github.com/ChardXBT/Runway" }
    ]
  },
  {
    id: "marketplace-operations",
    layout: "ledger",
    categoryLabel: "Trading bots",
    label: "CS Marketplace Operations",
    listMetric: "US$5K in profit",
    description: "Bots that price, buy, list, and sell CS2 items, and pick up where they left off when a trade gets stuck.",
    provenance: "Public architecture and demos · the live system is private",
    metric: "US$5K",
    metricNote: "Profit",
    pitch: "One system does the research and the trading. It has checked 200K+ listings and sold 1,000+ items.",
    ledger: [
      { step: "Price", detail: "Checks live prices and submits bounded offers or purchases" },
      { step: "Hold", detail: "Keeps inventory in sync and reprices open orders" },
      { step: "Sell", detail: "Relists items and confirms each sale" },
      { step: "Recover", detail: "Remembers pending actions and double-checks unclear responses before retrying" }
    ],
    ledgerTotal: { step: "Profit", detail: "US$5K" },
    highlights: [
      "Checks live prices and submits bounded offers or purchases",
      "Keeps inventory in sync, reprices orders, relists items, and confirms sales",
      "Remembers pending actions and double-checks unclear responses before retrying"
    ],
    stack: ["Python", "Node.js", "Playwright", "REST APIs", "GitHub Actions"],
    links: [
      { label: "GitHub", href: "https://github.com/ChardXBT/CS2-Marketplace-Trading-System" }
    ]
  },
  {
    id: "supervisor",
    layout: "runlog",
    categoryLabel: "Bots that watch bots",
    label: "Automation Supervisor",
    listMetric: "29 workflows, watched overnight",
    description: "The bot that keeps my other bots running, and restarts them when they fall over.",
    provenance: "The recovery pattern is public · the real supervisor is private",
    metric: "29 workflows",
    metricNote: "Under one supervisor, up from an 8-hour daily run window",
    pitch: "It keeps my workflows on schedule while I sleep, and it doesn’t take a run’s word for it: no fresh proof, no “done”.",
    runlogTitle: "What it does each night",
    runlogNote: "A summary of its loop, not a real log.",
    runlog: [
      { step: "schedule", detail: "line up every workflow so nothing runs twice or fights over the same resources" },
      { step: "launch", detail: "start each run on time" },
      { step: "verify", detail: "count a run as done only with fresh evidence that it finished" },
      { step: "recover", detail: "crash, outage, closed terminal, machine restart: clean up and carry on" },
      { step: "repeat", detail: "until morning" }
    ],
    afterword: "The recovery paths are tested against 70+ fault scenarios.",
    highlights: [
      "Coordinates schedules so nothing runs twice or fights over the same resources",
      "A run only counts as successful with fresh evidence that it finished",
      "Recovers cleanly from crashes, outages, closed terminals, and machine restarts, tested against 70+ fault scenarios"
    ],
    stack: ["Python", "Textual", "Windows ConPTY", "PowerShell", "Automated testing"],
    links: [
      { label: "GitHub", href: "https://github.com/ChardXBT/Self-Recovering-Automation" }
    ]
  },
  {
    id: "data-collection",
    type: "collection",
    layout: "index",
    categoryLabel: "Monitoring & Data Tools",
    reelLabel: "monitoring tools",
    label: "Monitoring & Data Tools",
    listMetric: "25K+ archived checks",
    description: "Six small collectors that watch social feeds and CS2 marketplaces.",
    provenance: "Private repos · only the counts are public",
    metric: "25K+",
    metricNote: "Archived checks across three run archives",
    pitch: "They pull in social posts and marketplace listings, throw out the duplicates, and ping me when something new turns up. Each source watches its own health, so a broken one doesn’t fail quietly.",
    highlights: [],
    stack: ["Python", "Playwright", "SQLite", "OCR", "Browser automation"],
    links: []
  }
]);

// The kinetic phrases are derived from the clickable category labels so the
// animation and the resolved project list cannot drift apart. A project may
// set `reelLabel` when its label does not read naturally after "I build".
export function reelPhrase(project) {
  return `${project.reelLabel ?? project.categoryLabel.toLowerCase()}.`;
}

export const BUILD_CATEGORIES = deepFreeze(PROJECTS.map(reelPhrase));

export const REEL_ITEMS = deepFreeze([...BUILD_CATEGORIES, REEL_SIGNOFF]);

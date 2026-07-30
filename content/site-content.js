// Canonical portfolio content. Run `npm run content:sync` after editing so the
// animated list, static page, and no-JavaScript fallback stay synchronized.

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

export const REEL_SIGNOFF = "and cool websites too :)";

export const DATA_COLLECTION_EVIDENCE = deepFreeze([
  {
    label: "6 collectors",
    kind: "current scope"
  },
  {
    label: "5 source families",
    kind: "current scope"
  },
  {
    label: "15K+ archived source checks",
    kind: "verified lower bound"
  }
]);

export const DATA_COLLECTION_PROJECTS = deepFreeze([
  {
    id: "social-code-collector",
    label: "Social Code Collector",
    summary: "Checks social posts, reads image text, removes repeats, and alerts on new codes.",
    scope: "Instagram · Facebook · Discord · OCR · deduplication",
    sourceLabel: "Private source · ChardXBT/social-code-scraper",
    historicalStat: {
      display: "60+ tracked run snapshots",
      unit: "run/state commits",
      kind: "verified lower bound",
      earliestDate: "2026-05-28",
      period: "May 28–July 29, 2026",
      source: "Commit history through 9d8081df21953b557169e04192747a5b1d24cab1",
      method: "Counted 62 commits whose messages identify run, state, scrape, or archive snapshots.",
      discount: "Rounded down to 60+ and did not describe every snapshot as a completed run.",
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
      display: "930 listings in the latest saved scan",
      unit: "listing rows",
      kind: "current scope",
      earliestDate: "2026-07-01",
      period: "Saved July 2026 scan exports",
      source: "exports/latest_scan.csv at 9081d52a9845c3f9abc39622fa1038cdeba71480",
      method: "Counted 930 non-header rows in the latest committed CSV export.",
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
      display: "1,600+ archived checks",
      unit: "Skinport source checks",
      kind: "verified lower bound",
      earliestDate: "2026-06-01",
      period: "June 1–July 29, 2026",
      source: "data/past_run_archive.jsonl at c97610d8b04f4d5201094742a3cdf665e2ac99fe",
      method: "Counted 1,625 archived check records whose source is Skinport.",
      discount: "Rounded down and excluded the current prev_run.json snapshot.",
      confidence: "high"
    }
  },
  {
    id: "csmoney-price-monitor",
    label: "CS.Money Price Monitor",
    summary: "Runs as an isolated source stage with normalized labels and explicit health checks.",
    scope: "CS.Money · normalization · source isolation · alerts",
    sourceLabel: "Shared codebase · ChardXBT/Skinport_skin_finder",
    historicalStat: {
      display: "7,400+ archived checks",
      unit: "CS.Money source checks",
      kind: "verified lower bound",
      earliestDate: "2026-06-01",
      period: "June 1–July 29, 2026",
      source: "data/past_run_archive.jsonl at c97610d8b04f4d5201094742a3cdf665e2ac99fe",
      method: "Counted 7,420 archived check records whose source is CS.Money.",
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
      display: "6,500+ archived checks",
      unit: "Steam source checks",
      kind: "verified lower bound",
      earliestDate: "2026-06-01",
      period: "June 1–July 28, 2026",
      source: "data/past_run_archive.jsonl at 1019381d7d3203b988f5385e930c5a2dd642eade",
      method: "Counted 6,576 checks across 59 archived structured run records.",
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
      display: "23+ substantial archived runs",
      unit: "committed run-log artifacts",
      kind: "verified lower bound",
      earliestDate: "2026-06-02",
      period: "June 2–July 23, 2026",
      source: "data/local-logs tree at b1e1134ab19863590b17878cc6e4d29a195f3184",
      method: "Counted 23 committed run logs of at least 50 KB without reading encrypted operational state.",
      discount: "Excluded 19 short, failed, or incomplete log artifacts and did not infer item totals.",
      confidence: "medium"
    }
  }
]);

export const PROJECTS = deepFreeze([
  {
    id: "appraisals",
    categoryLabel: "Internal tools",
    label: "Property Appraisal Workspace",
    listMetric: "200+ reports · 15–20 min → 1–3 min",
    description: "Internal map and document workspace for appraisal staff.",
    provenance: "Public repository · internal production workflow",
    metric: "15–20 min → 1–3 min",
    metricNote: "Comparable-property and report lookup",
    pitch: "Centralized 200+ appraisal reports in a protected, map-first workspace for faster property research.",
    highlights: [
      "Search 200+ reports by map, address, square footage, and property details",
      "Upload report metadata, photos, PDFs, and related document bundles",
      "Protect records with authentication, row-level security, roles, and signed links"
    ],
    stack: ["React", "Supabase", "PostgreSQL", "Google Maps", "Leaflet"],
    links: [
      { label: "GitHub", href: "https://github.com/Teamhousing123/appraisal-map" }
    ]
  },
  {
    id: "runway",
    categoryLabel: "Creator tools",
    label: "Runway",
    listMetric: "771 posts indexed · live on a 280K channel",
    description: "Creator research, review, and scheduling grounded in 771 past posts.",
    provenance: "Private project · creator data omitted",
    metric: "771 posts indexed",
    metricNote: "Used for live posts on a 280K channel",
    pitch: "Turns a channel’s history into searchable references, grounded captions, human review, and scheduled content.",
    highlights: [
      "4,800+ searchable image and text records with 136K+ cached comparisons",
      "Nearly 400 labeled creator preferences",
      "Evaluated two ranking models and retained the stronger baseline"
    ],
    stack: ["Python", "FastAPI", "SQLAlchemy", "SQLite", "Next.js", "TypeScript", "NumPy"],
    links: []
  },
  {
    id: "marketplace-operations",
    categoryLabel: "Marketplace systems",
    label: "CS Marketplace Operations",
    listMetric: "73K+ listings · 500+ sold · US$2.3K+ net",
    description: "Automated pricing, purchasing, inventory, listings, and transaction recovery.",
    provenance: "Public architecture · sanitized demos · private live operations",
    metric: "73K+ listings · 500+ sold",
    metricNote: "US$2.3K+ net realized profit after fees",
    pitch: "Connected marketplace research and operations across 73K+ listings, 150+ targets, 500+ sales, and US$2.3K+ in realized profit.",
    highlights: [
      "Checks live prices and submits bounded offers or purchases",
      "Synchronizes inventory, reprices orders, relists items, and confirms sales",
      "Persists pending actions and verifies uncertain responses before retrying"
    ],
    stack: ["Python", "Node.js", "Playwright", "REST APIs", "GitHub Actions"],
    links: [
      { label: "GitHub", href: "https://github.com/ChardXBT/CS2-Marketplace-Trading-System" }
    ]
  },
  {
    id: "supervisor",
    categoryLabel: "Automation tools",
    label: "Automation Supervisor",
    listMetric: "13 projects · 24/7 supervision",
    description: "Scheduling, health checks, and clean recovery across 13 automation projects.",
    provenance: "Public recovery pattern · private production supervisor",
    metric: "13 projects under 24/7 supervision",
    metricNote: "Expanded from an 8-hour daily run window",
    pitch: "Keeps 13 automation projects on schedule while I sleep—launching work, verifying fresh completions, and recovering after failures.",
    highlights: [
      "Coordinates project schedules while preventing duplicate processes and resource conflicts",
      "Requires fresh completion evidence before a run is marked successful",
      "Retries cleanly after crashes, outages, terminal exits, and machine restarts; validated across 60+ fault scenarios"
    ],
    stack: ["Python", "Textual", "Windows ConPTY", "PowerShell", "Automated testing"],
    links: [
      { label: "GitHub", href: "https://github.com/ChardXBT/Self-Recovering-Automation" }
    ]
  },
  {
    id: "data-collection",
    type: "collection",
    categoryLabel: "Data collection",
    label: "Data Collection",
    fallbackHref: "#data-collection",
    listMetric: "6 collectors · 15K+ archived checks",
    description: "Six collectors spanning social feeds and CS marketplaces.",
    provenance: "Private collectors · public evidence only",
    metric: "15K+ archived checks",
    metricNote: "Verified lower bound across three source archives",
    pitch: "Collects social posts and marketplace listings into normalized, deduplicated signals with source-level health and recovery evidence.",
    highlights: [],
    stack: ["Python", "Playwright", "SQLite", "OCR", "Browser automation"],
    links: []
  }
]);

// The kinetic phrases are derived from the clickable category labels so the
// animation and the resolved project list cannot drift apart.
export const BUILD_CATEGORIES = deepFreeze(
  PROJECTS.map((project) => `${project.categoryLabel.toLowerCase()}.`)
);

export const REEL_ITEMS = deepFreeze([...BUILD_CATEGORIES, REEL_SIGNOFF]);

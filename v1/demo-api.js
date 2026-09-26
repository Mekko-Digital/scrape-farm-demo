/* Scrape Farm UI — static preview.
 * The real app talks to the farm API on a server; this static copy answers the
 * same /api/scrape-farm/* requests in the browser with sample data, so every
 * screen works without a server. Sample data only; nothing is saved. */
(function () {
  "use strict";
/** UTC instant for local HH:MM today in `tz`. */
function zonedToday(hhmm, tz, dayOffset = 0) {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, m, d] = fmt.format(now).split("-").map(Number);
  const [hh, mm] = hhmm.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d + dayOffset, hh, mm);
  const asTz = new Date(new Date(guess).toLocaleString("en-US", { timeZone: tz }));
  const asUtc = new Date(new Date(guess).toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(guess - (asTz - asUtc));
}

// ---------- state ----------
const accounts = [
  {
    accountId: "personal",
    displayName: "Umar — Personal",
    state: "connected",
    connected: true,
    port: 6081,
  },
  {
    accountId: "sales-uk",
    displayName: "Sales UK",
    state: "scraping",
    connected: true,
    port: 6082,
  },
  {
    accountId: "recruiting-eu",
    displayName: "Recruiting EU",
    state: "connected",
    connected: true,
    port: 6083,
  },
  {
    accountId: "founders-us",
    displayName: "Founders US",
    state: "needs_reauth",
    connected: false,
    port: 6084,
  },
  { accountId: "agency-leads", displayName: "", state: "error", connected: true, port: 6085 },
];

const baseSettings = (tz, start, end) => ({
  scheduling: { timezone: tz, windowStart: start, windowEnd: end, enabled: true },
  jobDescriptions: { enabled: true, perSessionCap: 15, minDelaySeconds: 20, maxDelaySeconds: 60 },
  locationPacing: { minGapSeconds: 15, maxGapSeconds: 45 },
  crm: { apiUrl: "https://crm.mekko.digital", apiKey: "sk_live_xxxxxxxx" },
});

const settings = {
  personal: {
    ...baseSettings("Asia/Karachi", "09:00", "21:00"),
    searches: [
      {
        vertical: "people",
        keywords: "head of growth",
        locations: [
          "London, England, United Kingdom",
          "Manchester, England, United Kingdom",
          "Dubai, United Arab Emirates",
        ],
        locationPlan: [
          { label: "Dubai, United Arab Emirates", pages: 2 },
          { label: "London, England, United Kingdom", pages: 1 },
          { label: "Manchester, England, United Kingdom", pages: 1 },
        ],
        connectionDegrees: ["second", "third_plus"],
      },
      {
        vertical: "jobs",
        keywords: "react developer",
        locations: ["Pakistan"],
        datePosted: "past_week",
        workplaceTypes: ["remote", "hybrid"],
        experienceLevels: ["mid_senior"],
        jobTypes: ["full_time", "contract"],
        easyApplyOnly: true,
      },
      {
        vertical: "companies",
        keywords: "fintech",
        locations: ["United Kingdom"],
        companySizes: ["size_51_200", "size_201_500"],
      },
      {
        vertical: "posts",
        keywords: '"we\'re hiring" design',
        datePosted: "past_24h",
        sortBy: "date",
      },
    ],
  },
  "sales-uk": {
    ...baseSettings("Europe/London", "08:00", "18:00"),
    searches: [
      {
        vertical: "people",
        keywords: "vp marketing",
        locations: ["London, England, United Kingdom"],
        connectionDegrees: ["second"],
      },
    ],
  },
  "recruiting-eu": {
    ...baseSettings("Europe/Berlin", "09:00", "17:30"),
    searches: [
      {
        vertical: "jobs",
        keywords: "backend engineer go",
        locations: ["Berlin, Germany", "Munich, Bavaria, Germany"],
        workplaceTypes: ["on_site", "hybrid"],
      },
    ],
  },
  "founders-us": { ...baseSettings("America/New_York", "10:00", "19:00"), searches: [] },
  "agency-leads": {
    ...baseSettings("Europe/Amsterdam", "22:00", "06:00"),
    searches: [{ vertical: "people", keywords: "marketing director", locations: ["Netherlands"] }],
  },
};

function makePlan(id, generate = false) {
  const s = settings[id].scheduling;
  const start = zonedToday(s.windowStart, s.timezone);
  let end = zonedToday(s.windowEnd, s.timezone);
  if (end <= start) end = new Date(end.getTime() + 86400000);
  const hours = (end - start) / 3600000;
  const count = Math.max(1, Math.min(8, Math.round(hours / 2.5)));
  const slots = [];
  const span = end - start;
  for (let i = 0; i < count; i++) {
    const jitter = generate ? Math.random() : ((i * 7919) % 97) / 97;
    const t = start.getTime() + (span / count) * (i + 0.15 + jitter * 0.7);
    slots.push(new Date(Math.round(t / 60000) * 60000).toISOString());
  }
  return {
    generatedAt: new Date().toISOString(),
    windowStartLocal: s.windowStart,
    windowEndLocal: s.windowEnd,
    timezone: s.timezone,
    enabled: s.enabled,
    windowStartUTC: start.toISOString(),
    windowEndUTC: end.toISOString(),
    sessionCount: count,
    slots,
    entries: slots.map((at, i) => ({ at, edited: !generate && id === "personal" && i === 2 })),
  };
}
const plans = Object.fromEntries(Object.keys(settings).map((id) => [id, makePlan(id)]));

const sampleRecords = [
  {
    kind: "person",
    title: "Olivia Bennett",
    url: "https://www.linkedin.com/in/olivia-bennett",
    payload: { subtitle: "Head of Growth at Northwind Labs", location: "London" },
  },
  {
    kind: "person",
    title: "Marcus Hale",
    url: "https://www.linkedin.com/in/marcus-hale",
    payload: { subtitle: "VP Marketing · Brightpath", location: "Manchester" },
  },
  {
    kind: "job",
    title: "Senior React Developer",
    url: "https://www.linkedin.com/jobs/view/401",
    payload: { company: "Rahbar Tech", location: "Lahore (Remote)", workType: "Remote" },
  },
  {
    kind: "job",
    title: "Frontend Engineer (React)",
    url: "https://www.linkedin.com/jobs/view/402",
    payload: { company: "Souq Nova", location: "Karachi (Hybrid)", workType: "Hybrid" },
  },
  {
    kind: "company",
    title: "Ledgerly",
    url: "https://www.linkedin.com/company/ledgerly",
    payload: { tagline: "Accounting for modern teams", industry: "Financial Services" },
  },
  {
    kind: "post",
    title: "We're hiring two product designers",
    url: "https://www.linkedin.com/feed/update/1",
    payload: { subtitle: "Priya Desai · Growth Lead at Ledgerly" },
  },
];
const rec = (r, i, runId) => ({
  id: `${runId}-${i}`,
  kind: r.kind,
  url: r.url,
  title: r.title,
  payload: JSON.stringify(r.payload),
  scrapedAt: new Date().toISOString(),
});

function makeRuns(id) {
  const out = [];
  const now = Date.now();
  for (let i = 0; i < 37; i++) {
    const started = new Date(now - (i * 3.1 + 0.4) * 3600000);
    const dur = (60 + ((i * 53) % 400)) * 1000;
    const failJobs = i % 6 === 1;
    const failAll = i % 11 === 4;
    const outcomes = failAll
      ? [
          {
            kind: "people",
            outcome: "failed",
            reason:
              "LinkedIn returned a security checkpoint (HTTP 999) before the first results page loaded. The session cookie is probably stale — reconnect the account from its page, then run Verify now to confirm it reads live data again.",
          },
        ]
      : [
          { kind: "people", outcome: "ok" },
          failJobs
            ? {
                kind: "jobs",
                outcome: "failed",
                reason:
                  "Timed out waiting for the jobs results list after 30000ms (selector .jobs-search-results-list).",
              }
            : { kind: "jobs", outcome: "ok" },
          { kind: "companies", outcome: "ok" },
          ...(i % 3 === 0 ? [{ kind: "posts", outcome: "ok" }] : []),
        ];
    const records = failAll
      ? []
      : sampleRecords.slice(0, 2 + (i % 5)).map((r, j) => rec(r, j, `r${i}`));
    out.push({
      id: 1000 - i,
      accountId: id,
      startedAt: started.toISOString(),
      finishedAt: new Date(started.getTime() + dur).toISOString(),
      scraped: failAll ? 0 : 12 + ((i * 17) % 90),
      outcomes: JSON.stringify(outcomes),
      records: JSON.stringify(records),
      failed: failAll || failJobs ? 1 : 0,
    });
  }
  return out;
}
const runs = Object.fromEntries(
  Object.keys(settings).map((id) => [id, id === "founders-us" ? [] : makeRuns(id)]),
);

let crm = { apiUrl: "https://crm.mekko.digital", apiKey: "sk_live_4f9a2c7e81b3" };
const setup = () => ({
  configured: Boolean(crm.apiUrl && crm.apiKey),
  ok: false,
  objects: crm.apiUrl
    ? [
        {
          name: "person",
          status: "present",
          fieldsCreated: 0,
          fieldsSkipped: 24,
          fieldsMissing: 0,
        },
        {
          name: "company",
          status: "present",
          fieldsCreated: 0,
          fieldsSkipped: 18,
          fieldsMissing: 0,
        },
        {
          name: "opportunity",
          status: "present",
          fieldsCreated: 0,
          fieldsSkipped: 12,
          fieldsMissing: 2,
          error: "Fields linkedInJobUrl, workType were deleted in the CRM.",
        },
        {
          name: "linkedInPersona",
          status: "present",
          fieldsCreated: 0,
          fieldsSkipped: 9,
          fieldsMissing: 0,
        },
      ]
    : [],
});

const LOCATIONS = [
  "London, England, United Kingdom",
  "Greater London, England, United Kingdom",
  "Lahore, Punjab, Pakistan",
  "Karachi, Sindh, Pakistan",
  "Pakistan",
  "Berlin, Germany",
  "Dubai, United Arab Emirates",
  "Manchester, England, United Kingdom",
  "New York, United States",
  "Amsterdam, North Holland, Netherlands",
];

const view = (a) => ({
  accountId: a.accountId,
  displayName: a.displayName,
  state: a.state,
  connected: a.connected,
  containerStatus: a.state === "needs_reauth" ? "exited" : "running",
  novncPort: a.port,
  container: {
    containerName: `scraper-${a.accountId}`,
    status: a.state === "needs_reauth" ? "exited" : "running",
    novncPort: a.port,
  },
});


  const resp = (status, obj) =>
    new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
// ---------- routes ----------
async function api(method, url, body) {
  const p = url.pathname;
  const m = p.match(/^\/api\/scrape-farm\/accounts\/([^/]+)(\/.*)?$/);
  if (p === "/api/scrape-farm/accounts") {
    if (method === "GET") return resp(200, { accounts: accounts.map(view) });
    const { accountId } = body;
    const id = String(accountId ?? "").trim();
    if (!id || id.length > 64) return resp(400, { error: "accountId is required" });
    accounts.push({
      accountId: id,
      displayName: "",
      state: "needs_reauth",
      connected: false,
      port: 6090 + accounts.length,
    });
    settings[id] = { ...baseSettings("Asia/Karachi", "09:00", "21:00"), searches: [] };
    plans[id] = makePlan(id);
    runs[id] = [];
    return resp(201, { ok: true });
  }
  if (m) {
    const id = decodeURIComponent(m[1]);
    const sub = m[2] ?? "";
    const acc = accounts.find((a) => a.accountId === id);
    if (!acc) return resp(404, { error: "Unknown account" });
    if (sub === "" && method === "PATCH") {
      const { displayName } = body;
      acc.displayName = String(displayName).trim();
      return resp(200, { ok: true });
    }
    if (sub === "" && method === "DELETE") {
      accounts.splice(accounts.indexOf(acc), 1);
      return resp(200, { ok: true });
    }
    if (sub === "/connect") {
      acc.state = "needs_reauth";
      return resp(201, { ok: true });
    }
    if (sub === "/stop") return resp(200, { ok: true });
    if (sub === "/settings") {
      if (method === "GET") return resp(200, { settings: settings[id] });
      const body = body;
      settings[id] = { ...settings[id], ...body };
      plans[id] = makePlan(id);
      return resp(200, { settings: settings[id] });
    }
    if (sub === "/plan") {
      if (method === "GET")
        return resp(200, {
          enabled: settings[id].scheduling.enabled,
          plan: settings[id].scheduling.enabled ? plans[id] : null,
        });
      if (url.searchParams.get("generate")) {
        plans[id] = makePlan(id, true);
        return resp(200, { plan: plans[id] });
      }
      const { slots } = body;
      plans[id] = {
        ...plans[id],
        slots: [...slots].sort(),
        entries: [...slots].sort().map((at) => ({ at, edited: true })),
      };
      return resp(200, { plan: plans[id] });
    }
    if (sub === "/runs") {
      const limit = Number(url.searchParams.get("limit") ?? 50);
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const list = runs[id] ?? [];
      return resp(200, {
        runs: list.slice(offset, offset + limit),
        pagination: { total: list.length },
      });
    }
    if (sub === "/verify") {
      await new Promise((r) => setTimeout(r, 2500));
      const records = sampleRecords.slice(0, 5).map((r, i) => rec(r, i, "verify"));
      return resp(200, { result: { scraped: records.length, records } });
    }
    if (sub === "/locations") {
      const q = (url.searchParams.get("q") ?? "").toLowerCase();
      await new Promise((r) => setTimeout(r, 250));
      return resp(200, {
        status: "ok",
        suggestions: LOCATIONS.filter((l) => l.toLowerCase().includes(q)).map((label) => ({
          label,
        })),
      });
    }
  }
  if (p === "/api/scrape-farm/settings") {
    if (method === "GET") return resp(200, { settings: { crm } });
    const body = body;
    await new Promise((r) => setTimeout(r, 900));
    crm = body.crm ?? crm;
    return resp(200, { settings: { crm }, setup: setup() });
  }
  if (p === "/api/scrape-farm/crm-setup") {
    if (method === "POST") await new Promise((r) => setTimeout(r, 1200));
    return resp(200, { setup: setup() });
  }
  return null;
}


  // Sign-in is remembered for this browser tab, like the real app's cookie:
  // signing out forgets it, and every page but the login one then sends the
  // visitor back to log in.
  const base = (document.currentScript && document.currentScript.src
    ? new URL(document.currentScript.src).pathname
    : "/demo-api.js").replace(/\/demo-api\.js$/, "");
  const KEY = "scrape-farm-demo-signed-in:" + base;
  const signedIn = () => {
    try { return sessionStorage.getItem(KEY) === "1"; } catch (e) { return true; }
  };
  const setSignedIn = (on) => {
    try { on ? sessionStorage.setItem(KEY, "1") : sessionStorage.removeItem(KEY); } catch (e) {}
  };
  if (!signedIn() && !/\/scrape-farm\/login\/?$/.test(location.pathname)) {
    location.replace(base + "/scrape-farm/login/");
  }

  const realFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const href = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(href, location.href);
    if (!url.pathname.includes("/api/scrape-farm")) return realFetch(input, init);
    url.pathname = url.pathname.slice(url.pathname.indexOf("/api/scrape-farm"));
    const method = ((init && init.method) || (input && input.method) || "GET").toUpperCase();
    let body = {};
    try { body = init && typeof init.body === "string" ? JSON.parse(init.body) : {}; } catch (e) { body = {}; }
    if (url.pathname === "/api/scrape-farm/auth") {
      if (body.password !== "preview") return resp(401, { error: "Invalid password" });
      setSignedIn(true);
      return resp(200, { ok: true });
    }
    if (url.pathname === "/api/scrape-farm/auth/logout") {
      setSignedIn(false);
      return resp(200, { ok: true });
    }
    const r = await api(method, url, body);
    return r || resp(404, { error: "Not found" });
  };
})();

export type BillingCycle = "Monthly" | "Annual" | "Quarterly";
export type PaymentMode = "Card" | "UPI";
export type Category = string;
export type Currency = "USD" | "INR";
export type Team = string;

export interface Subscription {
  id: string;
  platform: string;
  plan: string;
  cost: number;
  currency: Currency;
  purchaseDate: string;
  expiryDate: string;
  cycle: BillingCycle;
  paymentMode: PaymentMode;
  buyer: string;
  accountHolder: string;
  accountEmail: string;
  accountPassword: string;
  invoiceFileName?: string;
  renewalStatus?: "Paid" | "Failed" | "Cancelled";
  category: Category;
  team: Team;
  autoPay: boolean;
  color: string;
  logo: string;
  active: boolean;
}

type RawSubscription = Partial<Subscription> & { id?: unknown };

export const USD_TO_INR = 84;

export const DEFAULT_CATEGORIES: Category[] = [
  "Entertainment",
  "Productivity",
  "Dev Tools",
  "Cloud",
  "Design",
  "AI",
  "Communication",
  "Storage",
];

export const DEFAULT_TEAMS: Team[] = ["Development", "Graphic Design", "Social Media"];

/**
 * Platform name to domain mapping for Clearbit logo API
 * Maps platform names to their corresponding domain for logo retrieval
 */
const platformDomainMap: Record<string, string> = {
  Netflix: "netflix.com",
  Spotify: "spotify.com",
  "Adobe CC": "adobe.com",
  GitHub: "github.com",
  AWS: "aws.amazon.com",
  Slack: "slack.com",
  Zoom: "zoom.us",
  Linear: "linear.app",
  Figma: "figma.com",
  "ChatGPT Plus": "openai.com",
  "YouTube Premium": "youtube.com",
  Notion: "notion.so",
  "1Password": "1password.com",
  Dropbox: "dropbox.com",
  Gmail: "google.com",
  Drive: "google.com",
  Jira: "atlassian.com",
  Asana: "asana.com",
  Monday: "monday.com",
  Canva: "canva.com",
  Trello: "trello.com",
  Discord: "discord.com",
  Teams: "microsoft.com",
  Airtable: "airtable.com",
  Loom: "loom.com",
  chatgpt: "openai.com",
};

platformDomainMap["Claude"] = "claude.ai";
platformDomainMap["Prime Video"] = "primevideo.com";
platformDomainMap["PrimeVideo"] = "primevideo.com";
platformDomainMap["Claude AI"] = "claude.ai";

const platformPresetMap: Record<string, { color: string; logo: string }> = {
  netflix: { color: "#E50914", logo: "N" },
  spotify: { color: "#1DB954", logo: "S" },
  adobe: { color: "#FF0000", logo: "Ai" },
  github: { color: "#24292E", logo: "GH" },
  aws: { color: "#FF9900", logo: "AWS" },
  slack: { color: "#4A154B", logo: "Sl" },
  zoom: { color: "#2D8CFF", logo: "Z" },
  linear: { color: "#5E6AD2", logo: "Li" },
  figma: { color: "#F24E1E", logo: "Fig" },
  chatgpt: { color: "#10A37F", logo: "AI" },
  youtube: { color: "#FF0000", logo: "YT" },
  notion: { color: "#000000", logo: "No" },
  "1password": { color: "#1A8CFF", logo: "1P" },
  dropbox: { color: "#0061FF", logo: "DB" },
  gmail: { color: "#4285F4", logo: "Gm" },
  drive: { color: "#0F9D58", logo: "Dr" },
  jira: { color: "#0052CC", logo: "Ji" },
  asana: { color: "#F06A6A", logo: "As" },
  monday: { color: "#FF5A5F", logo: "Mo" },
  canva: { color: "#00C4CC", logo: "Ca" },
  trello: { color: "#0052CC", logo: "Tr" },
  discord: { color: "#5865F2", logo: "Di" },
  teams: { color: "#6264A7", logo: "Te" },
  airtable: { color: "#18BFFF", logo: "At" },
  loom: { color: "#625DF5", logo: "Lo" },
  claude: { color: "#F97316", logo: "Cl" },
  primevideo: { color: "#00A8E1", logo: "PV" },
};

function normalizePlatformName(platform: string): string {
  return platform.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function hashToColor(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 48%)`;
}

export function getPlatformIdentity(platform: string): { color: string; logo: string } {
  const normalized = normalizePlatformName(platform);
  const presetKey = Object.keys(platformPresetMap).find((key) => normalized.includes(key));
  if (presetKey) return platformPresetMap[presetKey];

  const fallbackLogo = platform
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "PL";

  return {
    color: hashToColor(normalized || platform),
    logo: fallbackLogo,
  };
}

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return null;
}

export function sanitizeSubscription(raw: RawSubscription): Subscription | null {
  const platform = normalizeString(raw.platform);
  const cost = normalizeNumber(raw.cost);
  const purchaseDate = isValidDate(raw.purchaseDate) ? raw.purchaseDate : "";
  const expiryDate = isValidDate(raw.expiryDate) ? raw.expiryDate : "";

  if (!platform || cost === null || !purchaseDate || !expiryDate) {
    return null;
  }

  const identity = getPlatformIdentity(platform);
  const cycle = raw.cycle === "Monthly" || raw.cycle === "Annual" || raw.cycle === "Quarterly" ? raw.cycle : "Monthly";
  const currency = raw.currency === "INR" || raw.currency === "USD" ? raw.currency : "USD";
  const paymentMode = raw.paymentMode === "UPI" || raw.paymentMode === "Card" ? raw.paymentMode : "Card";
  const renewalStatus =
    raw.renewalStatus === "Paid" || raw.renewalStatus === "Failed" || raw.renewalStatus === "Cancelled"
      ? raw.renewalStatus
      : undefined;

  return {
    id: typeof raw.id === "string" && raw.id.trim() ? raw.id : `${platform}-${purchaseDate}-${expiryDate}`,
    platform,
    plan: normalizeString(raw.plan) || "Plan not set",
    cost,
    currency,
    purchaseDate,
    expiryDate,
    cycle,
    paymentMode,
    buyer: normalizeString(raw.buyer) || "Unassigned",
    accountHolder: normalizeString(raw.accountHolder),
    accountEmail: normalizeString(raw.accountEmail),
    accountPassword: normalizeString(raw.accountPassword),
    invoiceFileName: normalizeString(raw.invoiceFileName) || undefined,
    renewalStatus,
    category: normalizeString(raw.category) || "Uncategorized",
    team: normalizeString(raw.team) || "Unassigned",
    autoPay: normalizeBoolean(raw.autoPay),
    color: normalizeString(raw.color) || identity.color,
    logo: normalizeString(raw.logo) || identity.logo,
    active: normalizeBoolean(raw.active, true),
  };
}

export function sanitizeSubscriptions(items: unknown): Subscription[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => sanitizeSubscription((item ?? {}) as RawSubscription))
    .filter((item): item is Subscription => item !== null);
}

export function getTeamIdentity(team: string): { bg: string; color: string; light: string } {
  const normalized = normalizePlatformName(team);
  const preset = teamColors[team as Team];
  if (preset) return preset;

  let hash = 0;
  for (let i = 0; i < (normalized || team).length; i += 1) {
    hash = ((hash << 5) - hash) + (normalized || team).charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return {
    bg: `hsl(${hue}, 70%, 48% / 0.08)`,
    color: `hsl(${hue}, 70%, 48%)`,
    light: `hsl(${hue}, 70%, 48% / 0.15)`,
  };
}

export function getClearbitLogoUrl(platform: string): string {
  if (!platform) return "";
  let domain = platformDomainMap[platform];
  if (!domain) {
    const foundKey = Object.keys(platformDomainMap).find((k) => k.toLowerCase() === platform.toLowerCase());
    if (foundKey) domain = platformDomainMap[foundKey];
  }
  if (!domain) {
    const slug = platform.toLowerCase().replace(/[^a-z0-9]+/g, "");
    domain = `${slug}.com`;
    console.warn(`Platform domain mapping not found for: ${platform}. Guessing domain: ${domain}`);
  }
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

export const initialSubscriptions: Subscription[] = [
  {
    id: "1",
    platform: "Netflix",
    plan: "Premium",
    cost: 22.99,
    currency: "USD",
    purchaseDate: "2026-05-01",
    expiryDate: "2026-06-01",
    cycle: "Monthly",
    paymentMode: "Card",
    buyer: "Alex",
    accountHolder: "",
    accountEmail: "",
    accountPassword: "",
    category: "Entertainment",
    team: "Social Media",
    autoPay: false,
    color: "#E50914",
    logo: "N",
    active: true,
  },
  {
    id: "2",
    platform: "Spotify",
    plan: "Family",
    cost: 17.99,
    currency: "USD",
    purchaseDate: "2026-05-10",
    expiryDate: "2026-06-10",
    cycle: "Monthly",
    paymentMode: "Card",
    buyer: "Alex",
    accountHolder: "",
    accountEmail: "",
    accountPassword: "",
    category: "Entertainment",
    team: "Social Media",
    autoPay: false,
    color: "#1DB954",
    logo: "S",
    active: true,
  },
  {
    id: "3",
    platform: "Adobe CC",
    plan: "All Apps",
    cost: 59.99,
    currency: "USD",
    purchaseDate: "2026-04-15",
    expiryDate: "2026-05-29",
    cycle: "Monthly",
    paymentMode: "Card",
    buyer: "Jordan",
    accountHolder: "",
    accountEmail: "",
    accountPassword: "",
    category: "Design",
    team: "Graphic Design",
    autoPay: true,
    color: "#FF0000",
    logo: "Ai",
    active: true,
  },
  {
    id: "4",
    platform: "GitHub",
    plan: "Team",
    cost: 44.00,
    currency: "USD",
    purchaseDate: "2026-01-01",
    expiryDate: "2027-01-01",
    cycle: "Annual",
    paymentMode: "Card",
    buyer: "Alex",
    accountHolder: "",
    accountEmail: "",
    accountPassword: "",
    category: "Dev Tools",
    team: "Development",
    autoPay: true,
    color: "#24292E",
    logo: "GH",
    active: true,
  },
  {
    id: "5",
    platform: "AWS",
    plan: "Business",
    cost: 120.00,
    currency: "USD",
    purchaseDate: "2026-05-20",
    expiryDate: "2026-06-20",
    cycle: "Monthly",
    paymentMode: "Card",
    buyer: "Taylor",
    accountHolder: "",
    accountEmail: "",
    accountPassword: "",
    category: "Cloud",
    team: "Development",
    autoPay: true,
    color: "#FF9900",
    logo: "AWS",
    active: true,
  },
  {
    id: "6",
    platform: "Slack",
    plan: "Pro",
    cost: 87.50,
    currency: "USD",
    purchaseDate: "2026-03-01",
    expiryDate: "2026-06-01",
    cycle: "Quarterly",
    paymentMode: "Card",
    buyer: "Jordan",
    accountHolder: "",
    accountEmail: "",
    accountPassword: "",
    category: "Communication",
    team: "Development",
    autoPay: false,
    color: "#4A154B",
    logo: "Sl",
    active: true,
  },
  {
    id: "7",
    platform: "Zoom",
    plan: "Business",
    cost: 19.99,
    currency: "USD",
    purchaseDate: "2026-05-15",
    expiryDate: "2026-06-15",
    cycle: "Monthly",
    paymentMode: "Card",
    buyer: "Taylor",
    accountHolder: "",
    accountEmail: "",
    accountPassword: "",
    category: "Communication",
    team: "Social Media",
    autoPay: false,
    color: "#2D8CFF",
    logo: "Z",
    active: true,
  },
  {
    id: "8",
    platform: "Linear",
    plan: "Business",
    cost: 16.00,
    currency: "USD",
    purchaseDate: "2026-02-01",
    expiryDate: "2027-02-01",
    cycle: "Annual",
    paymentMode: "Card",
    buyer: "Alex",
    accountHolder: "",
    accountEmail: "",
    accountPassword: "",
    category: "Dev Tools",
    team: "Development",
    autoPay: true,
    color: "#5E6AD2",
    logo: "Li",
    active: true,
  },
  {
    id: "9",
    platform: "Figma",
    plan: "Professional",
    cost: 15.00,
    currency: "USD",
    purchaseDate: "2026-05-05",
    expiryDate: "2026-06-05",
    cycle: "Monthly",
    paymentMode: "Card",
    buyer: "Jordan",
    accountHolder: "",
    accountEmail: "",
    accountPassword: "",
    category: "Design",
    team: "Graphic Design",
    autoPay: false,
    color: "#F24E1E",
    logo: "Fig",
    active: true,
  },
  {
    id: "10",
    platform: "ChatGPT Plus",
    plan: "Plus",
    cost: 20.00,
    currency: "USD",
    purchaseDate: "2026-05-18",
    expiryDate: "2026-06-18",
    cycle: "Monthly",
    paymentMode: "Card",
    buyer: "Alex",
    accountHolder: "",
    accountEmail: "",
    accountPassword: "",
    category: "AI",
    team: "Development",
    autoPay: true,
    color: "#10A37F",
    logo: "AI",
    active: true,
  },
  {
    id: "11",
    platform: "YouTube Premium",
    plan: "Family",
    cost: 22.99,
    currency: "USD",
    purchaseDate: "2026-05-22",
    expiryDate: "2026-06-22",
    cycle: "Monthly",
    paymentMode: "Card",
    buyer: "Taylor",
    accountHolder: "",
    accountEmail: "",
    accountPassword: "",
    category: "Entertainment",
    team: "Social Media",
    autoPay: false,
    color: "#FF0000",
    logo: "YT",
    active: true,
  },
  {
    id: "12",
    platform: "Notion",
    plan: "Team",
    cost: 96.00,
    currency: "USD",
    purchaseDate: "2026-01-15",
    expiryDate: "2027-01-15",
    cycle: "Annual",
    paymentMode: "Card",
    buyer: "Jordan",
    accountHolder: "",
    accountEmail: "",
    accountPassword: "",
    category: "Productivity",
    team: "Development",
    autoPay: false,
    color: "#000000",
    logo: "No",
    active: true,
  },
  {
    id: "13",
    platform: "1Password",
    plan: "Teams",
    cost: 19.95,
    currency: "USD",
    purchaseDate: "2026-04-01",
    expiryDate: "2026-07-01",
    cycle: "Quarterly",
    paymentMode: "Card",
    buyer: "Alex",
    accountHolder: "",
    accountEmail: "",
    accountPassword: "",
    category: "Productivity",
    team: "Development",
    autoPay: false,
    color: "#1A8CFF",
    logo: "1P",
    active: true,
  },
  {
    id: "14",
    platform: "Dropbox",
    plan: "Business",
    cost: 20.00,
    currency: "USD",
    purchaseDate: "2026-05-08",
    expiryDate: "2026-06-08",
    cycle: "Monthly",
    paymentMode: "Card",
    buyer: "Taylor",
    accountHolder: "",
    accountEmail: "",
    accountPassword: "",
    category: "Storage",
    team: "Graphic Design",
    autoPay: false,
    color: "#0061FF",
    logo: "DB",
    active: true,
  },
];

export const categoryColors: Record<string, string> = {
  Entertainment: "#E50914",
  Productivity: "#6366F1",
  "Dev Tools": "#24292E",
  Cloud: "#FF9900",
  Design: "#F24E1E",
  AI: "#10A37F",
  Communication: "#4A154B",
  Storage: "#0061FF",
};

export const teamColors: Record<Team, { bg: string; color: string; light: string }> = {
  Development: { bg: "rgba(99,102,241,0.08)", color: "#6366f1", light: "rgba(99,102,241,0.15)" },
  "Graphic Design": { bg: "rgba(236,72,153,0.08)", color: "#ec4899", light: "rgba(236,72,153,0.15)" },
  "Social Media": { bg: "rgba(245,158,11,0.08)", color: "#f59e0b", light: "rgba(245,158,11,0.15)" },
};

export const TEAM_ORDER: Team[] = DEFAULT_TEAMS;

export function getMonthlyCost(sub: Subscription): number {
  if (sub.cycle === "Monthly") return sub.cost;
  if (sub.cycle === "Annual") return sub.cost / 12;
  if (sub.cycle === "Quarterly") return sub.cost / 3;
  return sub.cost;
}

export function getAnnualCost(sub: Subscription): number {
  if (sub.cycle === "Monthly") return sub.cost * 12;
  if (sub.cycle === "Annual") return sub.cost;
  if (sub.cycle === "Quarterly") return sub.cost * 4;
  return sub.cost;
}

export function getINRMonthlyCost(sub: Subscription): number {
  const monthly = getMonthlyCost(sub);
  return sub.currency === "USD" ? monthly * USD_TO_INR : monthly;
}

export function getINRAnnualCost(sub: Subscription): number {
  const annual = getAnnualCost(sub);
  return sub.currency === "USD" ? annual * USD_TO_INR : annual;
}

export function getUSDMonthlyCost(sub: Subscription): number {
  const monthly = getMonthlyCost(sub);
  return sub.currency === "INR" ? monthly / USD_TO_INR : monthly;
}

export function getUSDAnnualCost(sub: Subscription): number {
  const annual = getAnnualCost(sub);
  return sub.currency === "INR" ? annual / USD_TO_INR : annual;
}

export function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getNextExpiryDate(subscription: Subscription, baseDate = subscription.expiryDate): string {
  const nextDate = new Date(baseDate);
  if (subscription.cycle === "Monthly") {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else if (subscription.cycle === "Quarterly") {
    nextDate.setMonth(nextDate.getMonth() + 3);
  } else if (subscription.cycle === "Annual") {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  }
  return nextDate.toISOString().split("T")[0];
}

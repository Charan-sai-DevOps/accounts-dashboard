export type BillingCycle = "Monthly" | "Annual" | "Quarterly";
export type PaymentMode = "Card" | "UPI";
export type Category = "Entertainment" | "Productivity" | "Dev Tools" | "Cloud" | "Design" | "AI" | "Communication" | "Storage";
export type Currency = "USD" | "INR";
export type Team = "Development" | "Graphic Design" | "Social Media";

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

export const USD_TO_INR = 84;

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

export const categoryColors: Record<Category, string> = {
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

export const TEAM_ORDER: Team[] = ["Development", "Graphic Design", "Social Media"];

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

export function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

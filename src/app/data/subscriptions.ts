export type BillingCycle = "Monthly" | "Annual" | "Quarterly";
export type PaymentMode = "Card" | "PayPal" | "Bank Transfer" | "Crypto";
export type Category = "Entertainment" | "Productivity" | "Dev Tools" | "Cloud" | "Design" | "AI" | "Communication" | "Storage";

export interface Subscription {
  id: string;
  platform: string;
  plan: string;
  cost: number;
  purchaseDate: string;
  expiryDate: string;
  cycle: BillingCycle;
  paymentMode: PaymentMode;
  buyer: string;
  category: Category;
  color: string;
  logo: string;
  active: boolean;
}

export const initialSubscriptions: Subscription[] = [
  {
    id: "1",
    platform: "Netflix",
    plan: "Premium",
    cost: 22.99,
    purchaseDate: "2026-05-01",
    expiryDate: "2026-06-01",
    cycle: "Monthly",
    paymentMode: "Card",
    buyer: "Alex",
    category: "Entertainment",
    color: "#E50914",
    logo: "N",
    active: true,
  },
  {
    id: "2",
    platform: "Spotify",
    plan: "Family",
    cost: 17.99,
    purchaseDate: "2026-05-10",
    expiryDate: "2026-06-10",
    cycle: "Monthly",
    paymentMode: "Card",
    buyer: "Alex",
    category: "Entertainment",
    color: "#1DB954",
    logo: "S",
    active: true,
  },
  {
    id: "3",
    platform: "Adobe CC",
    plan: "All Apps",
    cost: 59.99,
    purchaseDate: "2026-04-15",
    expiryDate: "2026-05-29",
    cycle: "Monthly",
    paymentMode: "Card",
    buyer: "Jordan",
    category: "Design",
    color: "#FF0000",
    logo: "Ai",
    active: true,
  },
  {
    id: "4",
    platform: "GitHub",
    plan: "Team",
    cost: 44.00,
    purchaseDate: "2026-01-01",
    expiryDate: "2027-01-01",
    cycle: "Annual",
    paymentMode: "Card",
    buyer: "Alex",
    category: "Dev Tools",
    color: "#24292E",
    logo: "GH",
    active: true,
  },
  {
    id: "5",
    platform: "AWS",
    plan: "Business",
    cost: 120.00,
    purchaseDate: "2026-05-20",
    expiryDate: "2026-06-20",
    cycle: "Monthly",
    paymentMode: "Bank Transfer",
    buyer: "Taylor",
    category: "Cloud",
    color: "#FF9900",
    logo: "AWS",
    active: true,
  },
  {
    id: "6",
    platform: "Slack",
    plan: "Pro",
    cost: 87.50,
    purchaseDate: "2026-03-01",
    expiryDate: "2026-06-01",
    cycle: "Quarterly",
    paymentMode: "Card",
    buyer: "Jordan",
    category: "Communication",
    color: "#4A154B",
    logo: "Sl",
    active: true,
  },
  {
    id: "7",
    platform: "Zoom",
    plan: "Business",
    cost: 19.99,
    purchaseDate: "2026-05-15",
    expiryDate: "2026-06-15",
    cycle: "Monthly",
    paymentMode: "PayPal",
    buyer: "Taylor",
    category: "Communication",
    color: "#2D8CFF",
    logo: "Z",
    active: true,
  },
  {
    id: "8",
    platform: "Linear",
    plan: "Business",
    cost: 16.00,
    purchaseDate: "2026-02-01",
    expiryDate: "2027-02-01",
    cycle: "Annual",
    paymentMode: "Card",
    buyer: "Alex",
    category: "Dev Tools",
    color: "#5E6AD2",
    logo: "Li",
    active: true,
  },
  {
    id: "9",
    platform: "Figma",
    plan: "Professional",
    cost: 15.00,
    purchaseDate: "2026-05-05",
    expiryDate: "2026-06-05",
    cycle: "Monthly",
    paymentMode: "Card",
    buyer: "Jordan",
    category: "Design",
    color: "#F24E1E",
    logo: "Fig",
    active: true,
  },
  {
    id: "10",
    platform: "ChatGPT Plus",
    plan: "Plus",
    cost: 20.00,
    purchaseDate: "2026-05-18",
    expiryDate: "2026-06-18",
    cycle: "Monthly",
    paymentMode: "Card",
    buyer: "Alex",
    category: "AI",
    color: "#10A37F",
    logo: "AI",
    active: true,
  },
  {
    id: "11",
    platform: "YouTube Premium",
    plan: "Family",
    cost: 22.99,
    purchaseDate: "2026-05-22",
    expiryDate: "2026-06-22",
    cycle: "Monthly",
    paymentMode: "Card",
    buyer: "Taylor",
    category: "Entertainment",
    color: "#FF0000",
    logo: "YT",
    active: true,
  },
  {
    id: "12",
    platform: "Notion",
    plan: "Team",
    cost: 96.00,
    purchaseDate: "2026-01-15",
    expiryDate: "2027-01-15",
    cycle: "Annual",
    paymentMode: "Card",
    buyer: "Jordan",
    category: "Productivity",
    color: "#000000",
    logo: "No",
    active: true,
  },
  {
    id: "13",
    platform: "1Password",
    plan: "Teams",
    cost: 19.95,
    purchaseDate: "2026-04-01",
    expiryDate: "2026-07-01",
    cycle: "Quarterly",
    paymentMode: "Card",
    buyer: "Alex",
    category: "Productivity",
    color: "#1A8CFF",
    logo: "1P",
    active: true,
  },
  {
    id: "14",
    platform: "Dropbox",
    plan: "Business",
    cost: 20.00,
    purchaseDate: "2026-05-08",
    expiryDate: "2026-06-08",
    cycle: "Monthly",
    paymentMode: "PayPal",
    buyer: "Taylor",
    category: "Storage",
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

export function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

import { ratingCategoryDefaults } from "./adminMockData";

export const REVIEW_TABS = [
  { id: "flagged-reviews", label: "Flagged Reviews" },
  { id: "flagged-keywords", label: "Flagged Keywords" },
  { id: "rating-categories", label: "Rating Categories" },
] as const;

export type ReviewTabId = (typeof REVIEW_TABS)[number]["id"];

export const reviewSummaryStats = {
  flaggedReviews: 38,
  pendingAction: 23,
  removed: 128,
  hidden: 75,
};

export const mockFlaggedKeywordsList = [
  "rude",
  "worst",
  "bad",
  "scam",
  "terrible",
  "awful",
  "disgusting",
  "unprofessional",
];

export type FlaggedReviewRow = {
  id: string;
  professional: string;
  professionalCategory: string;
  professionalInitials: string;
  client: string;
  clientType: "Individual Client" | "Company Client";
  clientInitials: string;
  rating: number;
  text: string;
  date: string;
  time: string;
};

const PROFESSIONALS = [
  { name: "Glamour Studio", category: "Hair & Beauty", initials: "GS" },
  { name: "Beauty by Sarah", category: "Skincare", initials: "BS" },
  { name: "Urban Cuts", category: "Barber", initials: "UC" },
  { name: "Glow Studio", category: "Make-up", initials: "GS" },
  { name: "Luxe Hair & Spa", category: "Hair & Beauty", initials: "LH" },
  { name: "The Hair Project", category: "Hair", initials: "TH" },
];

const CLIENTS = [
  { name: "Emma Thompson", type: "Individual Client" as const, initials: "ET" },
  { name: "Marcus Weber", type: "Individual Client" as const, initials: "MW" },
  { name: "Corporate Events Ltd", type: "Company Client" as const, initials: "CE" },
  { name: "Sofia Rodriguez", type: "Individual Client" as const, initials: "SR" },
  { name: "James O'Connor", type: "Individual Client" as const, initials: "JO" },
  { name: "Anna Smit", type: "Individual Client" as const, initials: "AS" },
];

const REVIEW_TEXTS = [
  "The stylist was incredibly rude and unprofessional. Worst experience ever.",
  "Terrible service — felt like a scam. Would not recommend to anyone.",
  "Bad haircut and awful customer service. Very disappointing visit.",
  "Disgusting hygiene standards. This was the worst salon I've been to.",
  "Unprofessional staff and rude attitude from start to finish.",
  "Not worth the price. Bad experience overall, terrible value.",
  "Awful results and the team was rude when I complained.",
  "Worst appointment I've ever had. Scam-level pricing for bad work.",
];

function generateFlaggedReviews(): FlaggedReviewRow[] {
  const rows: FlaggedReviewRow[] = [];
  for (let i = 0; i < 38; i += 1) {
    const pro = PROFESSIONALS[i % PROFESSIONALS.length];
    const client = CLIENTS[i % CLIENTS.length];
    const day = String((i % 28) + 1).padStart(2, "0");
    const month = String((i % 12) + 1).padStart(2, "0");
    rows.push({
      id: `fr-${i + 1}`,
      professional: pro.name,
      professionalCategory: pro.category,
      professionalInitials: pro.initials,
      client: client.name,
      clientType: client.type,
      clientInitials: client.initials,
      rating: i % 5 === 0 ? 1 : i % 3 === 0 ? 2 : 1,
      text: REVIEW_TEXTS[i % REVIEW_TEXTS.length],
      date: `2025-${month}-${day}`,
      time: `${String(9 + (i % 8)).padStart(2, "0")}:${String((i * 11) % 60).padStart(2, "0")}`,
    });
  }
  return rows;
}

export const mockFlaggedReviewRows = generateFlaggedReviews();

export const ratingCategoryConfig = [
  {
    id: "excellent" as const,
    emoji: "😊",
    ...ratingCategoryDefaults.excellent,
    color: "#2E7D32",
    bg: "rgba(76, 175, 80, 0.12)",
  },
  {
    id: "good" as const,
    emoji: "🙂",
    ...ratingCategoryDefaults.good,
    color: "#DC6803",
    bg: "rgba(220, 104, 3, 0.12)",
  },
  {
    id: "average" as const,
    emoji: "😐",
    ...ratingCategoryDefaults.average,
    color: "#B54708",
    bg: "rgba(181, 71, 8, 0.1)",
  },
  {
    id: "poor" as const,
    emoji: "😞",
    ...ratingCategoryDefaults.poor,
    color: "#D92D20",
    bg: "rgba(217, 45, 32, 0.1)",
  },
];

export const PROFESSIONAL_FILTER_OPTIONS = [
  { value: "all", label: "All Professionals" },
  ...PROFESSIONALS.map((p) => ({ value: p.name, label: p.name })),
];

export const RATING_FILTER_OPTIONS = [
  { value: "all", label: "All Ratings" },
  { value: "1", label: "1 star" },
  { value: "2", label: "2 stars" },
  { value: "3", label: "3 stars" },
  { value: "4", label: "4 stars" },
  { value: "5", label: "5 stars" },
];

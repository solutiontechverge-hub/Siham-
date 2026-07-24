import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import StarOutlineOutlinedIcon from "@mui/icons-material/StarOutlineOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import type { SvgIconComponent } from "@mui/icons-material";
import {
  rankingFactors as liveRankingFactors,
  type RankingImpact,
} from "../../adminMockData";

export const FACTOR_ICONS: Record<
  string,
  { icon: SvgIconComponent; bg: string; color: string }
> = {
  onlineBooking: {
    icon: EventAvailableOutlinedIcon,
    bg: "rgba(76, 175, 80, 0.12)",
    color: "#2E7D32",
  },
  onlineTransaction: {
    icon: PaymentsOutlinedIcon,
    bg: "rgba(127, 86, 217, 0.12)",
    color: "#6941C6",
  },
  avgRating: {
    icon: StarOutlineOutlinedIcon,
    bg: "rgba(255, 181, 71, 0.16)",
    color: "#DC6803",
  },
  totalReviews: {
    icon: RateReviewOutlinedIcon,
    bg: "rgba(33, 184, 191, 0.12)",
    color: "#149CA7",
  },
  activity: {
    icon: ScheduleOutlinedIcon,
    bg: "rgba(59, 130, 246, 0.12)",
    color: "#2563EB",
  },
};

export const IMPACT_STYLES: Record<
  RankingImpact,
  { bg: string; fg: string; label: string }
> = {
  high: { bg: "rgba(76, 175, 80, 0.12)", fg: "#2E7D32", label: "High" },
  medium: { bg: "rgba(220, 104, 3, 0.14)", fg: "#DC6803", label: "Medium" },
  low: { bg: "rgba(59, 130, 246, 0.12)", fg: "#2563EB", label: "Low" },
};

/** Live app weights — read-only; only display order can be changed. */
export const LIVE_FACTORS_BY_ID = Object.fromEntries(
  liveRankingFactors.map((f) => [f.id, f]),
);

export { liveRankingFactors };

export function reorderIds(ids: string[], from: number, to: number) {
  const next = [...ids];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

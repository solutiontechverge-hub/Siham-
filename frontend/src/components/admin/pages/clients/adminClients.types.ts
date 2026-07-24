import type { MockClient } from "../../adminMockData";

export type SortOption =
  | "reg_desc"
  | "reg_asc"
  | "booking_desc"
  | "booking_asc";

export type ClientModal = "view" | "disable" | "delete" | "note" | null;

export type ClientRowActionsProps = {
  client: MockClient;
  onView: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onNote: () => void;
};

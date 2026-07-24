import type { ActivityLogAction, ActivityLogModule, ActivityLogRow } from "../../activityLogData";

export type ActivityLogQueryArgs = {
  limit: number;
  offset: number;
  search?: string;
  action: string;
  module: string;
  user: string;
  from?: string;
  to?: string;
};

export type { ActivityLogAction, ActivityLogModule, ActivityLogRow };

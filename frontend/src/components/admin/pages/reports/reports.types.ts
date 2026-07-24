import type { ReportRow, ReportStatus, ReportUserType } from "../../reportsData";

export type AdminReportsPageProps = {
  embedded?: boolean;
};

export type ReportUserTypeStyle = {
  bg: string;
  color: string;
};

export type ReportStatusStyle = ReportUserTypeStyle & {
  label: string;
};

export type {
  ReportRow,
  ReportStatus,
  ReportUserType,
};

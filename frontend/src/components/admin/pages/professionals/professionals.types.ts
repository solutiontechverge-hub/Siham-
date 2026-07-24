import type { MockProfessional, ProfessionalCategory } from "../../adminMockData";

export type ProfessionalStatusPillProps = {
  bg: string;
  fg: string;
  label: string;
};

export type ProfessionalCategoryStyle = {
  bg: string;
  fg: string;
};

export type ProfessionalVerificationStyle = ProfessionalCategoryStyle & {
  label: string;
};

export type ProfessionalTableRow = MockProfessional;
export type { MockProfessional, ProfessionalCategory };

import { alpha } from "@mui/material/styles";
import { mollureLabelSx, mollureTableHeaderSx } from "../../../../../theme/mollureHierarchy";
import { mollureDensePaperSx } from "../../../../../components/common/mollureFormSx";

export function createInvoiceSettingsSx(m: {
  navy: string;
}) {
  const sectionCardSx = mollureDensePaperSx(m.navy, { borderAlpha: 0.1 });

  const headerSx = {
    px: 2,
    py: 1.4,
    bgcolor: alpha(m.navy, 0.02),
    borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
  } as const;

  const tinyBtnSx = {
    borderRadius: "7px",
    textTransform: "none",
    fontWeight: 800,
    fontSize: 12,
    height: 28,
    px: 1.1,
  } as const;

  const templateTileSx = () =>
    ({
      borderRadius: "10px",
      border: `1px dashed ${alpha(m.navy, 0.16)}`,
      bgcolor: "#fff",
      px: 1.25,
      py: 1.25,
      minHeight: 108,
      minWidth: 170,
      flex: "1 1 0",
      boxShadow: "none",
    }) as const;

  const tableHeadCellSx = {
    ...mollureTableHeaderSx(m.navy),
    borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
    bgcolor: alpha(m.navy, 0.03),
    py: 1.25,
    textAlign: "center",
  } as const;

  const tableBodyCellSx = {
    ...mollureLabelSx(m.navy, { fontWeight: 700 }),
    borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
    py: 1.2,
    textAlign: "center",
  } as const;

  const formPanelSx = {
    borderRadius: "10px",
    border: `1px solid ${alpha(m.navy, 0.1)}`,
    bgcolor: alpha(m.navy, 0.01),
    p: 2,
  } as const;

  const rowLabelSx = {
    width: 86,
    minWidth: 86,
    ...mollureLabelSx(m.navy, { color: alpha(m.navy, 0.7) }),
    pt: 1.25,
  } as const;

  return {
    sectionCardSx,
    headerSx,
    tinyBtnSx,
    templateTileSx,
    tableHeadCellSx,
    tableBodyCellSx,
    formPanelSx,
    rowLabelSx,
  };
}

export type InvoiceSettingsSx = ReturnType<typeof createInvoiceSettingsSx>;

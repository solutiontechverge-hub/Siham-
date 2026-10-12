"use client";

import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  mollureBodyMutedSx,
  mollureBodySx,
  mollureLabelSx,
  mollureSectionTitleSx,
} from "../../../theme/mollureHierarchy";
import { BodyText } from "../../ui/typography";
import { financeMutedTextSx, financePriceTextSx } from "./financeDocumentUtils";

type FinancePreviewLabelValueRowProps = {
  label: string;
  value: string;
  /** meta: receipt header rows; line: item rows; total: total amount row; fee: cancel-fee summary */
  variant?: "meta" | "line" | "total" | "fee" | "feeEmphasize";
};

/** Shared label/value row for finance receipt (and similar) previews. */
export function FinancePreviewLabelValueRow({
  label,
  value,
  variant = "meta",
}: FinancePreviewLabelValueRowProps) {
  const m = useTheme().palette.mollure;
  const isMeta = variant === "meta";
  const isTotal = variant === "total";
  const isFee = variant === "fee" || variant === "feeEmphasize";
  const feeEmphasize = variant === "feeEmphasize";

  if (isFee) {
    return (
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1}
      >
        <BodyText
          sx={
            feeEmphasize
              ? mollureLabelSx(m.navy)
              : mollureBodyMutedSx(m.navy)
          }
        >
          {label}
        </BodyText>
        <BodyText sx={mollureLabelSx(m.navy, financePriceTextSx)}>{value}</BodyText>
      </Stack>
    );
  }

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems={isMeta ? "flex-start" : "center"}
      spacing={isMeta ? 2 : undefined}
    >
      <BodyText
        sx={
          isMeta
            ? mollureBodyMutedSx(m.navy)
            : isTotal
              ? mollureLabelSx(m.navy, { lineHeight: 1 })
              : mollureBodySx(m.navy)
        }
      >
        {label}
      </BodyText>
      <BodyText
        sx={
          isTotal
            ? mollureSectionTitleSx(m.navy, {
                textAlign: isMeta ? "right" : undefined,
                lineHeight: 1,
                ...financePriceTextSx,
              })
            : mollureLabelSx(m.navy, {
                textAlign: isMeta ? "right" : undefined,
                ...financePriceTextSx,
              })
        }
      >
        {value}
      </BodyText>
    </Stack>
  );
}

/** Muted BodyText lines inside FinanceInfoBlock panels. */
export function FinanceMutedLines({
  lines,
  navy,
}: {
  lines: readonly string[];
  navy: string;
}) {
  return (
    <>
      {lines.map((line) => (
        <BodyText key={line} sx={financeMutedTextSx(navy)}>
          {line}
        </BodyText>
      ))}
    </>
  );
}

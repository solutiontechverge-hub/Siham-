import * as React from "react";
import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText, SubHeading } from "../../ui/typography";

export type TransactionsHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
};

export default function TransactionsHeader({ title, subtitle }: TransactionsHeaderProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Box sx={{ px: 2.25, py: 1.75 }}>
      <SubHeading sx={{ fontSize: 18, lineHeight: 1.15, color: alpha(m.navy, 0.88) }}>
        {title}
      </SubHeading>
      {subtitle ? (
        <BodyText sx={{ mt: 0.4, color: alpha(m.navy, 0.55), fontSize: 12.5, lineHeight: 1.4 }}>
          {subtitle}
        </BodyText>
      ) : null}
    </Box>
  );
}


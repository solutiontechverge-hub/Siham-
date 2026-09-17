"use client";

import {
  Box,
} from "@mui/material";

import {
  alpha,
} from "@mui/material/styles";

import { BodyText } from "../../../ui/typography";

import {
  fmtTimeLabel,
  timelineGridSlotBg,
} from "../calendar.utils";

import {
  useProfessionalFixedLocationCalendar,
} from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarDayWeekViewTimeColumnBag = Pick<
  Vm,
  | "m"
  | "rowPx"
  | "slotLines"
  | "timelineGridSlotColors"
  | "timelineHeaderPx"
>;

export type ProfessionalFixedLocationCalendarDayWeekViewTimeColumnProps = {
  bag: ProfessionalFixedLocationCalendarDayWeekViewTimeColumnBag;
};

/** Left time labels column */
export default function ProfessionalFixedLocationCalendarDayWeekViewTimeColumn({
  bag,
}: ProfessionalFixedLocationCalendarDayWeekViewTimeColumnProps) {
  const {
    m,
    rowPx,
    slotLines,
    timelineGridSlotColors,
    timelineHeaderPx,
  } = bag;

  return (
                  <Box
                    sx={{
                      gridColumn: 1,
                      gridRow: 1,
                      position: "relative",
                      zIndex: 12,
                      bgcolor: "#fff",
                      borderRight: `1px solid ${alpha(m.navy, 0.08)}`,
                    }}
                  >
                    {timelineHeaderPx > 0 ? (
                      <Box
                        sx={{
                          height: timelineHeaderPx,
                          borderBottom: `1px solid ${alpha(m.navy, 0.07)}`,
                        }}
                      />
                    ) : null}
                    {slotLines.map((t, idx) => {
                      return (
                        <Box
                          key={t}
                          sx={{
                            height: rowPx,
                            px: 0.45,
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "flex-end",
                            pt: idx === 0 ? 1.15 : 1,
                            bgcolor: timelineGridSlotBg(
                              t,
                              timelineGridSlotColors,
                            ),
                          }}
                        >
                          <BodyText
                            sx={{
                              fontSize: 9.5,
                              fontWeight: 600,
                              color: alpha(m.navy, 0.58),
                              lineHeight: 1,
                            }}
                          >
                            {fmtTimeLabel(t)}
                          </BodyText>
                        </Box>
                      );
                    })}
                  </Box>
  );
}

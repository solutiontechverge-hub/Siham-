"use client";

import {
  mollureLabelSx,
} from "../../../../theme/mollureHierarchy";

import {
  Box,
  ButtonBase,
  Popover,
  Stack,
} from "@mui/material";

import {
  alpha,
} from "@mui/material/styles";

import {
  BodyText,
} from "../../../ui/typography";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningAddMenuBag = Pick<
  Vm,
  | "addMenuButtonRef"
  | "m"
  | "openSelectProducts"
  | "openSelectServices"
  | "openSelectUniqueItems"
  | "setSlotAddMenuAnchor"
  | "slotAddMenuAnchor"
>;

type Props = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningAddMenuBag;
};

export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningAddMenu({ bag }: Props) {
  const {
    addMenuButtonRef,
    m,
    openSelectProducts,
    openSelectServices,
    openSelectUniqueItems,
    setSlotAddMenuAnchor,
    slotAddMenuAnchor,
  } = bag;

  return (
            <Popover
              open={Boolean(slotAddMenuAnchor)}
              anchorEl={slotAddMenuAnchor}
              onClose={() => setSlotAddMenuAnchor(null)}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 0.75,
                    borderRadius: "10px",
                    border: `1px solid ${alpha(m.navy, 0.1)}`,
                    boxShadow: "0 10px 24px rgba(16, 35, 63, 0.12)",
                    overflow: "hidden",
                    width:
                      slotAddMenuAnchor?.offsetWidth ??
                      addMenuButtonRef.current?.offsetWidth ??
                      220,
                  },
                },
              }}
            >
              <Stack sx={{ py: 0.5 }}>
                <ButtonBase
                  onClick={() => {
                    setSlotAddMenuAnchor(null);
                    openSelectServices();
                  }}
                  sx={{
                    width: "100%",
                    textAlign: "left",
                    px: 1.5,
                    py: 1.1,
                    display: "block",
                    "&:hover": { bgcolor: alpha(m.navy, 0.04) },
                  }}
                >
                  <BodyText
                    component="span"
                    sx={{
                      ...mollureLabelSx(m.navy),
                      lineHeight: 1,
                    }}
                  >
                    Services
                  </BodyText>
                </ButtonBase>
                <Box
                  sx={{
                    height: 1,
                    bgcolor: alpha(m.navy, 0.08),
                    mx: 1,
                  }}
                />
                <ButtonBase
                  onClick={() => {
                    setSlotAddMenuAnchor(null);
                    openSelectProducts();
                  }}
                  sx={{
                    width: "100%",
                    textAlign: "left",
                    px: 1.5,
                    py: 1.1,
                    display: "block",
                    "&:hover": { bgcolor: alpha(m.navy, 0.04) },
                  }}
                >
                  <BodyText
                    component="span"
                    sx={{
                      ...mollureLabelSx(m.navy),
                      lineHeight: 1,
                    }}
                  >
                    Product
                  </BodyText>
                </ButtonBase>
                <Box
                  sx={{
                    height: 1,
                    bgcolor: alpha(m.navy, 0.08),
                    mx: 1,
                  }}
                />
                <ButtonBase
                  onClick={() => {
                    setSlotAddMenuAnchor(null);
                    openSelectUniqueItems();
                  }}
                  sx={{
                    width: "100%",
                    textAlign: "left",
                    px: 1.5,
                    py: 1.1,
                    display: "block",
                    "&:hover": { bgcolor: alpha(m.navy, 0.04) },
                  }}
                >
                  <BodyText
                    component="span"
                    sx={{
                      ...mollureLabelSx(m.navy),
                      lineHeight: 1,
                    }}
                  >
                    Unique item
                  </BodyText>
                </ButtonBase>
              </Stack>
            </Popover>
  );
}

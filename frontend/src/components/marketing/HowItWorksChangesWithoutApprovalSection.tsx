"use client";

import Image from "next/image";
import { Box, Stack } from "@mui/material";
import { HowItWorksSectionTitle } from "../howItWorks";
import { howItWorksData } from "../../app/how-it-works/howItWorks.data";
import { mollureSectionGapSx } from "../../theme/spacing";
import { HowItWorksBookingEditedBellIcon } from "../../../images";
import { Typography } from "../ui/typography";
import {
  CheckOutlined,
  BoltOutlined,
  FormatListBulletedOutlined,
} from "@mui/icons-material";
import {
  cardTitleSx,
  changesSubsectionCardSx,
  changesInnerCardSx,
  changesSubsectionIconSx,
} from "./HowItWorksPagePrimitives";

export function HowItWorksChangesWithoutApprovalSection() {
  return (
      <Box
        sx={{
          ...mollureSectionGapSx,
          bgcolor: "#F9FAFB",
          borderRadius: 3,
          px: { xs: 2.5, sm: 4 },
          py: { xs: 3.5, sm: 4.5 },
        }}
      >
        <HowItWorksSectionTitle
          title={howItWorksData.changesWithoutApproval.title}
          sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}
        />

        <Stack spacing={3}>
          {(
            [
              {
                block: howItWorksData.changesWithoutApproval.detailChanges,
                icon: <BoltOutlined sx={{ fontSize: 22 }} />,
              },
              {
                block: howItWorksData.changesWithoutApproval.serviceOrder,
                icon: <FormatListBulletedOutlined sx={{ fontSize: 22 }} />,
              },
            ] as const
          ).map(({ block, icon }) => (
            <Box sx={changesSubsectionCardSx} key={block.title}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={changesSubsectionIconSx}>{icon}</Box>
                  <Typography variant="h6" sx={cardTitleSx}>
                    {block.title}
                  </Typography>
                </Stack>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.65 }}
                >
                  {block.body}
                </Typography>

                <Box sx={changesInnerCardSx}>
                  <Stack spacing={1.75} mb={2.5}>
                    {block.items.map((item) => (
                      <Stack
                        key={item.text}
                        direction="row"
                        spacing={1.25}
                        alignItems="center"
                      >
                        {item.kind === "check" ? (
                          <CheckOutlined
                            sx={{
                              color: "primary.main",
                              fontSize: 18,
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              flexShrink: 0,
                              display: "grid",
                              placeItems: "center",
                            }}
                          >
                            <Image
                              src={HowItWorksBookingEditedBellIcon}
                              alt=""
                              width={20}
                              height={20}
                            />
                          </Box>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          {item.text}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.65 }}
                  >
                    {block.footer}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
  );
}

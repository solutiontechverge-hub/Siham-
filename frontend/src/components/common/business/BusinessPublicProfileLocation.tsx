"use client";

import {
  mollureBodyMutedSx,
  mollureLabelSx,
} from "../../../theme/mollureHierarchy";

import AppButton from "../AppButton";
import * as React from "react";
import { alpha, useTheme } from "@mui/material/styles";
import Image from "next/image";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import {
  Box,
  ButtonBase,
  ClickAwayListener,
  Divider,
  Paper,
  Popper,
  Stack,
  Typography,
} from "@mui/material";
import type { BusinessPublicProfileData } from "../../../data/businessPublicProfile.data";
import {
  buildDesiredMunicipalityList,
  buildDesiredProvinceDisplays,
  businessPublicProfileUiCopy,
  getDesiredMunicipalitiesForProvinceDisplay,
} from "../../../data/businessPublicProfile.data";
import { DesiredLocationIcon, FixedLocationIcon } from "../../../../images";

function ProfileDesiredLocationDisplayChip({ label }: { label: string }) {
  const m = useTheme().palette.mollure;
  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        minHeight: 36,
        px: 1.25,
        py: 0.5,
        borderRadius: "10px",
        bgcolor: "#fff",
        border: `1px solid ${alpha(m.navy, 0.12)}`,
      }}
    >
      <Typography
        noWrap
        sx={{
          fontSize: 13,
          fontWeight: 500,
          color: alpha(m.navy, label === businessPublicProfileUiCopy.emptyValue ? 0.45 : 0.88),
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function ProfileDesiredLocationGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(4, 1fr)",
        },
        gap: 1.1,
        width: "100%",
      }}
    >
      {children}
    </Box>
  );
}

function ProfileDesiredProvinceChip({
  label,
  municipalities,
}: {
  label: string;
  municipalities: string[];
}) {
  const m = useTheme().palette.mollure;
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  const hasList = municipalities.length > 0;

  return (
    <>
      <ButtonBase
        ref={anchorRef}
        onClick={() => {
          if (hasList) setOpen((value) => !value);
        }}
        sx={{
          width: "100%",
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          minHeight: 36,
          px: 1.25,
          py: 0.5,
          borderRadius: "10px",
          bgcolor: "#fff",
          border: `1px solid ${alpha(m.navy, 0.12)}`,
          textAlign: "left",
          cursor: hasList ? "pointer" : "default",
        }}
      >
        <Typography
          noWrap
          sx={{
            fontSize: 13,
            fontWeight: 500,
            color: alpha(m.navy, label === businessPublicProfileUiCopy.emptyValue ? 0.45 : 0.88),
          }}
        >
          {label}
        </Typography>
        {hasList ? (
          <KeyboardArrowDownRoundedIcon
            sx={{
              fontSize: 20,
              color: alpha(m.navy, 0.38),
              flexShrink: 0,
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 150ms ease",
            }}
          />
        ) : null}
      </ButtonBase>

      {hasList ? (
        <Popper
          open={open}
          anchorEl={anchorRef.current}
          placement="bottom-start"
          modifiers={[{ name: "offset", options: { offset: [0, 6] } }]}
          sx={{
            zIndex: (theme) => theme.zIndex.modal,
            width: anchorRef.current?.offsetWidth,
          }}
        >
          <ClickAwayListener onClickAway={() => setOpen(false)}>
            <Paper
              elevation={0}
              sx={{
                mt: 0.25,
                width: "100%",
                maxHeight: 220,
                overflowY: "auto",
                borderRadius: "10px",
                border: `1px solid ${alpha(m.navy, 0.1)}`,
                boxShadow: "0 12px 28px rgba(16, 24, 40, 0.12)",
                p: 0.75,
              }}
            >
              <Stack spacing={0.5}>
                {municipalities.map((entry) => (
                  <Box
                    key={entry}
                    sx={{
                      px: 1.1,
                      py: 0.85,
                      borderRadius: "8px",
                      bgcolor: alpha(m.navy, 0.02),
                    }}
                  >
                    <Typography
                      sx={mollureBodyMutedSx(m.navy, { color: alpha(m.navy, 0.78) })}
                    >
                      {entry}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </ClickAwayListener>
        </Popper>
      ) : null}
    </>
  );
}

export function ProfileLocationSection({
  data,
  locationMode,
  supportsFixed,
  supportsDesired,
}: {
  data: BusinessPublicProfileData;
  locationMode: "fixed" | "desired";
  supportsFixed: boolean;
  supportsDesired: boolean;
}) {
  const showFixed =
    supportsFixed && (!supportsDesired || locationMode === "fixed");
  const showDesired =
    supportsDesired && (!supportsFixed || locationMode === "desired");
  const m = useTheme().palette.mollure;

  const provinceDisplays = React.useMemo(
    () => buildDesiredProvinceDisplays(data.desiredLocation),
    [data.desiredLocation],
  );
  const municipalityDisplays = React.useMemo(
    () => buildDesiredMunicipalityList(data.desiredLocation),
    [data.desiredLocation],
  );

  return (
    <Stack spacing={2}>
      {showFixed ? (
        <Box>
          {showDesired ? (
            <Typography sx={mollureLabelSx(m.navy, { mb: 0.75 })}>
              Fixed Location
            </Typography>
          ) : null}
          <Typography
            sx={mollureBodyMutedSx(m.navy, { color: alpha(m.navy, 0.62), lineHeight: 1.55 })}
          >
            {data.fixedLocation.formattedAddress}
          </Typography>
        </Box>
      ) : null}

      {showFixed && showDesired ? (
        <Divider sx={{ borderColor: alpha(m.navy, 0.08) }} />
      ) : null}

      {showDesired ? (
        <Box>
          <Typography sx={mollureLabelSx(m.navy, { mb: 1 })}>
            Specific Provinces
          </Typography>

          {data.desiredLocation.areaMode === "All Netherlands" ? (
            <ProfileDesiredLocationGrid>
              <ProfileDesiredProvinceChip
                label="All Netherlands"
                municipalities={["All Netherlands"]}
              />
            </ProfileDesiredLocationGrid>
          ) : (
            <Stack spacing={1.5}>
              <ProfileDesiredLocationGrid>
                {provinceDisplays.length > 0 ? (
                  provinceDisplays.map((item) => (
                    <ProfileDesiredProvinceChip
                      key={item.id}
                      label={item.label}
                      municipalities={getDesiredMunicipalitiesForProvinceDisplay(
                        data.desiredLocation,
                        item.province,
                      )}
                    />
                  ))
                ) : (
                  <ProfileDesiredLocationDisplayChip
                    label={businessPublicProfileUiCopy.emptyValue}
                  />
                )}
              </ProfileDesiredLocationGrid>

              <Box>
                <Typography sx={mollureLabelSx(m.navy, { mb: 1 })}>
                  Municipalities
                </Typography>
                <ProfileDesiredLocationGrid>
                  {municipalityDisplays.length > 0 ? (
                    municipalityDisplays.map((label) => (
                      <ProfileDesiredLocationDisplayChip
                        key={label}
                        label={label}
                      />
                    ))
                  ) : (
                    <ProfileDesiredLocationDisplayChip
                    label={businessPublicProfileUiCopy.emptyValue}
                  />
                  )}
                </ProfileDesiredLocationGrid>
              </Box>
            </Stack>
          )}
        </Box>
      ) : null}
    </Stack>
  );
}

function ProfileLocationSegmentButton({
  mode,
  active,
  onClick,
}: {
  mode: "fixed" | "desired";
  active: boolean;
  onClick: () => void;
}) {
  const m = useTheme().palette.mollure;
  const icon = mode === "fixed" ? FixedLocationIcon : DesiredLocationIcon;
  const label = mode === "fixed" ? "Fixed Location" : "Desired Location";

  return (
    <AppButton
      onClick={onClick}
      sx={{
        flex: 1,
        minWidth: 0,
        height: 38,
        minHeight: 38,
        py: 0.75,
        px: 0.75,
        textTransform: "none",
        fontWeight: 700,
        fontSize: 13,
        lineHeight: 1,
        borderRadius: 0,
        color: active ? "#fff" : m.slate,
        bgcolor: active ? m.teal : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.5,
        "&:hover": {
          bgcolor: active ? m.tealDark : alpha(m.teal, 0.08),
        },
      }}
    >
      <Box
        component="span"
        sx={{
          width: 16,
          height: 16,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Image
          src={icon}
          alt=""
          width={16}
          height={16}
          style={{
            filter: active ? "brightness(0) invert(1)" : "none",
          }}
        />
      </Box>
      <Box
        component="span"
        sx={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Box>
    </AppButton>
  );
}

export function ProfileLocationChoiceCards({
  locationMode,
  supportsFixed,
  supportsDesired,
  onChange,
}: {
  locationMode: "fixed" | "desired";
  supportsFixed: boolean;
  supportsDesired: boolean;
  onChange?: (mode: "fixed" | "desired") => void;
}) {
  const m = useTheme().palette.mollure;
  const canSwitch = supportsFixed && supportsDesired;

  if (!supportsFixed && !supportsDesired) return null;

  if (!canSwitch) {
    const mode = supportsDesired ? "desired" : "fixed";
    const icon = mode === "fixed" ? FixedLocationIcon : DesiredLocationIcon;
    const label = mode === "fixed" ? "Fixed Location" : "Desired Location";

    return (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.5,
          height: 38,
          minHeight: 38,
          py: 0.75,
          px: 1.25,
          borderRadius: "8px",
          bgcolor: alpha(m.teal, 0.1),
          border: `1px solid ${alpha(m.teal, 0.25)}`,
          minWidth: { xs: 0, sm: 180 },
          width: { xs: "100%", sm: "auto" },
        }}
      >
        <Image src={icon} alt="" width={16} height={16} />
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: m.teal, lineHeight: 1 }}>
          {label}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "stretch",
        minHeight: 38,
        width: { xs: "100%", sm: "auto" },
        minWidth: { xs: 0, sm: 420 },
        maxWidth: "100%",
        border: `1px solid ${alpha(m.navy, 0.12)}`,
        borderRadius: "8px",
        overflow: "hidden",
        bgcolor: "#fff",
      }}
      role="group"
      aria-label="Location type"
    >
      <ProfileLocationSegmentButton
        mode="fixed"
        active={locationMode === "fixed"}
        onClick={() => onChange?.("fixed")}
      />
      <Divider
        orientation="vertical"
        flexItem
        sx={{ borderColor: alpha(m.navy, 0.12) }}
      />
      <ProfileLocationSegmentButton
        mode="desired"
        active={locationMode === "desired"}
        onClick={() => onChange?.("desired")}
      />
    </Box>
  );
}

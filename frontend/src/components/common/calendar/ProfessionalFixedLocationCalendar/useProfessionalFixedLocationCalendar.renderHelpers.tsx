"use client";

import * as React from "react";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Box, ButtonBase, IconButton, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { BodyText } from "../../../ui/typography";
import AppButton from "../../AppButton";
import CalendarTeamMemberBadge from "../CalendarTeamMemberBadge";
import { TEAM_NAV_SCROLLBAR_PX } from "./professionalFixedLocationCalendar.data";
import type { InlineGuestDraftState } from "./useProfessionalFixedLocationCalendar.types";
import { createRenderInlineGuestFields } from "./useProfessionalFixedLocationCalendar.renderHelpers.inlineGuest";

type TeamHeaderResource = {
  id: string;
  name: string;
  avatarText: string;
  photoSrc?: string;
};

type SplitScreenPair = {
  primaryId: string;
  partnerId: string;
};

type SplitScreenMembers = {
  primary: { name: string };
  partner: { name: string };
};

type InlineGuestDraft = InlineGuestDraftState;

export type UseProfessionalFixedLocationCalendarRenderHelpersArgs = {
  m: { navy: string; teal: string };
  laneHeaderPx: number;
  teamNavArrowWidthPx?: number;
  viewMode: string;
  selectedResourceId: string | null | undefined;
  activeResourceId: string | null | undefined;
  splitScreen: SplitScreenPair | null;
  splitScreenMembers: SplitScreenMembers | null;
  discardSplitScreen: () => void;
  teamHeaderScrollOverflowSx: object;
  teamHeaderGridTemplateColumns: string;
  teamHeaderScrollContentWidth: number | string;
  teamHeaderResources: readonly TeamHeaderResource[];
  teamHeaderNeedsScroll: boolean;
  activeDateIso: string;
  getDailyBookingRatio: (resourceId: string, iso: string) => number;
  handleTeamMemberBadgeClick: (
    resourceId: string,
    anchor: HTMLElement,
    highlighted: boolean,
  ) => void;
  weekTeamHeaderScrollRef: React.RefObject<HTMLDivElement | null>;
  onTeamHeaderScroll: () => void;
  scrollWeekTeamHeader: (direction: -1 | 1) => void;
  weekTeamHeaderScrollEdges: { canLeft: boolean; canRight: boolean };
  inlineGuestFormRef: React.RefObject<HTMLDivElement | null>;
  inlineGuestParticipantType: "guest" | "model";
  inlineGuestDraft: InlineGuestDraft;
  setInlineGuestDraft: React.Dispatch<React.SetStateAction<InlineGuestDraft>>;
  isViewingExisting: boolean;
  editingInlineGuestId: string | null;
  addInlineGuest: () => void;
  cancelInlineGuestForm: () => void;
};

export function useProfessionalFixedLocationCalendarRenderHelpers(
  args: UseProfessionalFixedLocationCalendarRenderHelpersArgs,
) {
  const {
    m,
    laneHeaderPx,
    teamNavArrowWidthPx = 28,
    viewMode,
    selectedResourceId,
    activeResourceId,
    splitScreen,
    splitScreenMembers,
    discardSplitScreen,
    teamHeaderScrollOverflowSx,
    teamHeaderGridTemplateColumns,
    teamHeaderScrollContentWidth,
    teamHeaderResources,
    teamHeaderNeedsScroll,
    activeDateIso,
    getDailyBookingRatio,
    handleTeamMemberBadgeClick,
    weekTeamHeaderScrollRef,
    onTeamHeaderScroll,
    scrollWeekTeamHeader,
    weekTeamHeaderScrollEdges,
    inlineGuestFormRef,
    inlineGuestParticipantType,
    inlineGuestDraft,
    setInlineGuestDraft,
    isViewingExisting,
    editingInlineGuestId,
    addInlineGuest,
    cancelInlineGuestForm,
  } = args;

  const renderTeamMemberScrollButton = (
    direction: "left" | "right",
    onClick: () => void,
    disabled: boolean,
    label: string,
  ) => (
    <IconButton
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      sx={{
        width: teamNavArrowWidthPx,
        minWidth: teamNavArrowWidthPx,
        maxWidth: teamNavArrowWidthPx,
        height: "100%",
        minHeight: laneHeaderPx,
        p: "0 !important",
        m: 0,
        borderRadius: 0,
        boxSizing: "border-box",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: alpha(m.navy, 0.58),
        bgcolor: "#fff",
        flexShrink: 0,
        borderRight:
          direction === "left"
            ? `1px solid ${alpha(m.navy, 0.08)}`
            : "none",
        borderLeft:
          direction === "right"
            ? `1px solid ${alpha(m.navy, 0.08)}`
            : "none",
        "&.Mui-disabled": {
          opacity: 1,
          color: alpha(m.navy, 0.28),
        },
        "& .MuiSvgIcon-root": {
          fontSize: 22,
          display: "block",
        },
      }}
    >
      {direction === "left" ? (
        <ChevronLeftRoundedIcon />
      ) : (
        <ChevronRightRoundedIcon />
      )}
    </IconButton>
  );

  const renderTeamMemberNavScrollArea = (
    scrollRef: React.RefObject<HTMLDivElement | null>,
    onScroll: () => void,
  ) => {
    const focusedId = selectedResourceId || activeResourceId;
    const isDayColumnHeader = viewMode === "day";
    const isHighlighted = (resourceId: string) => {
      if (splitScreen) {
        return (
          resourceId === splitScreen.primaryId ||
          resourceId === splitScreen.partnerId
        );
      }
      return String(resourceId) === String(focusedId);
    };

    return (
      <Box
        ref={scrollRef}
        onScroll={onScroll}
        sx={{
          ...teamHeaderScrollOverflowSx,
          flex: 1,
          minWidth: 0,
          height: "100%",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: teamHeaderGridTemplateColumns,
            width: teamHeaderScrollContentWidth,
            minWidth: "100%",
            height: "100%",
          }}
        >
          {teamHeaderResources.map((resource, colIdx) => {
            const highlighted = isHighlighted(resource.id);
            return (
            <Box
              key={resource.id}
              sx={{
                minWidth: 0,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: isDayColumnHeader ? "flex-start" : "center",
                px: isDayColumnHeader ? 0.75 : 1,
                boxSizing: "border-box",
                bgcolor: highlighted
                  ? alpha(m.teal, 0.035)
                  : "#fff",
                borderLeft:
                  colIdx > 0
                    ? `1px solid ${alpha(m.navy, 0.07)}`
                    : undefined,
              }}
            >
              <CalendarTeamMemberBadge
                name={resource.name}
                avatarText={resource.avatarText}
                photoSrc={resource.photoSrc}
                bookedPercent={
                  getDailyBookingRatio(resource.id, activeDateIso) * 100
                }
                selected={highlighted}
                fullWidth={isDayColumnHeader}
                onClick={(anchor) =>
                  handleTeamMemberBadgeClick(
                    resource.id,
                    anchor,
                    highlighted,
                  )
                }
              />
            </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  const renderTeamMemberNavBar = ({
    scrollRef,
    onScroll,
    onScrollLeft,
    onScrollRight,
    canScrollLeft,
    canScrollRight,
    spanFullGrid = false,
  }: {
    scrollRef: React.RefObject<HTMLDivElement | null>;
    onScroll: () => void;
    onScrollLeft: () => void;
    onScrollRight: () => void;
    canScrollLeft: boolean;
    canScrollRight: boolean;
    spanFullGrid?: boolean;
  }) => {
    const arrowReservePx = 0;
    const headerScrollbarPx = teamHeaderNeedsScroll
      ? TEAM_NAV_SCROLLBAR_PX
      : 0;

    return (
      <Box
        sx={{
          position: "relative",
          minHeight: laneHeaderPx + headerScrollbarPx,
          height: laneHeaderPx + headerScrollbarPx,
          bgcolor: "#fff",
          borderBottom: `1px solid ${alpha(m.navy, 0.07)}`,
          width: "100%",
          minWidth: 0,
          ...(spanFullGrid ? { gridColumn: "1 / -1" } : null),
        }}
      >
        <Box sx={{ px: `${arrowReservePx}px`, height: "100%" }}>
          {renderTeamMemberNavScrollArea(scrollRef, onScroll)}
        </Box>
      </Box>
    );
  };

  const renderTeamMemberHeader = () =>
    renderTeamMemberNavBar({
      scrollRef: weekTeamHeaderScrollRef,
      onScroll: onTeamHeaderScroll,
      onScrollLeft: () => scrollWeekTeamHeader(-1),
      onScrollRight: () => scrollWeekTeamHeader(1),
      canScrollLeft: weekTeamHeaderScrollEdges.canLeft,
      canScrollRight: weekTeamHeaderScrollEdges.canRight,
    });

  const renderSplitScreenBanner = () => {
    if (!splitScreenMembers) return null;

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          px: 1.25,
          py: 0.65,
          bgcolor: alpha(m.teal, 0.06),
          borderBottom: `1px solid ${alpha(m.teal, 0.14)}`,
        }}
      >
        <BodyText
          sx={{
            fontWeight: 700,
            fontSize: 11.5,
            color: alpha(m.navy, 0.72),
          }}
        >
          Split view: {splitScreenMembers.primary.name} &{" "}
          {splitScreenMembers.partner.name}
        </BodyText>
        <ButtonBase
          onClick={discardSplitScreen}
          aria-label="Discard split screen"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.45,
            px: 0.85,
            py: 0.35,
            borderRadius: "999px",
            border: `1px solid ${alpha(m.navy, 0.12)}`,
            bgcolor: "#fff",
            "&:hover": { bgcolor: alpha(m.navy, 0.03) },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 14, color: alpha(m.navy, 0.62) }} />
          <BodyText
            sx={{
              fontWeight: 700,
              fontSize: 11,
              color: alpha(m.navy, 0.72),
            }}
          >
            Discard split screen
          </BodyText>
        </ButtonBase>
      </Box>
    );
  };

  const renderInlineGuestFields = createRenderInlineGuestFields({
    m,
    inlineGuestFormRef,
    inlineGuestParticipantType,
    inlineGuestDraft,
    setInlineGuestDraft,
    isViewingExisting,
    editingInlineGuestId,
    addInlineGuest,
    cancelInlineGuestForm,
  });

  return {
    renderInlineGuestFields,
    renderSplitScreenBanner,
    renderTeamMemberHeader,
    renderTeamMemberNavBar,
    renderTeamMemberNavScrollArea,
    renderTeamMemberScrollButton,
  };
}

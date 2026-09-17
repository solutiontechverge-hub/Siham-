import * as React from "react";
import type { CalendarResource } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import { getTeamMemberBookings } from "../teamMemberBookings";
import type { UseProfessionalFixedLocationCalendarTeamArgs } from "./useProfessionalFixedLocationCalendar.team";

type TeamLayoutSlice = {
  activeResource: CalendarResource | undefined;
  filteredResources: readonly CalendarResource[];
  selectTeamMember: (resourceId: string) => void;
  setSplitScreen: React.Dispatch<
    React.SetStateAction<{
      primaryId: string;
      partnerId: string;
    } | null>
  >;
  splitScreen: {
    primaryId: string;
    partnerId: string;
  } | null;
};

/** Team menu + split-screen handlers (ponytail: subdomain of team). */
export function useProfessionalFixedLocationCalendarTeamMenu(
  args: UseProfessionalFixedLocationCalendarTeamArgs & TeamLayoutSlice,
) {
  const {
    resources,
    events,
    visibleDates,
    setViewMode,
    filteredResources,
    activeResource,
    selectTeamMember,
    setSplitScreen,
    splitScreen,
  } = args;

  const [teamActionAnchor, setTeamActionAnchor] =
    React.useState<HTMLElement | null>(null);
  const [teamMenuResourceId, setTeamMenuResourceId] = React.useState("");

  const closeTeamMenu = React.useCallback(() => {
    setTeamActionAnchor(null);
    setTeamMenuResourceId("");
  }, []);

  const discardSplitScreen = React.useCallback(() => {
    setSplitScreen(null);
  }, []);

  const openTeamMenu = React.useCallback(
    (resourceId: string, anchor: HTMLElement) => {
      setTeamMenuResourceId(resourceId);
      setTeamActionAnchor(anchor);
    },
    [],
  );

  const handleTeamMemberBadgeClick = React.useCallback(
    (resourceId: string, anchor: HTMLElement, isAlreadySelected: boolean) => {
      if (!isAlreadySelected) {
        setSplitScreen((current) => {
          if (!current) return null;
          const normalizedId = String(resourceId);
          if (
            current.primaryId === normalizedId ||
            current.partnerId === normalizedId
          ) {
            return current;
          }
          return null;
        });
        selectTeamMember(resourceId);
        closeTeamMenu();
        return;
      }

      openTeamMenu(resourceId, anchor);
    },
    [closeTeamMenu, openTeamMenu, selectTeamMember],
  );

  const teamMenuResource = React.useMemo(
    () =>
      resources.find((resource) => resource.id === teamMenuResourceId) ??
      activeResource,
    [activeResource, resources, teamMenuResourceId],
  );

  const teamMenuBookings = React.useMemo(() => {
    if (!teamMenuResource) return [];
    return getTeamMemberBookings(events, teamMenuResource.id, visibleDates);
  }, [events, teamMenuResource, visibleDates]);

  const splitScreenCandidates = React.useMemo(() => {
    if (!teamMenuResource) return [];
    return filteredResources
      .filter((resource) => resource.id !== teamMenuResource.id)
      .map((resource) => ({
        id: resource.id,
        name: resource.name,
        avatarText: resource.avatarText,
        photoSrc: resource.photoSrc,
      }));
  }, [filteredResources, teamMenuResource]);

  const openSplitScreenWith = React.useCallback(
    (partnerId: string) => {
      if (!teamMenuResourceId) return;
      setSplitScreen({
        primaryId: teamMenuResourceId,
        partnerId,
      });
      selectTeamMember(teamMenuResourceId);
      closeTeamMenu();
    },
    [closeTeamMenu, selectTeamMember, teamMenuResourceId],
  );

  const openSplitScreenFromBooking = React.useCallback(
    (primaryId: string, partnerId: string) => {
      const primary = String(primaryId ?? "").trim();
      const partner = String(partnerId ?? "").trim();
      if (!primary || !partner || primary === partner) return;
      setViewMode("day");
      setSplitScreen({
        primaryId: primary,
        partnerId: partner,
      });
      selectTeamMember(primary);
    },
    [selectTeamMember, setViewMode],
  );

  const splitScreenMembers = React.useMemo(() => {
    if (!splitScreen) return null;
    const primary = filteredResources.find(
      (resource) => resource.id === splitScreen.primaryId,
    );
    const partner = filteredResources.find(
      (resource) => resource.id === splitScreen.partnerId,
    );
    if (!primary || !partner) return null;
    return { primary, partner };
  }, [filteredResources, splitScreen]);

  return {
    closeTeamMenu,
    discardSplitScreen,
    handleTeamMemberBadgeClick,
    openSplitScreenFromBooking,
    openSplitScreenWith,
    openTeamMenu,
    setTeamActionAnchor,
    setTeamMenuResourceId,
    splitScreenCandidates,
    splitScreenMembers,
    teamActionAnchor,
    teamMenuBookings,
    teamMenuResource,
    teamMenuResourceId,
  };
}

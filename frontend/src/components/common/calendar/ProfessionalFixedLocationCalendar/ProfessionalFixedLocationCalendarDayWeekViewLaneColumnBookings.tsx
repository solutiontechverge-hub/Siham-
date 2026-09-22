"use client";

import CalendarBookingCard from "../CalendarBookingCard";

import CalendarBookingTicketStack from "../CalendarBookingTicketStack";

import { getWeekOverviewMainServiceSpans } from "../calendarBookingCardServices";

import {
  hideConnectedChainStatusBadge,
  resolveConnectedChainBlockStatus,
} from "../connectedChainBadge";

import {
  clusterSameStartTimeEvents,
  getClusterTimeBounds,
} from "../calendar-overlap.utils";

import { flashBookingChainThen } from "../calendarChainSelectionFlash";

import {
  extractBookingId,
  minutesSinceMidnight,
} from "../calendar.utils";

import { isTeamSharedBooking } from "../teamMemberBookings";

import {
  useProfessionalFixedLocationCalendar,
} from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarDayWeekViewLaneColumnBookingsBag =
  Pick<
    Vm,
    | "businessResponseWindowInput"
    | "data"
    | "grid"
    | "handleClientNameClick"
    | "openBookingMessages"
    | "openExistingBooking"
    | "openSplitScreenFromBooking"
    | "resolveEventColors"
    | "resourceNameById"
    | "responseTimeConfigured"
    | "rowPx"
    | "showSnackbar"
    | "startMin"
    | "viewMode"
  >;

type LaneEvent = Vm["eventsInRange"][number];

export type ProfessionalFixedLocationCalendarDayWeekViewLaneColumnBookingsProps =
  {
    bag: ProfessionalFixedLocationCalendarDayWeekViewLaneColumnBookingsBag;
    laneEvents: readonly LaneEvent[];
    weekDayCrowded: boolean;
    colIdx: number;
    laneColumnCount: number;
    /** Column owner id — staff chips on day cards follow this lane. */
    laneResourceId: string;
  };

function sharedLaneConnectForColumn(
  colIdx: number,
  laneColumnCount: number,
): false | "start" | "end" | "both" {
  if (laneColumnCount <= 1) return false;
  if (colIdx <= 0) return "end";
  if (colIdx >= laneColumnCount - 1) return "start";
  return "both";
}

/** Week span cards + day clustered booking cards / ticket stacks */
export default function ProfessionalFixedLocationCalendarDayWeekViewLaneColumnBookings({
  bag,
  laneEvents,
  weekDayCrowded,
  colIdx,
  laneColumnCount: laneColumnsLength,
  laneResourceId,
}: ProfessionalFixedLocationCalendarDayWeekViewLaneColumnBookingsProps) {
  const {
    businessResponseWindowInput,
    data,
    grid,
    handleClientNameClick,
    openBookingMessages,
    openExistingBooking,
    openSplitScreenFromBooking,
    resolveEventColors,
    resourceNameById,
    responseTimeConfigured,
    rowPx,
    showSnackbar,
    startMin,
    viewMode,
  } = bag;

  const openBooking = (ev: LaneEvent) => {
    flashBookingChainThen(ev, () => openExistingBooking(ev));
  };

  if (viewMode === "week") {
    return (
      <>
        {laneEvents.flatMap((ev) => {
          const spans = getWeekOverviewMainServiceSpans(ev);
          const useDenseCard = weekDayCrowded;
          const cardInset = useDenseCard ? 2 : 3;
          return spans.map((span, spanIndex) => {
            const spanStart = minutesSinceMidnight(span.start);
            const spanEnd = minutesSinceMidnight(span.end);
            const top =
              ((spanStart - startMin) / grid.stepMinutes) * rowPx + 0.15;
            const height = Math.max(
              4,
              ((spanEnd - spanStart) / grid.stepMinutes) * rowPx - 0.3,
            );
            const blockStatus = resolveConnectedChainBlockStatus(ev, {
              serviceId: span.serviceId,
              guestId: span.guestId,
            });
            const weekEvent = {
              ...ev,
              start: span.start,
              end: span.end,
              title: span.name,
              status: blockStatus,
            };
            return (
              <CalendarBookingCard
                key={span.key}
                event={weekEvent}
                top={top}
                height={height}
                left={cardInset}
                right={cardInset}
                dense={useDenseCard}
                weekSimple
                hideStatusBadge={hideConnectedChainStatusBadge({
                  isAnchor: spanIndex === 0,
                  blockStatus,
                  chainStatus: ev.status,
                })}
                teamMemberNameById={resourceNameById}
                teamResources={data.resources}
                serviceColor={resolveEventColors(ev).serviceColor}
                statusColor={resolveEventColors(ev).statusColor}
                responseTimeConfigured={responseTimeConfigured}
                responseTime={businessResponseWindowInput}
                onOpen={() => openBooking(ev)}
                onOpenCalendar={() =>
                  showSnackbar({
                    severity: "info",
                    message: `Calendar for booking ${extractBookingId(ev.id)}`,
                  })
                }
                onOpenNotes={() => openBooking(ev)}
                onOpenClient={(anchorEl) =>
                  handleClientNameClick(ev, anchorEl, "overview")
                }
                onOpenMessages={() => openBookingMessages(ev)}
                onOpenSplitWithTeamMember={(partnerId) =>
                  openSplitScreenFromBooking(String(ev.resourceId), partnerId)
                }
              />
            );
          });
        })}
      </>
    );
  }

  return (
    <>
      {clusterSameStartTimeEvents(laneEvents).map((cluster) => {
        const { startMin: clusterStart, endMin: clusterEnd } =
          getClusterTimeBounds(cluster);
        const top =
          ((clusterStart - startMin) / grid.stepMinutes) * rowPx + 0.15;
        const durationHeight =
          ((clusterEnd - clusterStart) / grid.stepMinutes) * rowPx - 0.3;
        const height = Math.max(78, durationHeight);
        const resolveServiceColor = (ev: (typeof cluster)[number]) =>
          resolveEventColors(ev).serviceColor;
        const resolveStatusColor = (ev: (typeof cluster)[number]) =>
          resolveEventColors(ev).statusColor;
        const eventHandlers = {
          onOpen: openBooking,
          onOpenCalendar: (ev: (typeof cluster)[number]) =>
            showSnackbar({
              severity: "info",
              message: `Calendar for booking ${extractBookingId(ev.id)}`,
            }),
          onOpenNotes: openBooking,
          onOpenClient: (
            ev: (typeof cluster)[number],
            anchorEl: HTMLElement,
          ) => handleClientNameClick(ev, anchorEl, "overview"),
          onOpenMessages: openBookingMessages,
          onOpenSplitWithTeamMember: (
            ev: (typeof cluster)[number],
            partnerId: string,
          ) =>
            openSplitScreenFromBooking(String(ev.resourceId), partnerId),
        };

        const actionRailSide =
          laneColumnsLength > 1 && colIdx === 0
            ? ("start" as const)
            : ("end" as const);

        const sharedLaneConnect =
          viewMode === "day" && isTeamSharedBooking(cluster[0])
            ? sharedLaneConnectForColumn(colIdx, laneColumnsLength)
            : false;

        if (cluster.length > 1) {
          return (
            <CalendarBookingTicketStack
              key={cluster.map((event) => event.id).join("-")}
              events={cluster}
              top={top}
              rowPx={rowPx}
              slotHeight={height}
              laneResourceId={laneResourceId}
              teamMemberNameById={resourceNameById}
              teamResources={data.resources}
              actionRailSide={actionRailSide}
              getServiceColor={resolveServiceColor}
              getStatusColor={resolveStatusColor}
              responseTimeConfigured={responseTimeConfigured}
              responseTime={businessResponseWindowInput}
              {...eventHandlers}
            />
          );
        }

        const ev = cluster[0];
        return (
          <CalendarBookingCard
            key={ev.id}
            event={ev}
            top={top}
            height={height}
            left={6}
            right={6}
            laneResourceId={laneResourceId}
            teamMemberNameById={resourceNameById}
            teamResources={data.resources}
            actionRailSide={actionRailSide}
            sharedLaneConnect={sharedLaneConnect}
            serviceColor={resolveServiceColor(ev)}
            statusColor={resolveStatusColor(ev)}
            responseTimeConfigured={responseTimeConfigured}
            responseTime={businessResponseWindowInput}
            onOpen={() => eventHandlers.onOpen(ev)}
            onOpenCalendar={() => eventHandlers.onOpenCalendar(ev)}
            onOpenNotes={() => eventHandlers.onOpenNotes(ev)}
            onOpenClient={(anchorEl) =>
              eventHandlers.onOpenClient(ev, anchorEl)
            }
            onOpenMessages={() => eventHandlers.onOpenMessages(ev)}
            onOpenSplitWithTeamMember={(partnerId) =>
              eventHandlers.onOpenSplitWithTeamMember(ev, partnerId)
            }
          />
        );
      })}
    </>
  );
}

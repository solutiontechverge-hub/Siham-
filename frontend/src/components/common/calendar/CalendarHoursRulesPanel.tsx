"use client";

import * as React from "react";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  Box,
  Checkbox,
  Paper,
  Stack,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  mollureBodySx,
  mollureBodyMutedSx,
  mollureLabelSx,
  mollurePageTitleSx,
} from "../../../theme/mollureHierarchy";
import { BodyText, SubHeading } from "../../ui/typography";
import type { CalendarBookingLocation } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type {
  BookingRules,
  ServiceOrderSettings,
} from "./calendar-settings.types";
import type { CalendarDesignDraft } from "./CalendarDesignModal";
import { appearanceModeLabel } from "../../../lib/calendarDesign.utils";
import type { TemplateCategoryRow } from "../../../lib/businessTemplateCatalog";
import {
  CalendarDurationInput,
  CalendarRulesLocationCard,
} from "./CalendarDurationInput";
import { CALENDAR_HOURS_RULES_COPY } from "./calendarHoursRules.data";
import type { PublicBusinessHoursEntry } from "./CalendarPublicBusinessHoursModal";
import CalendarServiceOrderCard from "./CalendarServiceOrderCard";
import {
  isCategoryVisibleInServiceOrder,
  isServiceVisibleInServiceOrder,
  toggleHiddenCategory,
  toggleHiddenService,
} from "./serviceOrder.utils";
import {
  reorderList,
  resolveCategoryMeta,
  useCalendarHoursRulesPanel,
} from "./useCalendarHoursRulesPanel";
import {
  AppearanceActionButton,
  EditSectionButton,
  LocationHoursBlock,
  SectionSaveButton,
  SettingsSection,
} from "./CalendarHoursRulesPanel.parts";

type CalendarHoursRulesPanelProps = {
  availableLocations: readonly CalendarBookingLocation[];
  bookingRules: BookingRules;
  publicBusinessHours?: readonly PublicBusinessHoursEntry[];
  serviceOrder: ServiceOrderSettings;
  appliedDesign: CalendarDesignDraft;
  categoryOptions?: readonly { key: string; label: string }[];
  templateCategoryRows?: readonly TemplateCategoryRow[];
  isSaving?: boolean;
  onBookingRulesChange: (next: BookingRules) => void;
  onServiceOrderChange: (next: ServiceOrderSettings) => void;
  onOpenDesign: () => void;
  onOpenPublicHours: (location?: CalendarBookingLocation) => void;
  /** @deprecated Service Order stays on-page; kept optional for call-site compatibility. */
  onOpenServiceOrder?: () => void;
  onSaveBookingRules: (next?: BookingRules) => Promise<void>;
  onSaveServiceOrder: () => Promise<void>;
};

export default function CalendarHoursRulesPanel({
  availableLocations,
  bookingRules,
  publicBusinessHours = [],
  serviceOrder,
  appliedDesign,
  categoryOptions = [],
  templateCategoryRows = [],
  isSaving = false,
  onBookingRulesChange,
  onServiceOrderChange,
  onOpenDesign,
  onOpenPublicHours,
  onSaveBookingRules,
  onSaveServiceOrder,
}: CalendarHoursRulesPanelProps) {
  const m = useTheme().palette.mollure;
  const copy = CALENDAR_HOURS_RULES_COPY;
  const {
    showFl,
    showDl,
    appearanceExpanded,
    setAppearanceExpanded,
    bookingRulesEditing,
    serviceOrderEditing,
    draggingCategory,
    setDraggingCategory,
    draggingService,
    setDraggingService,
    setSelectedCategory,
    flEntries,
    dlEntries,
    categories,
    activeCategory,
    servicesForActive,
    appearanceTemplateRows,
    appearanceConfiguredCount,
    appearanceItems,
    appearanceConfigured,
    inactiveScope,
    inactiveColorCount,
    handleBookingRulesEdit,
    handleServiceOrderEdit,
    handleSaveBookingRules,
    handleSaveServiceOrder,
  } = useCalendarHoursRulesPanel({
    availableLocations,
    bookingRules,
    publicBusinessHours,
    serviceOrder,
    appliedDesign,
    categoryOptions,
    templateCategoryRows,
    onBookingRulesChange,
    onSaveBookingRules,
    onSaveServiceOrder,
  });

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "2px",
        border: 0,
        boxShadow: "none",
        bgcolor: "#fff",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 1.35,
          bgcolor: alpha(m.navy, 0.04),
          borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
        }}
      >
        <SubHeading sx={mollurePageTitleSx(m.navy)}>
          {copy.settingsTitle}
        </SubHeading>
      </Box>

      <Stack spacing={1.75} sx={{ px: 2.5, py: 2.25 }}>
        <SettingsSection title={copy.publicHours}>
          <Stack spacing={1.25}>
            {showFl ? (
              <LocationHoursBlock
                title={copy.fixedLocation}
                location="FL"
                entries={flEntries}
                isSaving={isSaving}
                onEdit={() => onOpenPublicHours("FL")}
              />
            ) : null}
            {showDl ? (
              <LocationHoursBlock
                title={copy.desiredLocation}
                location="DL"
                entries={dlEntries}
                isSaving={isSaving}
                onEdit={() => onOpenPublicHours("DL")}
              />
            ) : null}
          </Stack>
        </SettingsSection>

        <SettingsSection
          title={copy.bookingRules}
          action={
            bookingRulesEditing ? (
              <SectionSaveButton
                disabled={isSaving}
                onClick={() => void handleSaveBookingRules()}
              />
            ) : (
              <EditSectionButton
                active={false}
                disabled={isSaving}
                onClick={handleBookingRulesEdit}
              />
            )
          }
        >
          <Stack spacing={1.25}>
            {showFl ? (
              <CalendarRulesLocationCard title={copy.fixedLocation}>
                <CalendarDurationInput
                  label={copy.intervalBetweenBookings}
                  hours={bookingRules.flIntervalHours}
                  minutes={bookingRules.flIntervalMinutes}
                  onHoursChange={(value) =>
                    onBookingRulesChange({
                      ...bookingRules,
                      flIntervalHours: value,
                    })
                  }
                  onMinutesChange={(value) =>
                    onBookingRulesChange({
                      ...bookingRules,
                      flIntervalMinutes: value,
                    })
                  }
                  helperText={copy.flIntervalHelper}
                  disabled={!bookingRulesEditing || isSaving}
                  hoursUnit={copy.hoursUnit}
                  minutesUnit={copy.minutesUnit}
                />
              </CalendarRulesLocationCard>
            ) : null}
            {showDl ? (
              <CalendarRulesLocationCard title={copy.desiredLocation}>
                <Stack spacing={1.75}>
                  <CalendarDurationInput
                    label={copy.intervalBetweenBookings}
                    hours={bookingRules.dlIntervalHours}
                    minutes={bookingRules.dlIntervalMinutes}
                    onHoursChange={(value) =>
                      onBookingRulesChange({
                        ...bookingRules,
                        dlIntervalHours: value,
                      })
                    }
                    onMinutesChange={(value) =>
                      onBookingRulesChange({
                        ...bookingRules,
                        dlIntervalMinutes: value,
                      })
                    }
                    helperText={copy.dlIntervalHelper}
                    disabled={!bookingRulesEditing || isSaving}
                    hoursUnit={copy.hoursUnit}
                    minutesUnit={copy.minutesUnit}
                  />
                  <CalendarDurationInput
                    label={copy.minimumTimeslot}
                    hours={bookingRules.dlMinTimeslotHours}
                    minutes={bookingRules.dlMinTimeslotMinutes}
                    onHoursChange={(value) =>
                      onBookingRulesChange({
                        ...bookingRules,
                        dlMinTimeslotHours: value,
                      })
                    }
                    onMinutesChange={(value) =>
                      onBookingRulesChange({
                        ...bookingRules,
                        dlMinTimeslotMinutes: value,
                      })
                    }
                    helperText={copy.dlMinTimeslotHelper}
                    disabled={!bookingRulesEditing || isSaving}
                    hoursUnit={copy.hoursUnit}
                    minutesUnit={copy.minutesUnit}
                  />
                </Stack>
              </CalendarRulesLocationCard>
            ) : null}
          </Stack>
        </SettingsSection>

        <SettingsSection
          title={copy.serviceOrderRules}
          action={
            serviceOrderEditing ? (
              <SectionSaveButton
                disabled={isSaving}
                onClick={() => void handleSaveServiceOrder()}
              />
            ) : (
              <EditSectionButton
                active={false}
                disabled={isSaving}
                onClick={handleServiceOrderEdit}
              />
            )
          }
        >
          {categories.length ? (
            <Stack spacing={2}>
              <Box>
                <BodyText
                  sx={{
                    ...mollureBodySx(m.navy),
                    mb: 0.5,
                  }}
                >
                  {copy.categories}
                </BodyText>
                <BodyText
                  sx={{
                    fontSize: 11.5,
                    color: alpha(m.navy, 0.45),
                    mb: 1.1,
                    lineHeight: 1.4,
                  }}
                >
                  {serviceOrderEditing
                    ? copy.categoriesEditingHint
                    : copy.categoriesViewHint}
                </BodyText>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    overflowX: "auto",
                    pb: 0.5,
                    "&::-webkit-scrollbar": { height: 6 },
                    "&::-webkit-scrollbar-thumb": {
                      borderRadius: 999,
                      bgcolor: alpha(m.navy, 0.12),
                    },
                  }}
                >
                  {categories.map((category, index) => {
                    const meta = resolveCategoryMeta(category);
                    const visible = isCategoryVisibleInServiceOrder(
                      serviceOrder,
                      category,
                    );
                    return (
                      <CalendarServiceOrderCard
                        key={category}
                        label={meta.label}
                        iconId={meta.iconId}
                        order={index + 1}
                        checked={visible}
                        showCheckbox={serviceOrderEditing}
                        showDragHandle={serviceOrderEditing}
                        active={activeCategory === category}
                        draggable={serviceOrderEditing}
                        isDragging={draggingCategory === category}
                        onCheckedChange={(nextChecked) => {
                          if (!serviceOrderEditing) return;
                          if (visible === nextChecked) return;
                          onServiceOrderChange(
                            toggleHiddenCategory(serviceOrder, category),
                          );
                        }}
                        onClick={() => setSelectedCategory(category)}
                        onDragStart={() => setDraggingCategory(category)}
                        onDragEnd={() => setDraggingCategory(null)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => {
                          if (
                            !serviceOrderEditing ||
                            !draggingCategory ||
                            draggingCategory === category
                          )
                            return;
                          const from = categories.indexOf(draggingCategory);
                          const to = categories.indexOf(category);
                          if (from < 0 || to < 0) return;
                          onServiceOrderChange({
                            ...serviceOrder,
                            categories: reorderList(categories, from, to),
                          });
                          setDraggingCategory(null);
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>

              <Box>
                <BodyText
                  sx={{
                    ...mollureBodySx(m.navy),
                    mb: 0.5,
                  }}
                >
                  {copy.services}
                </BodyText>
                <BodyText
                  sx={{
                    fontSize: 11.5,
                    color: alpha(m.navy, 0.45),
                    mb: 1.1,
                    lineHeight: 1.4,
                  }}
                >
                  {serviceOrderEditing
                    ? copy.servicesEditingHint
                    : activeCategory
                      ? `Services in ${resolveCategoryMeta(activeCategory).label}`
                      : copy.selectCategory}
                </BodyText>
                <Stack spacing={0.75}>
                  {servicesForActive.length ? (
                    servicesForActive.map((service, index) => {
                      const visible =
                        Boolean(activeCategory) &&
                        isServiceVisibleInServiceOrder(
                          serviceOrder,
                          activeCategory as string,
                          service,
                        );
                      return (
                        <Box
                          key={`${activeCategory}-${service}`}
                          draggable={serviceOrderEditing}
                          onDragStart={() => setDraggingService(service)}
                          onDragEnd={() => setDraggingService(null)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => {
                            if (
                              !serviceOrderEditing ||
                              !activeCategory ||
                              !draggingService ||
                              draggingService === service
                            ) {
                              return;
                            }
                            const list =
                              serviceOrder.servicesByCategory?.[
                                activeCategory
                              ] ?? servicesForActive;
                            const from = list.indexOf(draggingService);
                            const to = list.indexOf(service);
                            if (from < 0 || to < 0) return;
                            onServiceOrderChange({
                              ...serviceOrder,
                              servicesByCategory: {
                                ...serviceOrder.servicesByCategory,
                                [activeCategory]: reorderList(list, from, to),
                              },
                            });
                            setDraggingService(null);
                          }}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            borderRadius: "6px",
                            border: `1px ${visible ? "solid" : "dashed"} ${alpha(m.navy, visible ? 0.08 : 0.14)}`,
                            bgcolor: visible
                              ? alpha(m.navy, 0.015)
                              : alpha(m.navy, 0.03),
                            px: 1.5,
                            py: 1,
                            cursor: serviceOrderEditing ? "grab" : "default",
                            opacity:
                              draggingService === service
                                ? 0.55
                                : visible
                                  ? 1
                                  : 0.55,
                            userSelect: "none",
                          }}
                        >
                          {serviceOrderEditing ? (
                            <DragIndicatorRoundedIcon
                              aria-hidden
                              sx={{
                                fontSize: 16,
                                color: alpha(m.navy, 0.32),
                                flexShrink: 0,
                              }}
                            />
                          ) : null}
                          <Box
                            sx={{
                              width: 18,
                              height: 18,
                              borderRadius: "999px",
                              bgcolor: visible ? m.teal : alpha(m.navy, 0.28),
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                fontSize: 10,
                                fontWeight: 800,
                                lineHeight: 1,
                                transform: "translateY(0.5px)",
                              }}
                            >
                              {index + 1}
                            </Box>
                          </Box>
                          <BodyText
                            sx={{
                              flex: 1,
                              fontSize: 13,
                              fontWeight: 700,
                              color: alpha(m.navy, visible ? 0.72 : 0.45),
                            }}
                          >
                            {service}
                          </BodyText>
                          {serviceOrderEditing ? (
                            <Checkbox
                              size="small"
                              checked={visible}
                              disabled={!activeCategory}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => {
                                event.stopPropagation();
                                if (!activeCategory) return;
                                if (visible === event.target.checked) return;
                                onServiceOrderChange(
                                  toggleHiddenService(
                                    serviceOrder,
                                    activeCategory,
                                    service,
                                  ),
                                );
                              }}
                              inputProps={{
                                "aria-label": visible
                                  ? `Hide ${service}`
                                  : `Show ${service}`,
                              }}
                              sx={{
                                p: 0.35,
                                color: alpha(m.navy, 0.35),
                                "&.Mui-checked": { color: m.teal },
                              }}
                            />
                          ) : null}
                        </Box>
                      );
                    })
                  ) : (
                    <Box
                      sx={{
                        borderRadius: "6px",
                        border: `1px dashed ${alpha(m.navy, 0.12)}`,
                        px: 1.5,
                        py: 1.25,
                      }}
                    >
                      <BodyText
                        sx={mollureBodyMutedSx(m.navy, { color: alpha(m.navy, 0.42) })}
                      >
                        {copy.noServicesInCategory}
                      </BodyText>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Stack>
          ) : (
            <Box
              sx={{
                borderRadius: "6px",
                border: `1px dashed ${alpha(m.navy, 0.14)}`,
                bgcolor: alpha(m.navy, 0.015),
                minHeight: 88,
                display: "grid",
                placeItems: "center",
                px: 2,
              }}
            >
              <BodyText
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: alpha(m.navy, 0.42),
                  textAlign: "center",
                }}
              >
                {copy.addServicesToDefineOrder}
              </BodyText>
            </Box>
          )}
        </SettingsSection>

        <SettingsSection
          title={copy.calendarAppearance}
          action={
            <AppearanceActionButton
              configured={appearanceConfigured}
              disabled={isSaving}
              onClick={onOpenDesign}
            />
          }
        >
          {appearanceConfigured || appearanceTemplateRows.length ? (
            <Box
              sx={{
                borderRadius: "8px",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                bgcolor: alpha(m.navy, 0.015),
                overflow: "hidden",
              }}
            >
              <Box
                component="button"
                type="button"
                onClick={() => setAppearanceExpanded((prev) => !prev)}
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.25,
                  px: 1.5,
                  py: 1.1,
                  border: 0,
                  bgcolor: "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <BodyText
                  sx={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.72),
                  }}
                >
                  {appearanceModeLabel(appliedDesign.scope)}
                  {appearanceConfiguredCount
                    ? ` · ${appearanceConfiguredCount} colour${appearanceConfiguredCount === 1 ? "" : "s"}`
                    : ""}
                </BodyText>
                <ExpandMoreRoundedIcon
                  sx={{
                    fontSize: 20,
                    color: alpha(m.navy, 0.45),
                    transform: appearanceExpanded ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s ease",
                  }}
                />
              </Box>
              {appearanceExpanded ? (
                <Stack spacing={0.75} sx={{ px: 1.5, pb: 1.25 }}>
                  {appearanceItems.map((item) =>
                    item.kind === "group" ? (
                      <BodyText
                        key={item.key}
                        sx={mollureLabelSx(m.navy, {
                          letterSpacing: "0.02em",
                          textTransform: "uppercase",
                          pt: 0.35,
                        })}
                      >
                        {item.label}
                      </BodyText>
                    ) : (
                      <Box
                        key={item.key}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "auto minmax(0, 1fr)",
                          alignItems: "center",
                          gap: 1.1,
                          pl: item.kind === "service" ? 1 : 0,
                        }}
                      >
                        <Box
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius: "4px",
                            bgcolor: item.color,
                            border: `1px solid ${alpha(m.navy, 0.14)}`,
                            opacity: item.configured ? 1 : 0.55,
                          }}
                        />
                        <BodyText
                          sx={mollureBodyMutedSx(m.navy, { color: alpha(m.navy, item.configured ? 0.68 : 0.45) })}
                        >
                          {item.configured
                            ? `${item.label} · ${item.color.toUpperCase()}`
                            : item.label}
                        </BodyText>
                      </Box>
                    ),
                  )}
                </Stack>
              ) : null}
              {inactiveColorCount > 0 ? (
                <Box sx={{ px: 1.5, pb: 1.1 }}>
                  <BodyText
                    sx={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: alpha(m.navy, 0.42),
                    }}
                  >
                    {appearanceModeLabel(inactiveScope)}: {inactiveColorCount}{" "}
                    colour
                    {inactiveColorCount === 1 ? "" : "s"} saved (inactive)
                  </BodyText>
                </Box>
              ) : null}
            </Box>
          ) : (
            <Box
              sx={{
                borderRadius: "6px",
                border: `1px dashed ${alpha(m.navy, 0.14)}`,
                bgcolor: alpha(m.navy, 0.015),
                minHeight: 120,
                display: "grid",
                placeItems: "center",
                px: 2,
              }}
            >
              <BodyText
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: alpha(m.navy, 0.42),
                  textAlign: "center",
                }}
              >
                {copy.customizeAppearanceEmpty}
              </BodyText>
            </Box>
          )}
        </SettingsSection>
      </Stack>
    </Paper>
  );
}

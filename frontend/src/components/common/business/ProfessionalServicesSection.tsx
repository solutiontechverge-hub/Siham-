"use client";

import * as React from "react";
import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Tooltip,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { mollureSectionTitleSx, mollureBodyMutedSx } from "../../../theme/mollureHierarchy";
import MollureFormField from "../MollureFormField";
import ServiceCategoryBar from "../ServiceCategoryBar";
import { Typography } from "../../ui/typography";
import {
  formatBusinessServicePriceLabel,
  type BusinessMainServiceUi,
} from "../../../data/businessServiceModal.data";
import type { ServiceCategoryTab } from "../../../data/businessServiceCategorySlider.data";
import {
  getServiceCardPriceParts,
  type ServiceDetailUiItem,
} from "./useProfessionalFixedLocationSetup";
import {
  addSoftIconButtonSx,
  SectionShell,
} from "./professionalFixedLocationSetupShell";

function ServiceCardPriceBlock({
  cardPrice,
  m,
}: {
  cardPrice: ReturnType<typeof getServiceCardPriceParts>;
  m: Theme["palette"]["mollure"];
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Stack alignItems="flex-end" spacing={0.15} sx={{ minWidth: 56 }}>
        {cardPrice.strikethrough ? (
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: alpha(m.navy, 0.42),
              textDecoration: "line-through",
              lineHeight: 1.15,
            }}
          >
            {cardPrice.strikethrough}
          </Typography>
        ) : null}
        <Typography
          sx={mollureSectionTitleSx(m.navy, { textAlign: "right", lineHeight: 1.2 })}
        >
          {cardPrice.primary}
        </Typography>
        {cardPrice.discountLabel ? (
          <Typography
            sx={{
              fontSize: 10.5,
              fontWeight: 800,
              color: m.teal,
              lineHeight: 1.15,
              textAlign: "right",
            }}
          >
            {cardPrice.discountLabel}
          </Typography>
        ) : null}
      </Stack>
      {cardPrice.discountTooltip ? (
        <Tooltip
          title={
            <Box
              component="span"
              sx={{ whiteSpace: "pre-line", display: "block" }}
            >
              {cardPrice.discountTooltip}
            </Box>
          }
          arrow
          placement="top"
        >
          <InfoOutlinedIcon
            sx={{ fontSize: 16, color: m.teal, cursor: "default" }}
            aria-label="Discount details"
          />
        </Tooltip>
      ) : null}
    </Stack>
  );
}

type ServiceModalSlice = {
  subservicesByParent: Map<string, ServiceDetailUiItem[]>;
  openViewSubservice: (it: ServiceDetailUiItem) => void;
  openAddSubservice: (categoryId: string, parentId: string) => void;
};

type GroupedServiceSection = {
  categoryId: string;
  title: string;
  explicitMains: BusinessMainServiceUi[];
  subs: ServiceDetailUiItem[];
};

type ProjectBizSlice = {
  projectEnabled: boolean;
  projectInstructions: string;
};

export type ProfessionalServicesSectionProps = {
  m: Theme["palette"]["mollure"];
  title: string;
  serviceCategoryTabs: ServiceCategoryTab[];
  activeServiceCategory: string;
  setActiveServiceCategory: (id: string) => void;
  groupedServiceSections: GroupedServiceSection[];
  activeCategoryExplicitMains: BusinessMainServiceUi[];
  activeCategoryFlatSubservices: ServiceDetailUiItem[];
  expandedServiceDetailIds: Record<string, boolean>;
  expandedMainServiceIds: Record<string, boolean>;
  toggleServiceDetailExpand: (id: string) => void;
  toggleMainServiceExpand: (id: string) => void;
  serviceModal: ServiceModalSlice;
  openAddService: () => void;
  openAddServiceForCategory: (categoryId: string) => void;
  openAddSubserviceForItem: (item: ServiceDetailUiItem) => void;
  handleEditSubservice: (it: ServiceDetailUiItem) => void;
  handleDeleteSubservice: (it: ServiceDetailUiItem) => void;
  handleEditMainService: (main: BusinessMainServiceUi) => void;
  handleDeleteMainService: (id: string) => void;
  isBusinessSetupSaving: boolean;
  servicesDetailsDisabled: boolean;
  showProjectSection: boolean;
  biz: ProjectBizSlice;
  setBizField: <K extends keyof ProjectBizSlice>(
    key: K,
    value: ProjectBizSlice[K],
  ) => void;
};

type ServiceDetailRowProps = {
  it: ServiceDetailUiItem;
  isChild?: boolean;
  m: Theme["palette"]["mollure"];
  expandedServiceDetailIds: Record<string, boolean>;
  serviceModal: ServiceModalSlice;
  openAddSubserviceForItem: (item: ServiceDetailUiItem) => void;
  handleEditSubservice: (it: ServiceDetailUiItem) => void;
  handleDeleteSubservice: (it: ServiceDetailUiItem) => void;
  toggleServiceDetailExpand: (id: string) => void;
  isBusinessSetupSaving: boolean;
  servicesDetailsDisabled: boolean;
};

function ServiceDetailRow({
  it,
  isChild = false,
  m,
  expandedServiceDetailIds,
  serviceModal,
  openAddSubserviceForItem,
  handleEditSubservice,
  handleDeleteSubservice,
  toggleServiceDetailExpand,
  isBusinessSetupSaving,
  servicesDetailsDisabled,
}: ServiceDetailRowProps) {
  const expanded = Boolean(expandedServiceDetailIds[it.id]);
  const cardPrice = getServiceCardPriceParts(it);
  const childServices = isChild
    ? []
    : (serviceModal.subservicesByParent.get(it.id) ?? []);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "12px",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        bgcolor: "#fff",
        px: 1.75,
        py: 1.35,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ flexWrap: { xs: "wrap", sm: "nowrap" } }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={mollureSectionTitleSx(m.navy, { lineHeight: 1.25 })}
          >
            {it.name?.trim() ? it.name : "Untitled service"}
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{ mt: 0.35, flexWrap: "wrap" }}
          >
            {it.durationLabel ? (
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: alpha(m.navy, 0.62),
                }}
              >
                {it.durationLabel}
              </Typography>
            ) : null}
            <Typography
              component="button"
              onClick={() => serviceModal.openViewSubservice(it)}
              sx={{
                border: "none",
                background: "none",
                cursor: "pointer",
                p: 0,
                m: 0,
                font: "inherit",
                fontSize: 12,
                fontWeight: 600,
                color: "primary.main",
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              View
            </Typography>
          </Stack>
        </Box>

        <Stack
          direction="row"
          alignItems="center"
          spacing={1.25}
          sx={{ ml: { xs: 0, sm: "auto" } }}
        >
          <ServiceCardPriceBlock cardPrice={cardPrice} m={m} />

          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{ flexShrink: 0 }}
          >
            {!isChild ? (
              <IconButton
                size="small"
                aria-label="Add subservice"
                onClick={() => openAddSubserviceForItem(it)}
                disabled={isBusinessSetupSaving || servicesDetailsDisabled}
                sx={addSoftIconButtonSx(m, 32)}
              >
                <AddRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            ) : null}
            <IconButton
              size="small"
              aria-label="Edit service"
              onClick={() => handleEditSubservice(it)}
              disabled={isBusinessSetupSaving}
              sx={{ width: 32, height: 32, color: alpha(m.navy, 0.45) }}
            >
              <EditRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Delete service"
              onClick={() => handleDeleteSubservice(it)}
              disabled={isBusinessSetupSaving}
              sx={{ width: 32, height: 32, color: alpha(m.navy, 0.45) }}
            >
              <DeleteOutlineRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
            {!isChild && childServices.length > 0 ? (
              <IconButton
                size="small"
                aria-label={
                  expanded ? "Collapse sub services" : "Expand sub services"
                }
                onClick={() => toggleServiceDetailExpand(it.id)}
                sx={{
                  width: 32,
                  height: 32,
                  color: alpha(m.navy, 0.45),
                  transform: expanded ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s ease",
                }}
              >
                <KeyboardArrowDownRoundedIcon sx={{ fontSize: 22 }} />
              </IconButton>
            ) : null}
          </Stack>
        </Stack>
      </Stack>

      {expanded && childServices.length > 0 ? (
        <Stack spacing={1} sx={{ mt: 1.25, pl: { xs: 1, sm: 2 } }}>
          {childServices.map((child) => (
            <ServiceDetailRow
              key={child.id}
              it={child}
              isChild
              m={m}
              expandedServiceDetailIds={expandedServiceDetailIds}
              serviceModal={serviceModal}
              openAddSubserviceForItem={openAddSubserviceForItem}
              handleEditSubservice={handleEditSubservice}
              handleDeleteSubservice={handleDeleteSubservice}
              toggleServiceDetailExpand={toggleServiceDetailExpand}
              isBusinessSetupSaving={isBusinessSetupSaving}
              servicesDetailsDisabled={servicesDetailsDisabled}
            />
          ))}
        </Stack>
      ) : null}
    </Paper>
  );
}

type MainServiceRowProps = {
  main: BusinessMainServiceUi;
  m: Theme["palette"]["mollure"];
  expandedMainServiceIds: Record<string, boolean>;
  serviceModal: ServiceModalSlice;
  handleEditMainService: (main: BusinessMainServiceUi) => void;
  handleDeleteMainService: (id: string) => void;
  toggleMainServiceExpand: (id: string) => void;
  isBusinessSetupSaving: boolean;
  servicesDetailsDisabled: boolean;
  serviceDetailRowProps: Omit<ServiceDetailRowProps, "it" | "isChild">;
};

function MainServiceRow({
  main,
  m,
  expandedMainServiceIds,
  serviceModal,
  handleEditMainService,
  handleDeleteMainService,
  toggleMainServiceExpand,
  isBusinessSetupSaving,
  servicesDetailsDisabled,
  serviceDetailRowProps,
}: MainServiceRowProps) {
  const expanded = Boolean(expandedMainServiceIds[main.id]);
  const childSubs = serviceModal.subservicesByParent.get(main.id) ?? [];
  const cardPrice = getServiceCardPriceParts({
    id: main.id,
    parentServiceId: "",
    categoryId: main.categoryId,
    serviceId: "",
    name: main.name,
    discountInfo: "",
    durationFrom: "",
    durationTo: "",
    priceLabel: formatBusinessServicePriceLabel(
      main.priceType,
      main.priceAmount,
    ),
    priceType: main.priceType,
    priceAmount: main.priceAmount,
    discountType: main.discountType,
    discountAmount: main.discountAmount,
    discountStartDate: main.discountStartDate,
    discountEndDate: main.discountEndDate,
    discountDescription: main.discountDescription,
  });

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "12px",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        bgcolor: "#fff",
        px: 1.75,
        py: 1.35,
      }}
    >
      <Stack spacing={1.25}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{ flexWrap: { xs: "wrap", sm: "nowrap" } }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={mollureSectionTitleSx(m.navy, { lineHeight: 1.25 })}
            >
              {main.name?.trim() ? main.name : "Untitled service"}
            </Typography>
            {main.serviceInfo ? (
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: alpha(m.navy, 0.55),
                  mt: 0.35,
                }}
              >
                {main.serviceInfo}
              </Typography>
            ) : null}
          </Box>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            sx={{ ml: { xs: 0, sm: "auto" } }}
          >
            <ServiceCardPriceBlock cardPrice={cardPrice} m={m} />
            <IconButton
              size="small"
              aria-label="Edit service"
              onClick={() => handleEditMainService(main)}
              disabled={isBusinessSetupSaving}
              sx={{ width: 32, height: 32, color: alpha(m.navy, 0.45) }}
            >
              <EditRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Delete service"
              onClick={() => handleDeleteMainService(main.id)}
              disabled={isBusinessSetupSaving}
              sx={{ width: 32, height: 32, color: alpha(m.navy, 0.45) }}
            >
              <DeleteOutlineRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton
              size="small"
              aria-label={
                expanded ? "Collapse subservices" : "Expand subservices"
              }
              onClick={() => toggleMainServiceExpand(main.id)}
              sx={{
                width: 32,
                height: 32,
                color: alpha(m.navy, 0.45),
                transform: expanded ? "rotate(180deg)" : "none",
                transition: "transform 0.2s ease",
              }}
            >
              <KeyboardArrowDownRoundedIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Stack>
        </Stack>

        {expanded ? (
          <Stack spacing={1} sx={{ pl: { xs: 0, sm: 1 }, pt: 0.5 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: alpha(m.navy, 0.62),
                }}
              >
                Subservices
              </Typography>
              <IconButton
                size="small"
                onClick={() =>
                  serviceModal.openAddSubservice(main.categoryId, main.id)
                }
                disabled={servicesDetailsDisabled}
                aria-label="Add subservice"
                sx={addSoftIconButtonSx(m, 32)}
              >
                <AddRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
            {childSubs.length === 0 ? (
              <Typography sx={mollureBodyMutedSx(m.navy)}>
                No subservices yet.
              </Typography>
            ) : (
              childSubs.map((sub) => (
                <ServiceDetailRow key={sub.id} it={sub} {...serviceDetailRowProps} />
              ))
            )}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
}

export function ProfessionalServicesSection({
  m,
  title,
  serviceCategoryTabs,
  activeServiceCategory,
  setActiveServiceCategory,
  groupedServiceSections,
  activeCategoryExplicitMains,
  activeCategoryFlatSubservices,
  expandedServiceDetailIds,
  expandedMainServiceIds,
  toggleServiceDetailExpand,
  toggleMainServiceExpand,
  serviceModal,
  openAddService,
  openAddServiceForCategory,
  openAddSubserviceForItem,
  handleEditSubservice,
  handleDeleteSubservice,
  handleEditMainService,
  handleDeleteMainService,
  isBusinessSetupSaving,
  servicesDetailsDisabled,
  showProjectSection,
  biz,
  setBizField,
}: ProfessionalServicesSectionProps) {
  const serviceDetailRowProps: Omit<ServiceDetailRowProps, "it" | "isChild"> = {
    m,
    expandedServiceDetailIds,
    serviceModal,
    openAddSubserviceForItem,
    handleEditSubservice,
    handleDeleteSubservice,
    toggleServiceDetailExpand,
    isBusinessSetupSaving,
    servicesDetailsDisabled,
  };

  return (
    <SectionShell
      title={
        <Typography
          sx={{
            fontWeight: 700,
            color: alpha(m.navy, 0.9),
            fontSize: { xs: 24, sm: 28, md: 30 },
            lineHeight: 1.2,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </Typography>
      }
    >
      <Stack spacing={1.5}>
        <ServiceCategoryBar
          items={serviceCategoryTabs}
          activeId={activeServiceCategory}
          onSelect={setActiveServiceCategory}
        />

        <Stack spacing={1.5}>
          {activeServiceCategory === "" ? (
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 500,
                color: alpha(m.navy, 0.55),
                py: 2,
                px: 1,
                textAlign: "center",
              }}
            >
              Select a category above to view or manage services.
            </Typography>
          ) : (
            <>
              {activeServiceCategory !== "all" ? (
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: "10px",
                    border: `1px solid ${alpha(m.navy, 0.08)}`,
                    bgcolor: alpha(m.navy, 0.045),
                    px: 1.75,
                    py: 1.1,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 500,
                      fontSize: 14,
                      color: alpha(m.navy, 0.88),
                      flex: 1,
                    }}
                  >
                    {serviceCategoryTabs.find(
                      (x) => x.id === activeServiceCategory,
                    )?.label ?? "Services"}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={openAddService}
                    disabled={isBusinessSetupSaving}
                    aria-label="Add service"
                    sx={{
                      ...addSoftIconButtonSx(m, 36),
                      "&.Mui-disabled": {
                        bgcolor: alpha(m.navy, 0.12),
                        color: alpha(m.navy, 0.35),
                        opacity: 1,
                      },
                    }}
                  >
                    <AddRoundedIcon sx={{ fontSize: 22 }} />
                  </IconButton>
                </Paper>
              ) : null}

              {activeServiceCategory === "all" ? (
                <Stack spacing={2}>
                  {groupedServiceSections.length === 0 ? (
                    <Typography
                      sx={{ fontSize: 13, color: alpha(m.navy, 0.55) }}
                    >
                      No services yet.
                    </Typography>
                  ) : (
                    groupedServiceSections.map((group) => (
                      <Stack key={group.categoryId} spacing={1}>
                        <Paper
                          elevation={0}
                          sx={{
                            borderRadius: "10px",
                            border: `1px solid ${alpha(m.navy, 0.08)}`,
                            bgcolor: alpha(m.navy, 0.045),
                            px: 1.75,
                            py: 1.1,
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: 500,
                              fontSize: 14,
                              color: alpha(m.navy, 0.88),
                              flex: 1,
                            }}
                          >
                            {group.title}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() =>
                              openAddServiceForCategory(group.categoryId)
                            }
                            disabled={isBusinessSetupSaving}
                            aria-label={`Add service to ${group.title}`}
                            sx={{
                              ...addSoftIconButtonSx(m, 36),
                              "&.Mui-disabled": {
                                bgcolor: alpha(m.navy, 0.12),
                                color: alpha(m.navy, 0.35),
                                opacity: 1,
                              },
                            }}
                          >
                            <AddRoundedIcon sx={{ fontSize: 22 }} />
                          </IconButton>
                        </Paper>
                        <Stack spacing={1}>
                          {group.explicitMains.map((main) => (
                            <MainServiceRow
                              key={main.id}
                              main={main}
                              m={m}
                              expandedMainServiceIds={expandedMainServiceIds}
                              serviceModal={serviceModal}
                              handleEditMainService={handleEditMainService}
                              handleDeleteMainService={handleDeleteMainService}
                              toggleMainServiceExpand={toggleMainServiceExpand}
                              isBusinessSetupSaving={isBusinessSetupSaving}
                              servicesDetailsDisabled={servicesDetailsDisabled}
                              serviceDetailRowProps={serviceDetailRowProps}
                            />
                          ))}
                          {group.subs.map((service) => (
                            <ServiceDetailRow
                              key={service.id}
                              it={service}
                              {...serviceDetailRowProps}
                            />
                          ))}
                        </Stack>
                      </Stack>
                    ))
                  )}
                </Stack>
              ) : (
                <Stack spacing={1}>
                  {activeCategoryExplicitMains.length === 0 &&
                  activeCategoryFlatSubservices.length === 0 ? (
                    <Typography
                      sx={{ fontSize: 13, color: alpha(m.navy, 0.55) }}
                    >
                      No services in this category.
                    </Typography>
                  ) : (
                    <>
                      {activeCategoryExplicitMains.map((main) => (
                        <MainServiceRow
                          key={main.id}
                          main={main}
                          m={m}
                          expandedMainServiceIds={expandedMainServiceIds}
                          serviceModal={serviceModal}
                          handleEditMainService={handleEditMainService}
                          handleDeleteMainService={handleDeleteMainService}
                          toggleMainServiceExpand={toggleMainServiceExpand}
                          isBusinessSetupSaving={isBusinessSetupSaving}
                          servicesDetailsDisabled={servicesDetailsDisabled}
                          serviceDetailRowProps={serviceDetailRowProps}
                        />
                      ))}
                      {activeCategoryFlatSubservices.map((service) => (
                        <ServiceDetailRow
                          key={service.id}
                          it={service}
                          {...serviceDetailRowProps}
                        />
                      ))}
                    </>
                  )}
                </Stack>
              )}
            </>
          )}
        </Stack>

        {showProjectSection ? (
          <Paper
            elevation={0}
            sx={{
              mt: 0.5,
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.1)}`,
              bgcolor: alpha(m.navy, 0.01),
              px: 1.5,
              py: 1.25,
            }}
          >
            <Stack spacing={0.75}>
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Checkbox
                    checked={biz.projectEnabled}
                    disabled={servicesDetailsDisabled}
                    onChange={(e) =>
                      setBizField("projectEnabled", e.target.checked)
                    }
                    sx={{
                      color: alpha(m.navy, 0.28),
                      "&.Mui-checked": { color: "primary.main" },
                    }}
                  />
                }
                label={
                  <Typography
                    sx={{
                      fontWeight: 800,
                      color: alpha(m.navy, 0.84),
                      fontSize: 13,
                    }}
                  >
                    Project
                  </Typography>
                }
              />
              <Typography
                sx={{
                  ...mollureBodyMutedSx(m.navy),
                  lineHeight: 1.45,
                }}
              >
                Enable this to provide photoshoot booking services
              </Typography>
              <MollureFormField
                placeholder="Custom instructions for Project"
                value={biz.projectInstructions}
                onChange={(e) =>
                  setBizField("projectInstructions", e.target.value)
                }
                multiline
                minRows={3}
                disabled={servicesDetailsDisabled || !biz.projectEnabled}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#fff",
                  },
                }}
              />
            </Stack>
          </Paper>
        ) : null}
      </Stack>
    </SectionShell>
  );
}

"use client";

import {
  mollureLabelSx,
} from "../../../../theme/mollureHierarchy";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";

import {
  Box,
  IconButton,
  Stack,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

import {
  alpha,
} from "@mui/material/styles";

import {
  BodyText,
} from "../../../ui/typography";

import AppTextField from "../../AppTextField";

import {
  resolveMediaUrl,
} from "../../../../lib/resolveMediaUrl";

import { FillImageOrFallback } from "../../client-booking/ProjectUploadThumb";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsProjectBag = Pick<
  Vm,
  | "bookingProjectDescription"
  | "bookingProjectEnabled"
  | "bookingProjectUploads"
  | "canUseBookingProject"
  | "deleteProjectUpload"
  | "handleProjectFilePick"
  | "isViewingExisting"
  | "m"
  | "projectFileInputRef"
  | "setBookingProjectDescription"
  | "setBookingProjectEnabled"
>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsProjectProps = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerDetailsProjectBag;
};

/** Project description + document uploads */
export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsProject({ bag }: ProfessionalFixedLocationCalendarBookingDrawerDetailsProjectProps) {
  const {
    bookingProjectDescription,
    bookingProjectEnabled,
    bookingProjectUploads,
    canUseBookingProject,
    deleteProjectUpload,
    handleProjectFilePick,
    isViewingExisting,
    m,
    projectFileInputRef,
    setBookingProjectDescription,
    setBookingProjectEnabled,
  } = bag;

  return (
    <>
        {canUseBookingProject ? (
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={bookingProjectEnabled}
                  disabled={isViewingExisting}
                  onChange={(e) =>
                    setBookingProjectEnabled(e.target.checked)
                  }
                  sx={{
                    color: alpha(m.navy, 0.35),
                    "&.Mui-checked": { color: m.teal },
                  }}
                />
              }
              label={
                <BodyText
                  sx={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: alpha(m.navy, 0.72),
                  }}
                >
                  Project
                </BodyText>
              }
            />
            {bookingProjectEnabled ? (
              <Box sx={{ mt: 1 }}>
                <BodyText
                  sx={{
                    ...mollureLabelSx(m.navy),
                    mb: 0.75,
                  }}
                >
                  Project
                </BodyText>
                <BodyText
                  sx={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: alpha(m.navy, 0.62),
                    mb: 0.5,
                  }}
                >
                  Description
                </BodyText>
                <AppTextField
                  placeholder="Create this to provide premium salon booking services"
                  value={bookingProjectDescription}
                  onChange={(e) =>
                    setBookingProjectDescription(e.target.value)
                  }
                  disabled={isViewingExisting}
                  multiline
                  minRows={3}
                  fullWidth
                  sx={{ mb: 1.5 }}
                />
                <BodyText
                  sx={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: alpha(m.navy, 0.62),
                    mb: 0.75,
                  }}
                >
                  Upload
                </BodyText>
                <Box
                  component="button"
                  type="button"
                  disabled={isViewingExisting}
                  onClick={() =>
                    projectFileInputRef.current?.click()
                  }
                  sx={{
                    width: "100%",
                    border: `1px dashed ${alpha(m.navy, 0.18)}`,
                    borderRadius: "10px",
                    bgcolor: "#fff",
                    py: 2.5,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.75,
                    cursor: isViewingExisting
                      ? "default"
                      : "pointer",
                    mb: 1.25,
                    opacity: isViewingExisting ? 0.6 : 1,
                    "&:hover": isViewingExisting
                      ? undefined
                      : {
                          bgcolor: alpha(m.teal, 0.04),
                          borderColor: alpha(m.teal, 0.35),
                        },
                  }}
                >
                  <FileUploadOutlinedIcon
                    sx={{
                      fontSize: 28,
                      color: alpha(m.navy, 0.35),
                    }}
                  />
                  <BodyText
                    sx={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      color: alpha(m.navy, 0.48),
                    }}
                  >
                    Upload Image &amp; Documents
                  </BodyText>
                </Box>
                <input
                  ref={projectFileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  hidden
                  onChange={handleProjectFilePick}
                />
                {bookingProjectUploads.length > 0 ? (
                  <Box>
                    <BodyText
                      sx={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: alpha(m.navy, 0.62),
                        mb: 0.75,
                      }}
                    >
                      Uploaded
                    </BodyText>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ overflowX: "auto", pb: 0.5 }}
                    >
                      {bookingProjectUploads.map((img) => (
                        <Box
                          key={img.id}
                          sx={{
                            flex: "0 0 88px",
                            minWidth: 88,
                            position: "relative",
                          }}
                        >
                          {!isViewingExisting ? (
                            <IconButton
                              size="small"
                              onClick={() =>
                                deleteProjectUpload(img.id)
                              }
                              aria-label={`Remove ${img.name}`}
                              sx={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                zIndex: 1,
                                width: 20,
                                height: 20,
                                bgcolor: alpha(m.navy, 0.55),
                                color: "#fff",
                                "&:hover": {
                                  bgcolor: alpha(m.navy, 0.72),
                                },
                              }}
                            >
                              <CloseRoundedIcon
                                sx={{ fontSize: 12 }}
                              />
                            </IconButton>
                          ) : null}
                          <Box
                            sx={{
                              width: 88,
                              height: 62,
                              borderRadius: "8px",
                              border: `1px solid ${alpha(m.navy, 0.08)}`,
                              overflow: "hidden",
                              bgcolor: alpha(m.navy, 0.04),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <FillImageOrFallback
                              src={
                                img.name.toLowerCase().endsWith(".pdf")
                                  ? null
                                  : (resolveMediaUrl(img.previewUrl) ??
                                    img.previewUrl)
                              }
                              alt={img.name}
                              fallback={
                                img.name.toLowerCase().endsWith(".pdf") ? (
                                  <BodyText
                                    sx={{
                                      fontSize: 10,
                                      fontWeight: 800,
                                      color: alpha(m.navy, 0.45),
                                    }}
                                  >
                                    PDF
                                  </BodyText>
                                ) : null
                              }
                            />
                          </Box>
                          <BodyText
                            sx={{
                              mt: 0.4,
                              fontSize: 9,
                              fontWeight: 800,
                              color: alpha(m.navy, 0.48),
                              textAlign: "center",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {img.name}
                          </BodyText>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ) : null}
              </Box>
            ) : null}
          </Box>
        ) : null}
    </>
  );
}

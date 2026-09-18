"use client";

import * as React from "react";
import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import {
  mollureBodySx,
  mollureLabelSx,
} from "../../../theme/mollureHierarchy";
import { resolveMediaUrl } from "../../../lib/resolveMediaUrl";
import { FillImageOrFallback } from "../../../components/common/client-booking/ProjectUploadThumb";

export type ClientBookingProjectUpload = {
  id: string;
  name: string;
  previewUrl: string;
  file?: File;
};

export type ClientBookingProjectDetailsPanelProps = {
  isDesiredLocation: boolean;
  isCompanyClient: boolean;
  bookingProjectEnabled: boolean;
  setBookingProjectEnabled: (enabled: boolean) => void;
  showProjectDetails: boolean;
  projectDescription: string;
  setProjectDescription: (value: string) => void;
  projectFileInputRef: React.RefObject<HTMLInputElement | null>;
  handleProjectFilePick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  projectUploads: ClientBookingProjectUpload[];
  deleteProjectUpload: (id: string) => void;
};

export default function ClientBookingProjectDetailsPanel({
  isDesiredLocation,
  isCompanyClient,
  bookingProjectEnabled,
  setBookingProjectEnabled,
  showProjectDetails,
  projectDescription,
  setProjectDescription,
  projectFileInputRef,
  handleProjectFilePick,
  projectUploads,
  deleteProjectUpload,
}: ClientBookingProjectDetailsPanelProps) {
  const m = useTheme().palette.mollure;

  return (
    <>
      {isDesiredLocation && isCompanyClient ? (
        <Box
          sx={{
            width: "100%",
            mt: 1.25,
            px: 0.25,
            textAlign: "left",
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={bookingProjectEnabled}
                onChange={(e) => setBookingProjectEnabled(e.target.checked)}
                sx={{
                  color: alpha(m.navy, 0.35),
                  "&.Mui-checked": { color: m.teal },
                }}
              />
            }
            label={
              <Typography
                sx={mollureBodySx(m.navy, {
                  fontWeight: 800,
                  fontSize: 13,
                })}
              >
                Project
              </Typography>
            }
            sx={{ ml: 0, mb: bookingProjectEnabled ? 0.5 : 0 }}
          />
        </Box>
      ) : null}

      {showProjectDetails ? (
        <Box
          id="booking-project-section"
          sx={{ width: "100%", mt: 1.25, px: 0.25, textAlign: "left" }}
        >
          <Typography
            sx={mollureLabelSx(m.navy, {
              fontWeight: 900,
              mb: 1.25,
            })}
          >
            Project Details
          </Typography>
          <Typography
            sx={mollureLabelSx(m.navy, { mb: 0.5 })}
          >
            Description
          </Typography>
          <TextField
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="Project description"
            multiline
            minRows={3}
            fullWidth
            sx={{
              mb: 1.5,
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                bgcolor: "#fff",
                fontSize: 12,
              },
            }}
          />
          <Typography
            sx={mollureLabelSx(m.navy, { mb: 0.75 })}
          >
            Upload Section
          </Typography>
          <Box
            component="button"
            type="button"
            onClick={() => projectFileInputRef.current?.click()}
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
              cursor: "pointer",
              mb: 1.25,
              "&:hover": {
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
            <Typography
              sx={mollureLabelSx(m.navy, {
                color: alpha(m.navy, 0.48),
              })}
            >
              Upload Image &amp; Documents
            </Typography>
          </Box>
          <input
            ref={projectFileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            hidden
            onChange={handleProjectFilePick}
          />
          <Stack
            direction="row"
            spacing={1}
            sx={{ overflowX: "auto", pb: 0.5 }}
          >
            {projectUploads.map((img) => {
              const isPdf =
                img.name.toLowerCase().endsWith(".pdf") ||
                img.file?.type === "application/pdf";
              const src = resolveMediaUrl(img.previewUrl) || img.previewUrl;
              const canBeImage =
                !isPdf &&
                (img.file?.type.startsWith("image/") ||
                  (!img.file && Boolean(src)));
              return (
              <Box
                key={img.id}
                sx={{
                  flex: "0 0 88px",
                  minWidth: 88,
                  position: "relative",
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => deleteProjectUpload(img.id)}
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
                  <CloseRoundedIcon sx={{ fontSize: 12 }} />
                </IconButton>
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
                    src={canBeImage ? src : null}
                    alt={img.name}
                    fallback={
                      isPdf ? (
                        <Typography
                          sx={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: alpha(m.navy, 0.45),
                          }}
                        >
                          PDF
                        </Typography>
                      ) : null
                    }
                  />
                </Box>
                <Typography
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
                </Typography>
              </Box>
              );
            })}
          </Stack>
        </Box>
      ) : null}
    </>
  );
}

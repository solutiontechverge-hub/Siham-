"use client";

import * as React from "react";
import Image from "next/image";
import {
  Box,
  Button,
  Container,
  Grid,
  MenuItem,
  Paper,
  Stack,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import { contactUsData } from "../../app/contact-us/contactus.data";
import { useContactUsForm } from "../../app/contact-us/contactus.use";
import { ContactUsImage } from "../../../images";
import { BodyText, SubHeading } from "../ui/typography";
import { MollureLabeledField, MollureLabeledSelect } from ".";

export type ContactUsProps = {
  illustrationSrc: string;
};

export default function ContactUs({ illustrationSrc }: ContactUsProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const {
    values,
    setField,
    touched,
    errors,
    touch,
    addFiles,
    removeFile,
    submit,
    submitState,
    showSignInGate,
    closeGate,
  } = useContactUsForm();

  const fileInputId = React.useId();

  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 3, md: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: "20px",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                boxShadow: "0 18px 50px rgba(16, 35, 63, 0.08)",
                bgcolor: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Stack spacing={1.25} alignItems="center" textAlign="center">
                <SubHeading
                  sx={{
                    color: m.navy,
                    letterSpacing: "-0.04em",
                    fontSize: { xs: "1.6rem", sm: "2rem" },
                  }}
                >
                  {contactUsData.headerTitle}
                </SubHeading>
                <BodyText sx={{ color: alpha(m.navy, 0.55), fontSize: 13 }}>
                  {contactUsData.headerSubtitle}
                </BodyText>
              </Stack>

              <Box
                sx={{ mt: 3, position: "relative", width: "100%", height: 340 }}
              >
                <Image
                  src={ContactUsImage}
                  alt="Contact illustration"
                  fill
                  style={{ objectFit: "contain" }}
                />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: "20px",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                boxShadow: "0 18px 50px rgba(16, 35, 63, 0.08)",
                bgcolor: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Stack spacing={2.25}>
                <MollureLabeledSelect
                  fieldLabel={contactUsData.whoAreYou.label}
                  value={values.persona}
                  onChange={(e) => setField("persona", String(e.target.value))}
                  onBlur={() => touch("persona")}
                  errorText={touched.persona ? errors.persona : undefined}
                >
                  <MenuItem value="">
                    <em>{contactUsData.whoAreYou.label}</em>
                  </MenuItem>
                  {contactUsData.whoAreYou.options.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </MollureLabeledSelect>

                <Grid container spacing={0.2}>
                  <Grid item xs={12} sm={6}>
                    <MollureLabeledField
                      fieldLabel={contactUsData.fields.name.label}
                      placeholder={contactUsData.fields.name.placeholder}
                      value={values.name}
                      onChange={(e) => setField("name", e.target.value)}
                      onBlur={() => touch("name")}
                      error={Boolean(touched.name && errors.name)}
                      helperText={touched.name ? errors.name : undefined}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MollureLabeledField
                      fieldLabel={contactUsData.fields.email.label}
                      placeholder={contactUsData.fields.email.placeholder}
                      value={values.email}
                      onChange={(e) => setField("email", e.target.value)}
                      onBlur={() => touch("email")}
                      error={Boolean(touched.email && errors.email)}
                      helperText={touched.email ? errors.email : undefined}
                    />
                  </Grid>
                </Grid>

                <MollureLabeledSelect
                  fieldLabel={contactUsData.fields.subject.label}
                  value={values.subject}
                  onChange={(e) => setField("subject", String(e.target.value))}
                  onBlur={() => touch("subject")}
                  errorText={touched.subject ? errors.subject : undefined}
                  renderValue={(val) =>
                    val ? String(val) : contactUsData.fields.subject.placeholder
                  }
                >
                  <MenuItem value="">
                    <em>{contactUsData.fields.subject.placeholder}</em>
                  </MenuItem>
                  {contactUsData.fields.subject.options.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </MollureLabeledSelect>

                <MollureLabeledField
                  fieldLabel={contactUsData.fields.message.label}
                  multiline
                  minRows={4}
                  placeholder={contactUsData.fields.message.placeholder}
                  value={values.message}
                  onChange={(e) => setField("message", e.target.value)}
                  onBlur={() => touch("message")}
                  error={Boolean(touched.message && errors.message)}
                  helperText={touched.message ? errors.message : undefined}
                />

                <Stack direction="row" alignItems="center" spacing={1.25}>
                  <input
                    id={fileInputId}
                    type="file"
                    hidden
                    multiple
                    onChange={(e) => addFiles(e.target.files)}
                  />
                  <Button
                    component="label"
                    htmlFor={fileInputId}
                    variant="text"
                    startIcon={<AttachFileRoundedIcon />}
                    sx={{
                      textTransform: "none",
                      color: alpha(m.navy, 0.65),
                      fontWeight: 600,
                      px: 0,
                      "&:hover": { bgcolor: "transparent", color: m.navy },
                    }}
                  >
                    Attach File
                  </Button>
                </Stack>

                {values.attachments.length ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {values.attachments.slice(0, 4).map((f, idx) => (
                      <Box
                        key={f.name + idx}
                        onClick={() => removeFile(idx)}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1.5,
                          border: `1px solid ${alpha(m.navy, 0.14)}`,
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                          color: alpha(m.navy, 0.6),
                          fontSize: 11,
                          userSelect: "none",
                        }}
                        title="Click to remove"
                      >
                        file
                      </Box>
                    ))}
                  </Stack>
                ) : null}

                <Stack spacing={0.75}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box
                      component="input"
                      type="checkbox"
                      checked={values.consent}
                      onChange={(e) => setField("consent", e.target.checked)}
                      onBlur={() => touch("consent")}
                      sx={{ width: 16, height: 16 }}
                    />
                    <BodyText sx={{ fontSize: 11, color: alpha(m.navy, 0.55) }}>
                      {contactUsData.fields.consent.label}
                    </BodyText>
                  </Stack>
                  {touched.consent && errors.consent ? (
                    <BodyText sx={{ fontSize: 11, color: "error.main" }}>
                      {errors.consent}
                    </BodyText>
                  ) : null}
                </Stack>

                <Button
                  onClick={submit}
                  variant="contained"
                  disabled={submitState === "submitting"}
                  sx={{
                    mt: 1,
                    borderRadius: 1.5,
                    py: 1.35,
                    textTransform: "none",
                    fontWeight: 700,
                    bgcolor: m.teal,
                    "&:hover": { bgcolor: m.teal },
                  }}
                >
                  {submitState === "success"
                    ? "Sent"
                    : contactUsData.fields.submitLabel}
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Box, Chip, Divider, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AppButton, AppTextField } from "../../common";
import AdminPageHeader from "../AdminPageHeader";
import AdminSectionCard from "../AdminSectionCard";
import { mockMessages } from "../adminMockData";

function parseRecipients(searchParams: URLSearchParams) {
  const emails =
    searchParams
      .get("recipients")
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const names =
    searchParams
      .get("names")
      ?.split("|")
      .map((s) => s.trim()) ?? [];
  return emails.map((email, i) => ({ email, name: names[i] ?? email }));
}

type AdminMessagingPageProps = {
  embedded?: boolean;
};

export default function AdminMessagingPage({
  embedded = false,
}: AdminMessagingPageProps) {
  const theme = useTheme();
  const tokens = theme.palette.mollure;
  const searchParams = useSearchParams();
  const prefilledRecipients = React.useMemo(
    () => parseRecipients(searchParams),
    [searchParams],
  );

  const [messages, setMessages] = React.useState(mockMessages);
  const [selectedId, setSelectedId] = React.useState<string | null>(
    messages[0]?.id ?? null,
  );
  const [reply, setReply] = React.useState("");
  const [outgoingSubject, setOutgoingSubject] = React.useState("");
  const [outgoingBody, setOutgoingBody] = React.useState("");

  React.useEffect(() => {
    if (prefilledRecipients.length > 0) {
      setOutgoingSubject((prev) => prev || "Message from Mollure");
    }
  }, [prefilledRecipients.length]);

  const selected = messages.find((m) => m.id === selectedId);

  const handleSend = () => {
    if (!selected || !reply.trim()) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === selected.id ? { ...m, status: "replied" as const } : m,
      ),
    );
    setReply("");
  };

  const handleDelete = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <>
      {!embedded ? (
        <AdminPageHeader
          title="Messaging & email"
          description="Incoming Contact Us messages and outgoing email replies."
        />
      ) : null}

      {prefilledRecipients.length > 0 ? (
        <AdminSectionCard title="Send email to clients" sx={{ mb: 2.5 }}>
          <Stack spacing={2}>
            <Box>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: tokens.slate,
                  mb: 0.75,
                }}
              >
                Recipients ({prefilledRecipients.length})
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {prefilledRecipients.map((r) => (
                  <Chip
                    key={r.email}
                    label={`${r.name} <${r.email}>`}
                    size="small"
                    sx={{
                      fontSize: 11,
                      bgcolor: tokens.mintSoft,
                      color: tokens.tealDark,
                    }}
                  />
                ))}
              </Stack>
            </Box>
            <AppTextField
              label="Subject"
              value={outgoingSubject}
              onChange={(e) => setOutgoingSubject(e.target.value)}
              fullWidth
            />
            <AppTextField
              label="Message"
              value={outgoingBody}
              onChange={(e) => setOutgoingBody(e.target.value)}
              fullWidth
              multiline
              minRows={5}
            />
            <Stack direction="row" spacing={1.25}>
              <AppButton
                variant="contained"
                disabled={!outgoingSubject.trim() || !outgoingBody.trim()}
                sx={{ textTransform: "none" }}
              >
                Send email
              </AppButton>
            </Stack>
          </Stack>
        </AdminSectionCard>
      ) : null}

      <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <AdminSectionCard title="Incoming messages">
            <Stack spacing={0} divider={<Divider />}>
              {messages.length === 0 ? (
                <Typography
                  sx={{ fontSize: 14, color: tokens.bodyText, py: 2 }}
                >
                  No messages.
                </Typography>
              ) : (
                messages.map((msg) => (
                  <Box
                    key={msg.id}
                    onClick={() => setSelectedId(msg.id)}
                    sx={{
                      py: 1.5,
                      px: 1,
                      borderRadius: 2,
                      cursor: "pointer",
                      bgcolor:
                        selectedId === msg.id ? tokens.mintSoft : "transparent",
                      "&:hover": { bgcolor: tokens.surface },
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: tokens.navy,
                        }}
                      >
                        {msg.name}
                      </Typography>
                      {msg.status === "new" ? (
                        <Chip
                          label="New"
                          size="small"
                          sx={{
                            bgcolor: tokens.teal,
                            color: "#fff",
                            fontSize: 10,
                            height: 20,
                          }}
                        />
                      ) : (
                        <Chip
                          label="Replied"
                          size="small"
                          sx={{ fontSize: 10, height: 20 }}
                        />
                      )}
                    </Stack>
                    <Typography sx={{ fontSize: 12, color: tokens.bodyText }}>
                      {msg.email}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 12, color: tokens.slate, mt: 0.25 }}
                    >
                      {msg.subject} · {msg.date}
                    </Typography>
                  </Box>
                ))
              )}
            </Stack>
          </AdminSectionCard>
        </Box>

        <Box sx={{ flex: 1.2, minWidth: 0 }}>
          <AdminSectionCard title="Reply">
            {selected ? (
              <Stack spacing={2}>
                <Box>
                  <Typography
                    sx={{ fontSize: 13, fontWeight: 600, color: tokens.navy }}
                  >
                    {selected.name}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: tokens.bodyText }}>
                    {selected.email}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: tokens.slate, mt: 1 }}>
                    {selected.body}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    border: `1px solid ${tokens.cardBorder}`,
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: tokens.mintSoft,
                      px: 2,
                      py: 1.5,
                      borderBottom: `1px solid ${tokens.cardBorder}`,
                    }}
                  >
                    <Typography
                      sx={{ fontWeight: 700, color: tokens.teal, fontSize: 14 }}
                    >
                      MOLUR
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: tokens.bodyText }}>
                      Standard email template
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <AppTextField
                      multiline
                      minRows={6}
                      placeholder="Type your reply..."
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      fullWidth
                      variant="standard"
                      InputProps={{ disableUnderline: true }}
                    />
                  </Box>
                </Box>

                <Stack direction="row" spacing={1.5}>
                  <AppButton
                    variant="contained"
                    onClick={handleSend}
                    disabled={!reply.trim()}
                  >
                    Send reply
                  </AppButton>
                  {selected.status === "replied" ? (
                    <AppButton
                      variant="outlined"
                      color="inherit"
                      onClick={() => handleDelete(selected.id)}
                    >
                      Delete from list
                    </AppButton>
                  ) : null}
                </Stack>
              </Stack>
            ) : (
              <Typography sx={{ fontSize: 14, color: tokens.bodyText }}>
                Select a message to reply.
              </Typography>
            )}
          </AdminSectionCard>
        </Box>
      </Stack>
    </>
  );
}

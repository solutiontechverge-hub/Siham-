"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  useDeleteAdminMessageMutation,
  useGetAdminMessagingQuery,
  useReplyAdminMessageMutation,
} from "../../../../store/services/adminApi";
import type { MessagingRecipient } from "./messaging.types";
import { INPUT_LIMITS, parseText } from "../../../../lib/inputSchema";

function parseRecipients(searchParams: URLSearchParams): MessagingRecipient[] {
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

export function useAdminMessagingPage() {
  const searchParams = useSearchParams();
  const prefilledRecipients = React.useMemo(
    () => parseRecipients(searchParams),
    [searchParams],
  );

  const { data } = useGetAdminMessagingQuery();
  const [replyAdminMessage] = useReplyAdminMessageMutation();
  const [deleteAdminMessage] = useDeleteAdminMessageMutation();
  const messages = data?.data?.items ?? [];

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [reply, setReply] = React.useState("");
  const [outgoingSubject, setOutgoingSubject] = React.useState("");
  const [outgoingBody, setOutgoingBody] = React.useState("");

  React.useEffect(() => {
    if (!selectedId && messages[0]?.id) {
      setSelectedId(messages[0].id);
    }
  }, [messages, selectedId]);

  React.useEffect(() => {
    if (prefilledRecipients.length > 0) {
      setOutgoingSubject((prev) => prev || "Message from Mollure");
    }
  }, [prefilledRecipients.length]);

  const selected = messages.find((m) => m.id === selectedId);

  const handleSend = async () => {
    if (!selected) return;
    const parsed = parseText(reply, {
      label: "Reply",
      min: 1,
      max: INPUT_LIMITS.messageMax,
    });
    if (!parsed.ok) return;
    await replyAdminMessage({ id: selected.id, reply: parsed.value });
    setReply("");
  };

  const handleDelete = async (id: string) => {
    await deleteAdminMessage(id);
    if (selectedId === id) setSelectedId(null);
  };

  return {
    prefilledRecipients,
    messages,
    selectedId,
    setSelectedId,
    reply,
    setReply,
    outgoingSubject,
    setOutgoingSubject,
    outgoingBody,
    setOutgoingBody,
    selected,
    handleSend,
    handleDelete,
  };
}

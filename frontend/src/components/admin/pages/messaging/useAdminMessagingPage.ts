"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { mockMessages } from "../../adminMockData";
import type { MessagingRecipient } from "./messaging.types";

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

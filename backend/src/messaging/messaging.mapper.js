const formatTimeLabel = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace("AM", "am")
    .replace("PM", "pm");
};

const dateKeyFromIso = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const mapMessageRow = (row, viewerUserId) => {
  const isSelf = row.sender_user_id === viewerUserId;
  const createdAt = row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at);

  return {
    id: row.client_message_id || row.id,
    dbId: row.id,
    senderSide: isSelf ? "self" : "peer",
    senderRole: row.sender_role,
    senderName: isSelf ? "You" : row.sender_display_name || "User",
    senderAvatarSeed: row.sender_avatar_seed || (row.sender_role === "client" ? "client" : "pro"),
    timeLabel: formatTimeLabel(createdAt),
    createdAt,
    body: row.deleted_for_everyone ? "" : row.body || "",
    attachments: row.deleted_for_everyone ? undefined : row.attachments || [],
    dateKey: dateKeyFromIso(createdAt),
    deletedForEveryone: Boolean(row.deleted_for_everyone),
  };
};

export const mapDraftProfessionalThread = (row) => ({
  id: `draft:${row.professional_user_id}`,
  professionalUserId: row.professional_user_id,
  isNewConversation: true,
  name: row.display_name || row.email || "Professional",
  peerEmail: row.email || undefined,
  peerProfileId: row.business_setup_id || undefined,
  bookingId: "",
  bookingMeta: "",
  bookingStatus: "requested",
  locationType: row.service_location_mode === "desired" ? "desired" : "fixed",
  timeLabel: "",
  lastActivityAt: undefined,
  preview: "Tap to start a conversation",
  avatarSeed: row.business_setup_id || "pro",
  unlinked: true,
});

export const mapThreadRow = (row, viewerUserId) => {
  const isProfessional = row.professional_user_id === viewerUserId;
  const peerName = isProfessional ? row.client_display_name : row.professional_display_name;
  const peerEmail = isProfessional ? row.client_email : row.professional_email;
  const peerProfileId = isProfessional ? row.client_profile_id : row.professional_profile_id;
  const lastActivityAt = row.last_message_at
    ? row.last_message_at instanceof Date
      ? row.last_message_at.toISOString()
      : String(row.last_message_at)
    : undefined;

  return {
    id: row.id,
    professionalUserId: row.professional_user_id,
    isNewConversation: false,
    name: peerName || row.peer_display_name || "Conversation",
    peerEmail: peerEmail || row.peer_email || undefined,
    peerProfileId: peerProfileId || row.peer_profile_id || undefined,
    bookingId: row.booking_id || "",
    bookingMeta: row.booking_meta || "",
    bookingStatus: row.booking_status || "requested",
    locationType: row.location_type || "fixed",
    timeLabel: lastActivityAt ? formatTimeLabel(lastActivityAt) : "",
    lastActivityAt,
    preview: row.last_message_preview || "",
    avatarSeed: row.avatar_seed || (isProfessional ? "client" : "pro"),
    unlinked: Boolean(row.unlinked),
  };
};

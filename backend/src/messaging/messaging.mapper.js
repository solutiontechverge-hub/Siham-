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

const parseAttachments = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const mapMessageRow = (row, viewerUserId) => {
  const isSelf = row.sender_user_id === viewerUserId;
  const createdAt = row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at);
  const senderName = row.sender_display_name || "User";

  return {
    id: row.client_message_id || row.id,
    dbId: row.id,
    senderSide: isSelf ? "self" : "peer",
    senderRole: row.sender_role,
    senderName,
    senderAvatarSeed: row.sender_avatar_seed || senderName || (row.sender_role === "client" ? "client" : "pro"),
    timeLabel: formatTimeLabel(createdAt),
    createdAt,
    body: row.deleted_for_everyone ? "" : row.body || "",
    attachments: row.deleted_for_everyone ? undefined : parseAttachments(row.attachments),
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
  businessSetupId: row.business_setup_id || undefined,
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

const LOCATION_LABEL = { fixed: "FL", desired: "DL" };

const bookingMetaFromLinked = (code, status, locationType) => {
  if (!code) return "";
  const statusLabel = String(status || "requested")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const loc = LOCATION_LABEL[locationType] || "FL";
  return `${code} - ${statusLabel} - ${loc}`;
};

export const mapThreadRow = (row, viewerUserId) => {
  const isProfessional = row.professional_user_id === viewerUserId;
  const peerName = isProfessional ? row.client_display_name : row.professional_display_name;
  const peerEmail = isProfessional ? row.client_email : row.professional_email;
  const peerProfileId = isProfessional ? row.client_profile_id : row.professional_profile_id;
  const businessSetupId = row.business_setup_id || undefined;
  const lastActivityAt = row.last_message_at
    ? row.last_message_at instanceof Date
      ? row.last_message_at.toISOString()
      : String(row.last_message_at)
    : undefined;
  const lastFromPeer = row.last_message_sender_role
    ? isProfessional
      ? row.last_message_sender_role === "client"
      : row.last_message_sender_role === "professional"
    : undefined;
  const viewerDisplayName = isProfessional ? row.professional_display_name : row.client_display_name;
  const previewSenderName = row.last_message_sender_role
    ? row.last_message_sender_name || (lastFromPeer ? peerName : viewerDisplayName) || "User"
    : undefined;

  const locationType = row.location_type || "fixed";
  // Link state is explicit only (Link to Booking). Auto-inferred bookings do not clear "Unlinked".
  const hasExplicitLink = Boolean(row.booking_id) && row.unlinked !== true;
  const bookingId = hasExplicitLink ? row.booking_id : "";
  const bookingStatus = hasExplicitLink ? row.booking_status || "" : "";
  const bookingMeta = hasExplicitLink
    ? row.booking_meta || bookingMetaFromLinked(bookingId, bookingStatus, locationType)
    : "";

  return {
    id: row.id,
    professionalUserId: row.professional_user_id,
    isNewConversation: false,
    name: peerName || row.peer_display_name || "Conversation",
    peerEmail: peerEmail || row.peer_email || undefined,
    // Client public profile needs business setup id; keep profile id for pro→client links.
    peerProfileId: isProfessional
      ? peerProfileId || row.peer_profile_id || undefined
      : businessSetupId || row.peer_profile_id || peerProfileId || undefined,
    businessSetupId,
    bookingId,
    bookingMeta,
    // Never invent "requested" when there is no booking — that falsely opens the pro inbox.
    bookingStatus: bookingStatus || "cancelled",
    locationType,
    timeLabel: lastActivityAt ? formatTimeLabel(lastActivityAt) : "",
    lastActivityAt,
    preview: row.last_message_preview || "",
    previewSenderName,
    previewFromPeer: lastFromPeer,
    avatarSeed: row.avatar_seed || (isProfessional ? "client" : "pro"),
    unlinked: !hasExplicitLink,
  };
};

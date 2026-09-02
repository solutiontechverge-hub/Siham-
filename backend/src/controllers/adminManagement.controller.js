import {
  addAdminKeyword,
  createAdminUser,
  deleteAdminContactMessage,
  deleteAdminRole,
  deleteAdminUser,
  getListingRankingFactors,
  hideAdminReview,
  listAdminClients,
  listAdminContactMessages,
  listAdminProfessionals,
  listAdminReports,
  listAdminReviews,
  listAdminRoles,
  listAdminUsers,
  removeAdminKeyword,
  replyAdminContactMessage,
  updateAdminClient,
  updateAdminProfessional,
  updateAdminRatingRanges,
  updateAdminReport,
  updateAdminUser,
  upsertAdminRole,
} from "../services/adminManagement.service.js";

const ok = (res, message, data, status = 200) =>
  res.status(status).json({ success: true, message, data });

const fail = (res, status, message, data = null) =>
  res.status(status).json({ success: false, message, data });

export const getAdminProfessionals = async (_req, res) => {
  try {
    const data = await listAdminProfessionals();
    return ok(res, "Professionals loaded.", data);
  } catch (error) {
    return fail(res, 500, "Failed to load professionals.", { error: error.message });
  }
};

export const patchAdminProfessional = async (req, res) => {
  try {
    const item = await updateAdminProfessional(req.params.id, req.body || {});
    if (!item) return fail(res, 404, "Professional not found.");
    return ok(res, "Professional updated.", item);
  } catch (error) {
    return fail(res, 500, "Failed to update professional.", { error: error.message });
  }
};

export const getAdminClients = async (_req, res) => {
  try {
    const data = await listAdminClients();
    return ok(res, "Clients loaded.", data);
  } catch (error) {
    return fail(res, 500, "Failed to load clients.", { error: error.message });
  }
};

export const patchAdminClient = async (req, res) => {
  try {
    const item = await updateAdminClient(req.params.id, {
      ...(req.body || {}),
      updatedBy: req.user?.id,
    });
    if (!item) return fail(res, 404, "Client not found.");
    return ok(res, "Client updated.", item);
  } catch (error) {
    return fail(res, 500, "Failed to update client.", { error: error.message });
  }
};

export const getAdminReviewsModeration = async (_req, res) => {
  try {
    const data = await listAdminReviews();
    return ok(res, "Reviews loaded.", data);
  } catch (error) {
    return fail(res, 500, "Failed to load reviews.", { error: error.message });
  }
};

export const deleteAdminReview = async (req, res) => {
  try {
    const row = await hideAdminReview(req.params.id);
    if (!row) return fail(res, 404, "Review not found.");
    return ok(res, "Review removed.", { id: String(row.id) });
  } catch (error) {
    return fail(res, 500, "Failed to remove review.", { error: error.message });
  }
};

export const postAdminKeyword = async (req, res) => {
  try {
    const keyword = await addAdminKeyword(req.body?.keyword);
    if (!keyword) return fail(res, 400, "Keyword is required.");
    return ok(res, "Keyword added.", { keyword }, 201);
  } catch (error) {
    return fail(res, 500, "Failed to add keyword.", { error: error.message });
  }
};

export const deleteAdminKeyword = async (req, res) => {
  try {
    const data = await removeAdminKeyword(req.params.keyword || req.body?.keyword);
    return ok(res, "Keyword removed.", data);
  } catch (error) {
    return fail(res, 500, "Failed to remove keyword.", { error: error.message });
  }
};

export const putAdminRatingRanges = async (req, res) => {
  try {
    const ranges = await updateAdminRatingRanges(req.body?.ranges || req.body || {});
    return ok(res, "Rating ranges updated.", ranges);
  } catch (error) {
    return fail(res, 500, "Failed to update rating ranges.", { error: error.message });
  }
};

export const getAdminReports = async (_req, res) => {
  try {
    const items = await listAdminReports();
    return ok(res, "Reports loaded.", { items });
  } catch (error) {
    return fail(res, 500, "Failed to load reports.", { error: error.message });
  }
};

export const patchAdminReport = async (req, res) => {
  try {
    const item = await updateAdminReport(req.params.id, req.body || {});
    if (!item) return fail(res, 404, "Report not found.");
    return ok(res, "Report updated.", item);
  } catch (error) {
    return fail(res, 500, "Failed to update report.", { error: error.message });
  }
};

export const getAdminMessaging = async (_req, res) => {
  try {
    const items = await listAdminContactMessages();
    return ok(res, "Messages loaded.", { items });
  } catch (error) {
    return fail(res, 500, "Failed to load messages.", { error: error.message });
  }
};

export const postAdminMessagingReply = async (req, res) => {
  try {
    const replyMessage = String(req.body?.reply || req.body?.replyMessage || "").trim();
    if (!replyMessage) return fail(res, 400, "Reply message is required.");
    const result = await replyAdminContactMessage(req.params.id, replyMessage);
    if (!result.replied) return fail(res, 404, "Message not found.");
    return ok(res, "Reply sent.", result.message);
  } catch (error) {
    return fail(res, 500, "Failed to send reply.", { error: error.message });
  }
};

export const deleteAdminMessaging = async (req, res) => {
  try {
    const row = await deleteAdminContactMessage(req.params.id);
    if (!row) return fail(res, 404, "Message not found.");
    return ok(res, "Message deleted.", { id: String(row.id) });
  } catch (error) {
    return fail(res, 500, "Failed to delete message.", { error: error.message });
  }
};

export const getAdminAccessUsers = async (_req, res) => {
  try {
    const items = await listAdminUsers();
    return ok(res, "Admin users loaded.", { items });
  } catch (error) {
    return fail(res, 500, "Failed to load admin users.", { error: error.message });
  }
};

export const postAdminAccessUser = async (req, res) => {
  try {
    const { name, email, role, status, password } = req.body || {};
    if (!name?.trim() || !email?.trim()) {
      return fail(res, 400, "Name and email are required.");
    }
    const item = await createAdminUser({ name, email, role, status, password });
    return ok(res, "Admin user created.", item, 201);
  } catch (error) {
    const status = String(error.message || "").includes("unique") ? 409 : 500;
    return fail(res, status, "Failed to create admin user.", { error: error.message });
  }
};

export const patchAdminAccessUser = async (req, res) => {
  try {
    const item = await updateAdminUser(req.params.id, req.body || {});
    if (!item) return fail(res, 404, "Admin user not found.");
    return ok(res, "Admin user updated.", item);
  } catch (error) {
    return fail(res, 500, "Failed to update admin user.", { error: error.message });
  }
};

export const deleteAdminAccessUser = async (req, res) => {
  try {
    const row = await deleteAdminUser(req.params.id);
    if (!row) return fail(res, 404, "Admin user not found.");
    return ok(res, "Admin user deleted.", { id: String(row.id) });
  } catch (error) {
    return fail(res, 500, "Failed to delete admin user.", { error: error.message });
  }
};

export const getAdminAccessRoles = async (_req, res) => {
  try {
    const items = await listAdminRoles();
    return ok(res, "Admin roles loaded.", { items });
  } catch (error) {
    return fail(res, 500, "Failed to load admin roles.", { error: error.message });
  }
};

export const putAdminAccessRole = async (req, res) => {
  try {
    const role = req.body || {};
    if (!role.id || !role.name) return fail(res, 400, "Role id and name are required.");
    const item = await upsertAdminRole(role);
    return ok(res, "Admin role saved.", item);
  } catch (error) {
    return fail(res, 500, "Failed to save admin role.", { error: error.message });
  }
};

export const deleteAdminAccessRole = async (req, res) => {
  try {
    const data = await deleteAdminRole(req.params.id);
    return ok(res, "Admin role deleted.", data);
  } catch (error) {
    return fail(res, 500, "Failed to delete admin role.", { error: error.message });
  }
};

export const getAdminListingRanking = async (_req, res) => {
  try {
    const factors = getListingRankingFactors();
    return ok(res, "Listing ranking factors loaded.", { factors });
  } catch (error) {
    return fail(res, 500, "Failed to load listing ranking.", { error: error.message });
  }
};

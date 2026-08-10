import { getClient, query } from "../db/index.js";
import { notifySignupConfirmation } from "./authEmail.service.js";

const DEFAULT_OAUTH_USER_TYPE = "individual";

const splitDisplayName = (displayName) => {
  const parts = String(displayName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

const ensureIndividualProfile = async (client, userId, profile) => {
  const existing = await client.query(
    "SELECT id FROM individual_profiles WHERE user_id = $1",
    [userId],
  );

  if (existing.rowCount > 0) {
    return;
  }

  const { firstName, lastName, displayName } = profile;
  const resolvedDisplayName =
    displayName || [firstName, lastName].filter(Boolean).join(" ").trim() || null;

  await client.query(
    `INSERT INTO individual_profiles (user_id, first_name, last_name, display_name)
     VALUES ($1, $2, $3, $4)`,
    [userId, firstName || null, lastName || null, resolvedDisplayName],
  );
};

export const findOrCreateOAuthUser = async ({
  provider,
  subject,
  email,
  emailVerified,
  firstName,
  lastName,
  displayName,
}) => {
  const bySubject = await query(
    `SELECT id, user_type, email, password_hash, auth_provider, is_email_verified, is_active, created_at, updated_at
     FROM users
     WHERE auth_provider = $1 AND oauth_subject = $2`,
    [provider, subject],
  );

  if (bySubject.rowCount > 0) {
    return { user: bySubject.rows[0], isNewUser: false };
  }

  if (!email) {
    const error = new Error("EMAIL_REQUIRED");
    error.code = "EMAIL_REQUIRED";
    throw error;
  }

  const byEmail = await query(
    `SELECT id, user_type, email, password_hash, auth_provider, is_email_verified, is_active, created_at, updated_at
     FROM users
     WHERE email = $1`,
    [email],
  );

  if (byEmail.rowCount > 0) {
    const existing = byEmail.rows[0];

    if (existing.auth_provider === provider) {
      await query(
        `UPDATE users
         SET oauth_subject = $1, updated_at = NOW()
         WHERE id = $2 AND oauth_subject IS NULL`,
        [subject, existing.id],
      );
      return { user: existing, isNewUser: false };
    }

    const error = new Error("EMAIL_ALREADY_REGISTERED");
    error.code = "EMAIL_ALREADY_REGISTERED";
    throw error;
  }

  const client = await getClient();
  const nameParts = splitDisplayName(displayName);
  const resolvedFirstName = firstName || nameParts.firstName;
  const resolvedLastName = lastName || nameParts.lastName;

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `INSERT INTO users (
         user_type, email, password_hash, auth_provider, oauth_subject,
         is_email_verified, is_active, created_at, updated_at
       )
       VALUES ($1, $2, NULL, $3, $4, $5, true, NOW(), NOW())
       RETURNING id, user_type, email, password_hash, auth_provider, is_email_verified, is_active, created_at, updated_at`,
      [
        DEFAULT_OAUTH_USER_TYPE,
        email,
        provider,
        subject,
        emailVerified,
      ],
    );

    const user = userResult.rows[0];

    await ensureIndividualProfile(client, user.id, {
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      displayName,
    });

    await client.query("COMMIT");

    // OAuth accounts that already verified email can get the welcome confirmation immediately
    if (emailVerified) {
      void notifySignupConfirmation(user.id);
    }

    return { user, isNewUser: true };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

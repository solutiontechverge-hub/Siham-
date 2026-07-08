import { query } from "../db/index.js";
import { notifyContactAcknowledgment, notifyContactReply } from "./authEmail.service.js";

export const submitContactMessage = async (userId, payload) => {
  const { persona, name, email, subject, message } = payload;

  const result = await query(
    `INSERT INTO contact_messages (user_id, persona, name, email, subject, message)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, persona, name, email, subject, message],
  );

  const row = result.rows[0];
  void notifyContactAcknowledgment(userId, { name, subject });

  const supportEmail = process.env.CONTACT_SUPPORT_EMAIL || process.env.SMTP_FROM;
  if (supportEmail) {
    const { sendMail } = await import("../helpers/email.helper.js");
    void sendMail({
      to: supportEmail,
      subject: `[Contact Us] ${subject}`,
      text: `From: ${name} <${email}>\nPersona: ${persona}\n\n${message}`,
      html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p><strong>Persona:</strong> ${persona}</p><p>${message}</p>`,
    });
  }

  return row;
};

export const replyToContactMessage = async (messageId, replyMessage) => {
  const result = await query(
    `UPDATE contact_messages
     SET status = 'replied',
         reply_message = $2,
         replied_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [messageId, replyMessage],
  );

  if (!result.rows.length) {
    return { replied: false, reason: "message_not_found" };
  }

  const row = result.rows[0];
  await notifyContactReply(row.user_id, {
    name: row.name,
    subject: row.subject,
    replyMessage,
  });

  return { replied: true, message: row };
};

export const listContactMessages = async (userId) => {
  const result = await query(
    `SELECT id, persona, name, email, subject, message, status, reply_message, replied_at, created_at
     FROM contact_messages
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
};

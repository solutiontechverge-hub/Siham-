import "../bootstrap-env.js";
import { getClient } from "../db/index.js";

const client = await getClient();
try {
  const summary = await client.query(`
    WITH cards AS (
      SELECT scm.*,
             b.id::text AS booking_uuid,
             b.unique_code AS booking_code
      FROM sales_card_metadata scm
      LEFT JOIN bookings b
        ON b.id::text = scm.booking_id OR b.unique_code = scm.booking_id
    ),
    finance AS (
      SELECT ft.*,
             b.id::text AS booking_uuid,
             b.unique_code AS booking_code
      FROM finance_transactions ft
      LEFT JOIN bookings b
        ON b.id::text = ft.booking_id OR b.unique_code = ft.booking_id
      WHERE NULLIF(ft.booking_id, '') IS NOT NULL
        AND ft.document IS NOT NULL
    ),
    cards_matchable AS (
      SELECT DISTINCT ON (c.id) c.id AS card_id, f.id AS tx_id
      FROM cards c
      JOIN finance f
        ON (c.booking_uuid IS NOT NULL AND c.booking_uuid = f.booking_uuid)
        OR (c.booking_id = f.booking_id)
        OR (c.booking_code IS NOT NULL AND c.booking_code = f.booking_id)
        OR (f.booking_code IS NOT NULL AND f.booking_code = c.booking_id)
      WHERE (
        (c.card_kind = 'prepayment' AND f.document->>'paymentPhase' = 'prepay')
        OR (c.card_kind IN ('after_treatment','reissued_invoice')
            AND COALESCE(f.document->>'paymentPhase','full') IN ('full',''))
        OR (c.card_kind = 'addon' AND f.document->>'paymentPhase' = 'addon')
      )
      ORDER BY c.id, f.updated_at DESC NULLS LAST
    )
    SELECT
      (SELECT COUNT(*)::int FROM sales_card_metadata) AS cards_total,
      (SELECT COUNT(*)::int FROM finance) AS finance_total,
      (SELECT COUNT(*)::int FROM sales_card_metadata WHERE finance_transaction_id IS NOT NULL) AS cards_with_fk,
      (SELECT COUNT(*)::int FROM sales_card_metadata WHERE finance_transaction_id IS NULL) AS cards_null_fk,
      (SELECT COUNT(*)::int FROM sales_card_metadata scm
        LEFT JOIN finance_transactions ft ON ft.id = scm.finance_transaction_id
       WHERE scm.finance_transaction_id IS NOT NULL AND ft.id IS NULL) AS broken_fk,
      (SELECT COUNT(*)::int FROM cards c
        WHERE NOT EXISTS (SELECT 1 FROM cards_matchable m WHERE m.card_id = c.id)) AS cards_no_logical_match,
      (SELECT COUNT(*)::int FROM finance f
        WHERE NOT EXISTS (SELECT 1 FROM cards_matchable m WHERE m.tx_id = f.id)) AS finance_no_logical_match,
      (SELECT COUNT(*)::int FROM cards c
        WHERE c.finance_transaction_id IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM finance f
            WHERE f.booking_id = c.booking_id
              AND (
                (c.card_kind = 'prepayment' AND f.document->>'paymentPhase' = 'prepay')
                OR (c.card_kind IN ('after_treatment','reissued_invoice')
                    AND COALESCE(f.document->>'paymentPhase','full') IN ('full',''))
                OR (c.card_kind = 'addon' AND f.document->>'paymentPhase' = 'addon')
              )
          )
          AND EXISTS (SELECT 1 FROM cards_matchable m WHERE m.card_id = c.id)
      ) AS orphans_due_to_uuid_vs_code
  `);
  console.log("SUMMARY", JSON.stringify(summary.rows[0], null, 2));

  const cardForms = await client.query(`
    SELECT
      COUNT(*) FILTER (WHERE booking_id ~ '^[0-9a-f-]{36}$')::int AS uuid_form,
      COUNT(*) FILTER (WHERE booking_id !~ '^[0-9a-f-]{36}$')::int AS code_form
    FROM sales_card_metadata
  `);
  const finForms = await client.query(`
    SELECT
      COUNT(*) FILTER (WHERE booking_id ~ '^[0-9a-f-]{36}$')::int AS uuid_form,
      COUNT(*) FILTER (WHERE booking_id !~ '^[0-9a-f-]{36}$' AND NULLIF(booking_id,'') IS NOT NULL)::int AS code_form
    FROM finance_transactions
  `);
  console.log("CARD_BOOKING_ID_FORMS", JSON.stringify(cardForms.rows[0]));
  console.log("FINANCE_BOOKING_ID_FORMS", JSON.stringify(finForms.rows[0]));

  const nullFk = await client.query(`
    SELECT scm.card_id, scm.booking_id AS card_booking_id, scm.card_kind,
           b.id::text AS booking_uuid, b.unique_code,
           (
             SELECT ft.booking_id FROM finance_transactions ft
             LEFT JOIN bookings b2 ON b2.id::text = ft.booking_id OR b2.unique_code = ft.booking_id
             WHERE (b.id IS NOT NULL AND (ft.booking_id = b.id::text OR ft.booking_id = b.unique_code))
                OR ft.booking_id = scm.booking_id
             ORDER BY ft.updated_at DESC NULLS LAST
             LIMIT 1
           ) AS nearest_finance_booking_id
    FROM sales_card_metadata scm
    LEFT JOIN bookings b ON b.id::text = scm.booking_id OR b.unique_code = scm.booking_id
    WHERE scm.finance_transaction_id IS NULL
    ORDER BY scm.updated_at DESC
    LIMIT 20
  `);
  console.log("NULL_FK_SAMPLES", JSON.stringify(nullFk.rows, null, 2));

  const exactScriptStyle = await client.query(`
    WITH cards AS (SELECT * FROM sales_card_metadata),
    rows AS (
      SELECT * FROM finance_transactions
      WHERE NULLIF(booking_id, '') IS NOT NULL AND document IS NOT NULL
    ),
    used AS (
      SELECT finance_transaction_id::text AS id
      FROM sales_card_metadata
      WHERE finance_transaction_id IS NOT NULL
    ),
    matched AS (
      SELECT c.id AS card_id, r.id AS tx_id
      FROM cards c
      JOIN rows r ON r.booking_id = c.booking_id
      WHERE c.finance_transaction_id IS NULL
        AND r.id::text NOT IN (SELECT id FROM used)
        AND (
          (c.card_kind = 'prepayment' AND r.document->>'paymentPhase' = 'prepay')
          OR (c.card_kind IN ('after_treatment','reissued_invoice')
              AND COALESCE(r.document->>'paymentPhase','full') IN ('full',''))
          OR (c.card_kind = 'addon' AND r.document->>'paymentPhase' = 'addon')
        )
    )
    SELECT
      (SELECT COUNT(*)::int FROM cards WHERE finance_transaction_id IS NULL) AS unlinked_cards,
      (SELECT COUNT(*)::int FROM rows r WHERE r.id::text NOT IN (SELECT id FROM used)
        AND NOT EXISTS (SELECT 1 FROM matched m WHERE m.tx_id = r.id)
        AND NOT EXISTS (
          SELECT 1 FROM cards c WHERE c.finance_transaction_id = r.id
        )
      ) AS unlinked_rows_exact_booking_id
  `);
  console.log("EXACT_BOOKING_ID_ORPHANS", JSON.stringify(exactScriptStyle.rows[0], null, 2));
} finally {
  await client.end();
}

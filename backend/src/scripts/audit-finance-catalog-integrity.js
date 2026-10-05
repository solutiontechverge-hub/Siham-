import "../bootstrap-env.js";
import { getClient } from "../db/index.js";

const FILLER_NAMES = ["dye", "eye makeup", "eye lashes"];
const client = await getClient();
try {
  const rows = await client.query(`
    SELECT id, status, client_name, transaction_date, document
      FROM finance_transactions
  `);
  const findings = [];
  const statusValues = new Set(["Pending", "Payment due", "Prepayment due", "Paid", "Prepaid", "Refunded", "Overdue", "Voided", "Failed"]);

  for (const row of rows.rows) {
    if (!statusValues.has(String(row.status ?? ""))) findings.push({ type: "invalid_status", id: row.id, status: row.status });
    if (!String(row.client_name ?? "").trim()) findings.push({ type: "missing_client_name", id: row.id });
    if (row.transaction_date && Number.isNaN(new Date(row.transaction_date).getTime())) findings.push({ type: "invalid_transaction_date", id: row.id });
    const lines = Array.isArray(row.document?.lineItems) ? row.document.lineItems : [];
    for (const line of lines) {
      const name = String(line?.description ?? line?.name ?? "").trim().toLowerCase();
      if (FILLER_NAMES.includes(name) && !String(line?.sourceReference ?? "").trim()) {
        findings.push({ type: "orphan_filler_line", id: row.id, description: line.description });
      }
    }
  }

  const catalogTables = await client.query(`
    SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('products', 'subcategories', 'finance_products', 'sales_addons')
  `);
  const catalogCounts = {};
  for (const { table_name: table } of catalogTables.rows) {
    const count = await client.query(`SELECT COUNT(*)::int AS count FROM "${table}"`);
    catalogCounts[table] = count.rows[0].count;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totalTransactions: rows.rowCount,
    catalogTables: catalogCounts,
    fillerNamesBlocked: FILLER_NAMES,
    findings: findings.reduce((out, item) => {
      out[item.type] = (out[item.type] ?? 0) + 1;
      return out;
    }, {}),
    ok: findings.length === 0,
    details: findings,
  };
  console.log(JSON.stringify(report, null, 2));
  if (process.argv.includes("--strict") && findings.length) process.exitCode = 1;
} finally {
  await client.end();
}

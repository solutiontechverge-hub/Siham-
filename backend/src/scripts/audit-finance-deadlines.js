import "../bootstrap-env.js";
import { getClient } from "../db/index.js";

// Read-only audit. Use --strict in CI when findings should fail the command.
const client = await getClient();
try {
  const result = await client.query(`
    SELECT id, status, payment_deadline, transaction_date, created_at,
           document->>'dueDate' AS snapshot_due_date
      FROM finance_transactions
  `);
  const today = new Date().toISOString().slice(0, 10);
  const openStatuses = new Set(["Pending", "Payment due", "Overdue"]);
  const terminalStatuses = new Set(["Paid", "Prepaid", "Refunded", "Voided"]);
  const findings = [];

  for (const row of result.rows) {
    const deadline = row.payment_deadline ? String(row.payment_deadline).slice(0, 10) : null;
    const snapshot = row.snapshot_due_date ? String(row.snapshot_due_date).slice(0, 10) : null;
    const status = String(row.status ?? "");

    if (!deadline) {
      findings.push({ type: "missing_deadline", id: row.id, status });
      continue;
    }
    if (snapshot && snapshot !== deadline) {
      findings.push({ type: "snapshot_mismatch", id: row.id, deadline, snapshotDueDate: snapshot });
    }
    if (openStatuses.has(status) && deadline < today && status !== "Overdue") {
      findings.push({ type: "should_be_overdue", id: row.id, status, deadline, today });
    }
    if (status === "Overdue" && deadline >= today) {
      findings.push({ type: "overdue_before_deadline", id: row.id, deadline, today });
    }
    if (terminalStatuses.has(status) && deadline < today) {
      findings.push({ type: "terminal_after_deadline", id: row.id, status, deadline });
    }
  }

  const counts = findings.reduce((out, finding) => {
    out[finding.type] = (out[finding.type] ?? 0) + 1;
    return out;
  }, {});
  const report = {
    generatedAt: new Date().toISOString(),
    asOfDate: today,
    totalTransactions: result.rowCount,
    validDeadlineCount: result.rows.filter((row) => row.payment_deadline).length,
    findings: counts,
    ok: findings.length === 0,
    details: findings,
  };
  console.log(JSON.stringify(report, null, 2));
  if (process.argv.includes("--strict") && findings.length > 0) process.exitCode = 1;
} finally {
  await client.end();
}

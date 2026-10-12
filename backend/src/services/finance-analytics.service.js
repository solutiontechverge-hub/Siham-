import { parseMoney, roundMoney } from "../utils/money.js";

/** Cap analytics pull so a runaway tenant cannot load unbounded memory. */
export const FINANCE_ANALYTICS_MAX_ROWS = 5000;

function pct(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function lineCategory(line) {
  const type = String(line?.sourceType || "").toLowerCase();
  if (type === "productid" || type === "product") return "Products";
  if (type === "uniqueitemcode" || type === "uniqueitem") return "Unique items";
  if (type === "serviceid" || type === "service") return "Services";
  return "Services";
}

function isOnlineEntry(row) {
  return String(row.entry_type || "").toLowerCase() === "onlinebooking";
}

function channelLabel(row) {
  const entry = String(row.entry_type || "").toLowerCase();
  const method = `${row.method_title || ""} ${row.method_detail || ""}`.toLowerCase();
  const online = entry === "onlinebooking";
  const direct =
    method.includes("direct") && !method.includes("non") && !method.includes("invoice");
  if (online && direct) return "Online Direct";
  if (online) return "Online Non-Direct";
  if (direct) return "Offline Direct";
  return "Offline Non-Direct";
}

/**
 * Aggregate finance_transactions rows into analytics-friendly totals.
 * Money values are always numbers (never formatted currency strings).
 */
export function aggregateFinanceAnalytics(rows) {
  const productMap = new Map();
  const categoryMap = new Map();
  const channelCounts = new Map();
  let onlineCount = 0;
  let offlineCount = 0;
  let onlineSales = 0;
  let offlineSales = 0;
  let refunds = 0;
  let lateFees = 0;
  let uniqueItemSales = 0;
  let serviceSales = 0;
  let productSales = 0;
  let unpaidNotDue = { count: 0, value: 0 };
  let overdue = { count: 0, value: 0 };
  let paidOnTime = { count: 0, value: 0 };
  let paidLate = { count: 0, value: 0 };
  let gross = 0;

  for (const row of rows) {
    const amount = roundMoney(row.net_amount ?? row.netAmount);
    const grossAmount = roundMoney(row.gross_amount ?? row.grossAmount ?? amount);
    const status = String(row.status || "").toLowerCase();
    const document = row.document || row.issued_document || {};
    const channel = channelLabel(row);
    channelCounts.set(channel, (channelCounts.get(channel) || 0) + 1);

    if (status.includes("refund")) {
      gross += grossAmount;
      refunds += Math.abs(
        parseMoney(
          document.refundAmount ?? row.refund_amount ?? amount,
          amount,
        ),
      );
      continue;
    }
    if (status.includes("void") || status.includes("cancel")) continue;

    if (status.includes("overdue")) {
      overdue.count += 1;
      overdue.value += amount;
      continue;
    }
    if (
      status.includes("unpaid") ||
      status.includes("pending") ||
      status.includes("payment due")
    ) {
      unpaidNotDue.count += 1;
      unpaidNotDue.value += amount;
      continue;
    }

    gross += grossAmount;
    if (status.includes("paid") && String(row.status_detail || "").toLowerCase().includes("late")) {
      paidLate.count += 1;
      paidLate.value += amount;
    } else if (status.includes("paid") || status.includes("prepaid")) {
      paidOnTime.count += 1;
      paidOnTime.value += amount;
    }

    if (isOnlineEntry(row)) {
      onlineCount += 1;
      onlineSales += amount;
    } else {
      offlineCount += 1;
      offlineSales += amount;
    }

    const lines = Array.isArray(document.lineItems) ? document.lineItems : [];
    if (!lines.length) {
      const key = row.entry_label || row.entryLabel || "Sale";
      const prev = productMap.get(key) || { count: 0, sales: 0 };
      productMap.set(key, { count: prev.count + 1, sales: prev.sales + amount });
      serviceSales += amount;
      continue;
    }

    for (const line of lines) {
      const name = line.description || "Item";
      const qty = Number(line.quantity) || 1;
      const lineSales = roundMoney(line.totalPrice ?? line.pricePerUnit) || amount;
      const category = lineCategory(line);

      if (category === "Products") productSales += lineSales;
      else if (category === "Unique items") uniqueItemSales += lineSales;
      else serviceSales += lineSales;

      if (String(name).toLowerCase().includes("fee")) {
        lateFees += lineSales;
      }

      const prev = productMap.get(name) || { count: 0, sales: 0 };
      productMap.set(name, { count: prev.count + qty, sales: prev.sales + lineSales });

      if (!categoryMap.has(category)) categoryMap.set(category, new Map());
      const serviceMap = categoryMap.get(category);
      const servicePrev = serviceMap.get(name) || { count: 0, sales: 0 };
      serviceMap.set(name, {
        count: servicePrev.count + qty,
        sales: servicePrev.sales + lineSales,
      });
    }
  }

  const productTotalSales = [...productMap.values()].reduce((sum, item) => sum + item.sales, 0);
  const productDenom = productTotalSales || 1;
  const productRows = [
    ...[...productMap.entries()].map(([product, stats]) => ({
      product,
      count: stats.count,
      salesEur: roundMoney(stats.sales),
      sharePct: pct(stats.sales, productDenom),
    })),
    {
      product: "Total",
      count: [...productMap.values()].reduce((sum, item) => sum + item.count, 0),
      salesEur: roundMoney(productTotalSales),
      sharePct: 100,
      isTotal: true,
    },
  ];

  const categoryRows = [];
  let categoryGrand = 0;
  for (const [category, services] of categoryMap.entries()) {
    const entries = [...services.entries()];
    const catTotal = entries.reduce((sum, [, s]) => sum + s.sales, 0);
    categoryGrand += catTotal;
    entries.forEach(([service, stats], index) => {
      categoryRows.push({
        category,
        service,
        count: stats.count,
        netSalesEur: roundMoney(stats.sales),
        sharePct: pct(stats.sales, catTotal || 1),
        hideCategoryCell: index > 0,
      });
    });
    categoryRows.push({
      category,
      service: "Category total",
      count: entries.reduce((sum, [, s]) => sum + s.count, 0),
      netSalesEur: roundMoney(catTotal),
      sharePct: 100,
      isCategoryTotal: true,
    });
  }
  if (categoryRows.length) {
    categoryRows.push({
      category: "Grand total",
      service: "",
      count: categoryRows
        .filter((row) => row.isCategoryTotal)
        .reduce((sum, row) => sum + row.count, 0),
      netSalesEur: roundMoney(categoryGrand),
      sharePct: 100,
      isGrandTotal: true,
    });
  }

  const categoryBars = [...categoryMap.entries()].map(([category, services]) => {
    const segments = [...services.entries()].map(([service, stats]) => ({
      service,
      salesEur: roundMoney(stats.sales),
      shareWithinBarPct: pct(stats.sales, categoryGrand || 1),
    }));
    const totalSalesEur = segments.reduce((sum, segment) => sum + segment.salesEur, 0);
    return {
      category,
      segments,
      totalSalesEur,
      totalSharePct: pct(totalSalesEur, categoryGrand || 1),
    };
  });

  const legend = categoryBars.map((bar) => ({
    category: bar.category,
    items: bar.segments.map((segment, index) => ({
      label: segment.service,
      colorIndex: index,
    })),
  }));

  const salesOriginTotal = onlineSales + offlineSales || 1;
  const channelTotal = [...channelCounts.values()].reduce((sum, n) => sum + n, 0) || 1;
  const channelRows = [...channelCounts.entries()].map(([channel, count]) => ({
    channel,
    count,
    sharePct: pct(count, channelTotal),
  }));
  channelRows.push({
    channel: "Total",
    count: [...channelCounts.values()].reduce((sum, n) => sum + n, 0),
    sharePct: 100,
    isTotal: true,
  });

  const net = roundMoney(gross - refunds);

  return {
    productSales: {
      rows: productRows,
      chartMaxEur: Math.max(...productRows.map((row) => row.salesEur), 1),
    },
    salesByCategoriesAndServices: {
      rows: categoryRows,
      categoryBars,
      legend,
      chartMaxEur: Math.max(...categoryBars.map((bar) => bar.totalSalesEur), 1),
    },
    refundsAndAdjustments: {
      rows: [
        {
          adjustmentType: "Refunds",
          amountEur: roundMoney(refunds),
          shareOfGrossSalesPct: pct(refunds, gross || 1),
        },
        ...(lateFees
          ? [
              {
                adjustmentType: "Fees collected",
                amountEur: roundMoney(lateFees),
                shareOfGrossSalesPct: pct(lateFees, gross || 1),
              },
            ]
          : []),
        ...(uniqueItemSales
          ? [
              {
                adjustmentType: "Extra charges (unique items)",
                amountEur: roundMoney(uniqueItemSales),
                shareOfGrossSalesPct: pct(uniqueItemSales, gross || 1),
              },
            ]
          : []),
      ],
    },
    unpaidInvoicesAndFeeCompliance: {
      rows: [
        {
          invoiceStatus: "Paid on time",
          count: paidOnTime.count,
          valueEur: roundMoney(paidOnTime.value),
        },
        {
          invoiceStatus: "Paid late",
          count: paidLate.count,
          valueEur: roundMoney(paidLate.value),
        },
        {
          invoiceStatus: "Unpaid (not yet due)",
          count: unpaidNotDue.count,
          valueEur: roundMoney(unpaidNotDue.value),
        },
        {
          invoiceStatus: "Overdue (past due date)",
          count: overdue.count,
          valueEur: roundMoney(overdue.value),
        },
      ],
    },
    netSalesOverview: {
      rows: [
        { metric: "Net service sales", amountEur: roundMoney(serviceSales) },
        { metric: "Net product sales", amountEur: roundMoney(productSales) },
        { metric: "Extra charges (unique items)", amountEur: roundMoney(uniqueItemSales) },
        {
          metric: "Subtotal before adjustments",
          amountEur: roundMoney(serviceSales + productSales + uniqueItemSales),
        },
        { metric: "Refunds issued", amountEur: roundMoney(refunds) },
        {
          metric: "Unpaid invoices (not yet due)",
          amountEur: roundMoney(unpaidNotDue.value),
        },
        { metric: "Overdue invoices", amountEur: roundMoney(overdue.value) },
        { metric: "Final net sales", amountEur: net },
      ],
    },
    salesByBookingOrigin: {
      rows: [
        {
          bookingOrigin: "Online",
          count: onlineCount,
          salesEur: roundMoney(onlineSales),
          sharePct: pct(onlineSales, salesOriginTotal),
        },
        {
          bookingOrigin: "Offline / Manual",
          count: offlineCount,
          salesEur: roundMoney(offlineSales),
          sharePct: pct(offlineSales, salesOriginTotal),
        },
        {
          bookingOrigin: "Total",
          count: onlineCount + offlineCount,
          salesEur: roundMoney(onlineSales + offlineSales),
          sharePct: 100,
          isTotal: true,
        },
      ],
    },
    transactionSummary: {
      rows: channelRows,
    },
    totals: {
      gross: roundMoney(gross),
      refunds: roundMoney(refunds),
      net,
      transactionCount: rows.length,
    },
  };
}

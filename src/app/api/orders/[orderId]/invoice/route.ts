import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { renderToBuffer, Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import React from "react";
import { canAccessOrder } from "@/lib/apiAuth";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12, color: "#1A1A2E", fontFamily: "Helvetica" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 5, color: "#FF6B4A" },
  subHeader: { fontSize: 10, color: "#6B7280", marginBottom: 20 },
  divider: { borderBottom: "1px solid #E5E7EB", marginVertical: 15 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  bold: { fontWeight: "bold" },
  footer: { marginTop: 30, textAlign: "center", fontSize: 10, color: "#9CA3AF" },
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      cafe: true,
      orderItems: {
        include: { menuItem: true },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!(await canAccessOrder(order))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const InvoiceDocument = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(Text, { style: styles.header }, order.cafe.name),
      React.createElement(Text, { style: styles.subHeader }, `Order ID: ${order.id}`),
      React.createElement(Text, { style: styles.subHeader }, `Date: ${new Date(order.createdAt).toLocaleString()}`),
      React.createElement(View, { style: styles.divider }),
      React.createElement(
        View,
        { style: styles.row },
        React.createElement(Text, { style: styles.bold }, "Item"),
        React.createElement(Text, { style: styles.bold }, "Qty"),
        React.createElement(Text, { style: styles.bold }, "Amount")
      ),
      React.createElement(View, { style: styles.divider }),
      ...order.orderItems.map((item) =>
        React.createElement(
          View,
          { style: styles.row, key: item.id },
          React.createElement(Text, null, item.menuItem.name),
          React.createElement(Text, null, item.quantity.toString()),
          React.createElement(Text, null, `Rs ${(item.price / 100).toFixed(2)}`)
        )
      ),
      React.createElement(View, { style: styles.divider }),
      React.createElement(
        View,
        { style: styles.row },
        React.createElement(Text, { style: styles.bold }, "Total Amount"),
        React.createElement(Text, { style: styles.bold }, `Rs ${(order.totalAmount / 100).toFixed(2)}`)
      ),
      React.createElement(Text, { style: { marginTop: 10 } }, `Payment Method: ${order.paymentMethod}`),
      React.createElement(Text, { style: styles.footer }, "Thank you for your business!")
    )
  );

  const buffer = await renderToBuffer(InvoiceDocument);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice_${order.id.slice(0, 8)}.pdf"`,
    },
  });
}

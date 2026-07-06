import QRCode from 'qrcode';
import { renderToBuffer, Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import React from 'react';

const styles = StyleSheet.create({
  page: { flexDirection: 'column', backgroundColor: '#FFFFFF', padding: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '30%',
    border: '1 solid #E5E7EB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  cafeName: { fontSize: 10, fontWeight: 'bold', marginBottom: 4, textAlign: 'center', color: '#1A1A2E' },
  tableNum: { fontSize: 14, fontWeight: 'bold', color: '#FF6B4A', marginBottom: 8 },
  qrImage: { width: 80, height: 80 },
  scanText: { fontSize: 8, color: '#6B7280', marginTop: 4 },
  url: { fontSize: 7, color: '#9CA3AF', marginTop: 2 },
  header: { textAlign: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FF6B4A' },
  headerSub: { fontSize: 10, color: '#6B7280', marginTop: 2 },
});

export async function generateTableQRPack(
  cafeId: string,
  tablesCount: number,
  cafeName: string = 'Cafe',
  slug: string = cafeId,
  baseUrl: string = process.env.NEXT_PUBLIC_ROOT_DOMAIN ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}` : 'https://regulr.in'
): Promise<Buffer> {
  // Generate QR code data URLs for each table
  const tableQRs: { table: number; dataUrl: string; url: string }[] = [];

  // Path-based storefront URL so the QR works on any host (e.g. *.vercel.app)
  // without requiring per-cafe subdomains.
  const origin = baseUrl.replace(/\/$/, '');
  for (let table = 1; table <= tablesCount; table++) {
    const url = `${origin}/store/${slug}?table=${table}`;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      color: { dark: '#1A1A2E', light: '#FFFFFF' },
    });
    tableQRs.push({ table, dataUrl, url });
  }

  const QRPackDocument = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.headerTitle }, cafeName),
        React.createElement(Text, { style: styles.headerSub }, 'Table QR Codes — Scan to order')
      ),
      React.createElement(
        View,
        { style: styles.grid },
        ...tableQRs.map(({ table, dataUrl, url }) =>
          React.createElement(
            View,
            { style: styles.card, key: table },
            React.createElement(Text, { style: styles.cafeName }, cafeName),
            React.createElement(Text, { style: styles.tableNum }, `Table ${table}`),
            React.createElement(Image, { style: styles.qrImage, src: dataUrl }),
            React.createElement(Text, { style: styles.scanText }, 'Scan to order'),
            React.createElement(Text, { style: styles.url }, url)
          )
        )
      )
    )
  );

  const buffer = await renderToBuffer(QRPackDocument);
  return Buffer.from(buffer);
}

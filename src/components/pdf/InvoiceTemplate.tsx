import React from 'react'
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { BusinessInfo, IncomePrintData, LineItem } from '@/lib/pdf-generator'

const MM_TO_PT = 72 / 25.4
const mmToPt = (mm: number) => mm * MM_TO_PT

function formatCurrency(num?: number) {
  const n = typeof num === 'number' ? num : 0
  return `Rp ${new Intl.NumberFormat('id-ID').format(n)}`
}

function formatDateId(value?: string) {
  const d = value ? new Date(value) : new Date()
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

function computeSubtotal(items: LineItem[]) {
  return items.reduce((acc, it) => acc + (typeof it.subtotal === 'number' ? it.subtotal : 0), 0)
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    paddingTop: mmToPt(20),
    paddingBottom: mmToPt(20),
    paddingLeft: mmToPt(20),
    paddingRight: mmToPt(20),
    fontSize: 10,
    color: '#111827'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  brandBlock: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center'
  },
  logo: {
    width: 44,
    height: 44,
    objectFit: 'contain'
  },
  businessName: {
    fontSize: 14,
    fontWeight: 700
  },
  businessMeta: {
    fontSize: 9,
    color: '#374151'
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1088ff',
    textAlign: 'right'
  },
  invoiceMeta: {
    fontSize: 9,
    color: '#374151',
    textAlign: 'right'
  },
  sectionRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  box: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 10,
    flexGrow: 1
  },
  boxTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 6
  },
  table: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#d1d5db'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db'
  },
  tr: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  th: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontWeight: 700,
    fontSize: 9
  },
  td: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 9
  },
  colNo: { width: '6%' },
  colDesc: { width: '44%' },
  colQty: { width: '12%', textAlign: 'center' },
  colUnit: { width: '12%', textAlign: 'center' },
  colPrice: { width: '13%', textAlign: 'right' },
  colTotal: { width: '13%', textAlign: 'right' },
  totalsWrap: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  totalsBox: {
    width: '55%'
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  totalsDivider: {
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    marginTop: 6,
    paddingTop: 6
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 700
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 700
  },
  notes: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10
  },
  footer: {
    marginTop: 18,
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center'
  }
})

export function InvoiceTemplate(props: { business: BusinessInfo; data: IncomePrintData }) {
  const { business, data } = props

  const invoiceNo = data.invoice_number || (data.id ? `INV-${data.id.slice(0, 8).toUpperCase()}` : 'INV')
  const items = data.items || []
  const subtotal = computeSubtotal(items)
  const total = typeof data.grand_total === 'number' ? data.grand_total : subtotal

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.brandBlock}>
            {business.logoUrl ? <Image style={styles.logo} src={business.logoUrl} /> : null}
            <View>
              <Text style={styles.businessName}>{business.name || 'Katalara'}</Text>
              {business.address ? <Text style={styles.businessMeta}>{business.address}</Text> : null}
              {business.phone ? <Text style={styles.businessMeta}>{business.phone}</Text> : null}
              {business.email ? <Text style={styles.businessMeta}>{business.email}</Text> : null}
            </View>
          </View>

          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceMeta}>Nomor: {invoiceNo}</Text>
            <Text style={styles.invoiceMeta}>Tanggal: {formatDateId(data.income_date)}</Text>
            {data.due_date ? <Text style={styles.invoiceMeta}>Jatuh Tempo: {formatDateId(data.due_date)}</Text> : null}
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Tagihan Kepada</Text>
            <Text>{data.customer_name || 'Pelanggan Umum'}</Text>
            {data.customer_phone ? <Text style={styles.businessMeta}>WhatsApp: {data.customer_phone}</Text> : null}
          </View>

          <View style={styles.box}>
            <Text style={styles.boxTitle}>Info Pembayaran</Text>
            {data.payment_method ? <Text>Metode: {data.payment_method}</Text> : <Text>Metode: -</Text>}
            {data.payment_status ? <Text>Status: {data.payment_status}</Text> : <Text>Status: -</Text>}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colNo]}>No</Text>
            <Text style={[styles.th, styles.colDesc]}>Deskripsi</Text>
            <Text style={[styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.th, styles.colUnit]}>Satuan</Text>
            <Text style={[styles.th, styles.colPrice]}>Harga</Text>
            <Text style={[styles.th, styles.colTotal]}>Jumlah</Text>
          </View>

          {items.map((it, idx) => (
            <View key={`${idx}-${it.product_name}`} style={styles.tr}>
              <Text style={[styles.td, styles.colNo]}>{idx + 1}</Text>
              <Text style={[styles.td, styles.colDesc]}>{it.product_name}</Text>
              <Text style={[styles.td, styles.colQty]}>{it.quantity}</Text>
              <Text style={[styles.td, styles.colUnit]}>{it.unit || 'pcs'}</Text>
              <Text style={[styles.td, styles.colPrice]}>{new Intl.NumberFormat('id-ID').format(it.price)}</Text>
              <Text style={[styles.td, styles.colTotal]}>{new Intl.NumberFormat('id-ID').format(it.subtotal)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsWrap}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text>Subtotal</Text>
              <Text>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={[styles.totalsRow, styles.totalsDivider]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>
        </View>

        {data.notes ? (
          <View style={styles.notes}>
            <Text style={styles.boxTitle}>Catatan</Text>
            <Text>{data.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>Dokumen ini dibuat secara elektronik dan sah tanpa tanda tangan basah.</Text>
      </Page>
    </Document>
  )
}

import React from 'react'
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { BusinessInfo, IncomePrintData } from '@/lib/pdf-generator'

const MM_TO_PT = 72 / 25.4
const mmToPt = (mm: number) => mm * MM_TO_PT

function formatDateId(value?: string) {
  const d = value ? new Date(value) : new Date()
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatTimeId(value?: string) {
  const d = value ? new Date(value) : new Date()
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function formatCurrency(num?: number) {
  const n = typeof num === 'number' ? num : 0
  return `Rp ${new Intl.NumberFormat('id-ID').format(n)}`
}

function estimateHeightPt(itemCount: number) {
  // Rough sizing: base + per-item lines.
  // Receipt content should stay readable; oversized height is OK (thermal).
  const baseMm = 140
  const perItemMm = 10
  return mmToPt(baseMm + perItemMm * Math.max(1, itemCount))
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Courier',
    padding: 10,
    lineHeight: 1.2
  },
  headerTitle: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 700
  },
  headerSmall: {
    fontSize: 8,
    textAlign: 'center',
    color: '#111827'
  },
  body: {
    fontSize: 10
  },
  small: {
    fontSize: 8
  },
  divider: {
    fontSize: 8,
    textAlign: 'center',
    marginVertical: 6
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  colLeft: {
    flexGrow: 1,
    paddingRight: 8
  },
  colRight: {
    width: 90,
    textAlign: 'right'
  },
  itemName: {
    fontSize: 10,
    fontWeight: 700
  },
  itemMeta: {
    fontSize: 8,
    color: '#111827'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4
  },
  footer: {
    marginTop: 8,
    fontSize: 8,
    textAlign: 'center'
  }
})

export function StrukTemplate(props: { business: BusinessInfo; data: IncomePrintData }) {
  const { business, data } = props

  const widthPt = mmToPt(80)
  const heightPt = estimateHeightPt(data.items?.length || 1)

  const invoiceNo = data.invoice_number || (data.id ? `TR${data.id.slice(0, 8).toUpperCase()}` : 'N/A')
  const status = (data.payment_status || 'Lunas').toString()

  return (
    <Document>
      <Page size={{ width: widthPt, height: heightPt }} style={styles.page}>
        <Text style={styles.headerTitle}>{(business.name || 'Katalara').toUpperCase()}</Text>
        {business.address ? <Text style={styles.headerSmall}>{business.address}</Text> : null}
        {business.phone ? <Text style={styles.headerSmall}>{business.phone}</Text> : null}

        <Text style={styles.divider}>{'='.repeat(32)}</Text>

        <View style={styles.row}>
          <Text style={styles.small}>No</Text>
          <Text style={styles.small}>{invoiceNo}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.small}>Tanggal</Text>
          <Text style={styles.small}>{formatDateId(data.income_date)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.small}>Jam</Text>
          <Text style={styles.small}>{formatTimeId(data.income_date)}</Text>
        </View>
        {data.customer_name ? (
          <View style={styles.row}>
            <Text style={styles.small}>Pelanggan</Text>
            <Text style={styles.small}>{data.customer_name}</Text>
          </View>
        ) : null}

        <Text style={styles.divider}>{'-'.repeat(32)}</Text>

        <View>
          {(data.items || []).map((it, idx) => (
            <View key={`${idx}-${it.product_name}`} style={{ marginBottom: 4 }}>
              <Text style={styles.itemName}>{it.product_name}</Text>
              <View style={styles.row}>
                <Text style={[styles.itemMeta, styles.colLeft]}>
                  {`${it.quantity} x ${new Intl.NumberFormat('id-ID').format(it.price)}`}
                </Text>
                <Text style={[styles.itemMeta, styles.colRight]}>
                  {new Intl.NumberFormat('id-ID').format(it.subtotal)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.divider}>{'-'.repeat(32)}</Text>

        <View style={styles.totalRow}>
          <Text style={styles.body}>TOTAL</Text>
          <Text style={styles.body}>{formatCurrency(data.grand_total)}</Text>
        </View>

        {data.payment_method ? (
          <View style={styles.row}>
            <Text style={styles.small}>Metode</Text>
            <Text style={styles.small}>{data.payment_method}</Text>
          </View>
        ) : null}

        <View style={styles.row}>
          <Text style={styles.small}>Status</Text>
          <Text style={styles.small}>{status}</Text>
        </View>

        {data.due_date ? (
          <View style={styles.row}>
            <Text style={styles.small}>Jatuh Tempo</Text>
            <Text style={styles.small}>{formatDateId(data.due_date)}</Text>
          </View>
        ) : null}

        {data.notes ? (
          <>
            <Text style={styles.divider}>{'-'.repeat(32)}</Text>
            <Text style={styles.small}>Catatan:</Text>
            <Text style={styles.small}>{data.notes}</Text>
          </>
        ) : null}

        <Text style={styles.divider}>{'='.repeat(32)}</Text>
        <Text style={styles.footer}>Terima kasih.</Text>
      </Page>
    </Document>
  )
}

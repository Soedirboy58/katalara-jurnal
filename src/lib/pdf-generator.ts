import React from 'react'
import { pdf } from '@react-pdf/renderer'
import { InvoiceTemplate } from '@/components/pdf/InvoiceTemplate'
import { StrukTemplate } from '@/components/pdf/StrukTemplate'

export type PrintMode = 'receipt' | 'invoice'

export type BusinessInfo = {
  name: string
  address?: string
  phone?: string
  email?: string
  logoUrl?: string
}

export type LineItem = {
  product_name: string
  quantity: number
  unit?: string
  price: number
  subtotal: number
}

export type IncomePrintData = {
  id?: string
  invoice_number?: string
  customer_name?: string
  customer_phone?: string
  income_date?: string
  payment_status?: string
  payment_method?: string
  grand_total?: number
  due_date?: string
  notes?: string
  items: LineItem[]
}

function safeString(value: unknown): string {
  if (value == null) return ''
  return String(value)
}

function safeNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

export function yyyyMmDd(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value)
  const yyyy = d.getFullYear().toString().padStart(4, '0')
  const mm = (d.getMonth() + 1).toString().padStart(2, '0')
  const dd = d.getDate().toString().padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}

export function filenameSafePart(input: string): string {
  return input
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function normalizeIncomeToPrintData(incomeData: any): IncomePrintData {
  const incomeDateValue =
    incomeData?.income_date ||
    incomeData?.transaction_date ||
    incomeData?.date ||
    incomeData?.created_at ||
    new Date().toISOString()

  const rawItems =
    incomeData?.line_items ??
    incomeData?.lineItems ??
    incomeData?.items ??
    incomeData?.transaction_items ??
    []

  let items: any[] = []
  if (Array.isArray(rawItems)) items = rawItems
  else if (typeof rawItems === 'string') {
    try {
      const parsed = JSON.parse(rawItems)
      if (Array.isArray(parsed)) items = parsed
    } catch {
      items = []
    }
  }

  const mappedItems: LineItem[] = items
    .map((it) => {
      const quantity = safeNumber(it?.quantity ?? it?.qty ?? 1)
      const price = safeNumber(it?.price_per_unit ?? it?.price ?? 0)
      const subtotal = safeNumber(it?.subtotal ?? quantity * price)
      const product_name = safeString(it?.product_name ?? it?.name ?? 'Item')
      const unit = safeString(it?.unit ?? it?.stock_unit ?? 'pcs') || 'pcs'

      return {
        product_name,
        quantity: quantity || 1,
        unit,
        price,
        subtotal
      }
    })
    .filter((x) => !!x.product_name)

  // Fallback: single-item transaction
  if (mappedItems.length === 0) {
    const productName = safeString(incomeData?.product_name ?? incomeData?.description ?? 'Transaksi')
    const quantity = safeNumber(incomeData?.quantity ?? 1) || 1
    const price = safeNumber(incomeData?.price_per_unit ?? incomeData?.price ?? incomeData?.amount ?? 0)
    const subtotal = safeNumber(incomeData?.subtotal ?? incomeData?.amount ?? quantity * price)

    mappedItems.push({
      product_name: productName,
      quantity,
      unit: 'pcs',
      price,
      subtotal
    })
  }

  return {
    id: safeString(incomeData?.id) || undefined,
    invoice_number: safeString(incomeData?.invoice_number) || undefined,
    customer_name: safeString(incomeData?.customer_name) || undefined,
    customer_phone: safeString(incomeData?.customer_phone) || undefined,
    income_date: safeString(incomeDateValue) || undefined,
    payment_status: safeString(incomeData?.payment_status ?? incomeData?.payment_status_label) || undefined,
    payment_method: safeString(incomeData?.payment_method) || undefined,
    grand_total: safeNumber(incomeData?.grand_total ?? incomeData?.amount ?? incomeData?.total),
    due_date: safeString(incomeData?.jastip_due_date ?? incomeData?.due_date) || undefined,
    notes: safeString(incomeData?.notes) || undefined,
    items: mappedItems
  }
}

export async function generateIncomePdfBlob(params: {
  mode: PrintMode
  incomeData: any
  business: BusinessInfo
}): Promise<Blob> {
  const printData = normalizeIncomeToPrintData(params.incomeData)

  const doc =
    params.mode === 'receipt'
      ? React.createElement(StrukTemplate, { business: params.business, data: printData })
      : React.createElement(InvoiceTemplate, { business: params.business, data: printData })

  return await pdf(doc).toBlob()
}

export function buildIncomePdfFilename(params: {
  mode: PrintMode
  incomeData: any
}): string {
  const d = normalizeIncomeToPrintData(params.incomeData)
  const dateStr = yyyyMmDd(d.income_date || new Date())

  if (params.mode === 'receipt') {
    const customer = filenameSafePart(d.customer_name || 'umum') || 'umum'
    return `struk-${customer}-${dateStr}.pdf`
  }

  const invoice = filenameSafePart(d.invoice_number || (d.id ? `INV-${d.id.slice(0, 8).toUpperCase()}` : 'INV'))
  return `invoice-${invoice}-${dateStr}.pdf`
}

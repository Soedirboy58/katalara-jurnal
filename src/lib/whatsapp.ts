export type WhatsAppDocumentType = 'struk' | 'invoice'

export function normalizeWhatsAppPhone(input: string): string | null {
  const raw = (input || '').trim()
  if (!raw) return null

  // Keep only digits and '+'
  let cleaned = raw.replace(/[^\d+]/g, '')

  // Convert leading 0 -> 62
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1)

  // Remove leading '+'
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1)

  // If user typed 8xxxx without 0/62, assume Indonesia
  if (cleaned.startsWith('8')) cleaned = '62' + cleaned

  // Basic sanity: must be digits only now
  if (!/^\d+$/.test(cleaned)) return null

  // WA minimum length is ~9-10, max ~15
  if (cleaned.length < 9 || cleaned.length > 16) return null

  return cleaned
}

export function buildWhatsAppUrl(params: {
  phone: string
  customerName: string
  docType: WhatsAppDocumentType
  pdfUrl: string
}): string {
  const customerName = (params.customerName || '').trim() || 'Pelanggan'
  const docLabel = params.docType === 'struk' ? 'struk' : 'invoice'

  const text = `Halo ${customerName}, berikut ${docLabel} Anda: ${params.pdfUrl}`
  return `https://wa.me/${params.phone}?text=${encodeURIComponent(text)}`
}

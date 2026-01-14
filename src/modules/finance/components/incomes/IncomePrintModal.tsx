'use client'

import { PrintDocumentModal } from '@/components/PrintDocumentModal'

interface PrintModalProps {
  isOpen: boolean
  onClose: () => void
  incomeData: any
  businessName: string
}

export function IncomePrintModal({ isOpen, onClose, incomeData, businessName }: PrintModalProps) {
  return (
    <PrintDocumentModal isOpen={isOpen} onClose={onClose} incomeData={incomeData} businessName={businessName} />
  )
}

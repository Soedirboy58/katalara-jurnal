'use client'

import { useState } from 'react'
import { CameraIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import Tesseract from 'tesseract.js'

interface ScannedItem {
  name: string
  qty: string
  price: number
}

interface ExtractedData {
  total: number
  vendor: string
  items: ScannedItem[]
  rawText: string
}

interface ReceiptScannerProps {
  onDataExtracted: (data: { total: number, notes: string }) => void
}

export function ReceiptScanner({ onDataExtracted }: ReceiptScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Scan receipt with Tesseract.js
    setScanning(true)
    setProgress(0)
    
    try {
      const result = await Tesseract.recognize(
        file,
        'ind', // Indonesian language
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100))
            }
          }
        }
      )

      const text = result.data.text
      
      // Parse text to structured data
      const parsed = parseReceiptText(text)
      setExtractedData(parsed)
      
    } catch (error) {
      console.error('OCR error:', error)
      alert('Gagal scan struk. Coba foto yang lebih jelas atau input manual.')
    } finally {
      setScanning(false)
      setProgress(0)
    }
  }

  // Smart parser untuk struk Indonesia
  const parseReceiptText = (text: string): ExtractedData => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    
    // Extract total (keyword: Total, Jumlah, TOTAL, Bayar)
    let total = 0
    const totalLine = lines.find(l => 
      /total|jumlah|bayar|grand/i.test(l) && /\d{3,}/.test(l)
    )
    
    if (totalLine) {
      // Extract angka terbesar di line tersebut
      const numbers = totalLine.match(/\d+(?:[.,]\d+)*/g) || []
      const amounts = numbers.map(n => parseInt(n.replace(/[.,]/g, '')))
      total = Math.max(...amounts, 0)
    }
    
    // Extract vendor/store name (biasanya 2-3 baris pertama, non-numeric)
    const vendor = lines.slice(0, 5)
      .find(l => l.length > 3 && l.length < 40 && !/\d{3,}/.test(l)) || ''
    
    // Extract items (heuristic: line dengan nama + angka)
    const items: ScannedItem[] = []
    
    lines.forEach(line => {
      // Skip lines yang jelas bukan item (header, footer, dll)
      if (/^(total|jumlah|bayar|tanggal|kasir|terima|kembali|no|nota)/i.test(line)) return
      
      // Pattern 1: "Beras 5kg Rp 60.000" atau "Beras 5kg 60000"
      let match = line.match(/^([a-zA-Z\s]{3,30})\s+(\d+(?:\.\d+)?(?:kg|gram|liter|l|pcs|bks|dus)?)\s+(?:Rp\s*)?(\d+(?:[.,]\d+)*)/)
      
      if (match) {
        items.push({
          name: match[1].trim(),
          qty: match[2],
          price: parseInt(match[3].replace(/[.,]/g, ''))
        })
        return
      }
      
      // Pattern 2: "Beras Rp 60.000" (tanpa qty)
      match = line.match(/^([a-zA-Z\s]{3,30})\s+(?:Rp\s*)?(\d+(?:[.,]\d+)*)/)
      
      if (match) {
        const price = parseInt(match[2].replace(/[.,]/g, ''))
        // Only add if price seems reasonable (> 1000)
        if (price > 1000) {
          items.push({
            name: match[1].trim(),
            qty: '-',
            price
          })
        }
      }
    })
    
    return { total, vendor, items, rawText: text }
  }

  const handleConfirm = () => {
    if (!extractedData) return

    // Format notes from items and vendor
    const itemsList = extractedData.items
      .map(item => `${item.name} ${item.qty !== '-' ? item.qty : ''}`.trim())
      .join(', ')
    
    const notes = extractedData.vendor 
      ? `${extractedData.vendor}\n${itemsList}`
      : itemsList

    onDataExtracted({
      total: extractedData.total,
      notes: notes || '(scan struk)'
    })

    // Reset
    setPreview(null)
    setExtractedData(null)
  }

  const handleCancel = () => {
    setPreview(null)
    setExtractedData(null)
    setScanning(false)
  }

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center gap-2">
        <label className="cursor-pointer flex-1">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
            disabled={scanning}
          />
          <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md">
            <CameraIcon className="w-5 h-5" />
            <span className="text-sm font-medium">📸 Scan Struk Belanja</span>
          </div>
        </label>
        
        {preview && !scanning && (
          <button
            onClick={handleCancel}
            className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Batal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Preview & Results */}
      {preview && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-4 space-y-4 shadow-lg">
          {/* Image Preview */}
          <div className="relative">
            <img 
              src={preview} 
              alt="Receipt preview" 
              className="w-full max-w-sm mx-auto rounded-lg shadow-md border-2 border-gray-300"
            />
            
            {/* Scanning Overlay */}
            {scanning && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
                <div className="text-white text-center space-y-3">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{progress}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">🤖 Scanning struk...</p>
                    <p className="text-xs text-gray-300 mt-1">Tesseract OCR sedang bekerja</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Extracted Data */}
          {extractedData && !scanning && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm font-bold text-gray-900">Data Terekstrak</h3>
                </div>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 shadow-md transition-all"
                >
                  ✅ Gunakan Data Ini
                </button>
              </div>

              {/* Total */}
              {extractedData.total > 0 && (
                <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                  <p className="text-xs font-medium text-gray-600 mb-1">Total Belanja:</p>
                  <p className="text-2xl font-bold text-green-600">
                    Rp {extractedData.total.toLocaleString('id-ID')}
                  </p>
                </div>
              )}

              {/* Vendor */}
              {extractedData.vendor && (
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-600">Vendor/Toko:</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{extractedData.vendor}</p>
                </div>
              )}

              {/* Items */}
              {extractedData.items.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  <div className="px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-200">
                    <p className="text-xs font-bold text-gray-700">
                      🛒 Daftar Belanjaan ({extractedData.items.length} items)
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                    {extractedData.items.map((item, i) => (
                      <div key={i} className="px-3 py-2 flex justify-between items-center text-sm hover:bg-gray-50 transition-colors">
                        <div>
                          <span className="text-gray-900 font-medium">{item.name}</span>
                          {item.qty !== '-' && (
                            <span className="text-gray-500 text-xs ml-2">({item.qty})</span>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900 ml-2">
                          Rp {item.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning if no data */}
              {extractedData.total === 0 && extractedData.items.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    ⚠️ <span className="font-semibold">Gagal mendeteksi data.</span> Coba foto yang lebih jelas atau input manual.
                  </p>
                </div>
              )}

              {/* Raw Text (Debugging) */}
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700 font-medium">
                  📋 Lihat raw text (untuk debugging)
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded-lg overflow-auto text-[10px] border border-gray-200 max-h-40">
                  {extractedData.rawText}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Info & Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-blue-900">💡 Tips untuk hasil terbaik:</p>
        <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
          <li>Pencahayaan cukup terang</li>
          <li>Struk tidak kusut atau lipat</li>
          <li>Foto tegak lurus (tidak miring)</li>
          <li>Text struk jelas terbaca</li>
        </ul>
      </div>

      {/* Beta Badge */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
          <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
          BETA - Free OCR with Tesseract.js
        </span>
      </div>
    </div>
  )
}

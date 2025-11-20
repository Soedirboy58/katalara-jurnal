# 📸 AI Receipt Scanner - Implementation Guide

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  User Upload Foto Struk                                │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend: Image Upload Component                      │
│  - Compress image (max 2MB)                            │
│  - Convert to base64 or FormData                       │
│  - Show loading spinner                                │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  API: /api/receipt-scan                                │
│  - Receive image                                        │
│  - Call AI Vision API                                   │
│  - Parse response                                       │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  AI Vision Service (Pick One):                         │
│  1. Google Cloud Vision API ⭐ (BEST)                  │
│  2. OpenAI GPT-4 Vision                                │
│  3. Tesseract.js (Free, client-side)                   │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Response: Extracted Data                              │
│  {                                                      │
│    total: 487500,                                       │
│    vendor: "Pasar Induk",                              │
│    date: "2024-01-15",                                 │
│    items: [                                             │
│      { name: "Beras", qty: "5kg", price: 60000 },     │
│      { name: "Telur", qty: "2kg", price: 40000 }      │
│    ]                                                    │
│  }                                                      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend: Preview & Confirm                           │
│  - Show extracted items in editable table              │
│  - User can add/edit/delete items                      │
│  - Confirm button → Save to batch_purchases            │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Recommended: Google Cloud Vision API

### Why?
- ✅ **Best OCR accuracy** (95%+ untuk struk Indonesia)
- ✅ **Affordable:** $1.50 per 1000 requests (free 1000/month)
- ✅ **Fast:** Response < 2 detik
- ✅ **No training needed:** Works out of box

### Setup:

1. **Enable API di Google Cloud Console**
```bash
# 1. Go to: https://console.cloud.google.com
# 2. Enable "Cloud Vision API"
# 3. Create API Key
# 4. Add to .env.local
GOOGLE_VISION_API_KEY=your_api_key_here
```

2. **API Endpoint:**

```typescript
// File: src/app/api/receipt-scan/route.ts

import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { image } = await request.json() // base64 image
    
    // Call Google Vision API
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: image }, // base64 string tanpa prefix
            features: [
              { type: 'TEXT_DETECTION' }, // Extract semua text
              { type: 'DOCUMENT_TEXT_DETECTION' } // Better for receipts
            ]
          }]
        })
      }
    )

    const data = await response.json()
    const text = data.responses[0]?.fullTextAnnotation?.text || ''
    
    // Parse text to structured data
    const parsed = parseReceiptText(text)
    
    return NextResponse.json({ success: true, data: parsed })
    
  } catch (error: any) {
    console.error('Receipt scan error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Smart parser for Indonesian receipts
function parseReceiptText(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  
  // Extract total (biasanya ada keyword "Total", "Jumlah", "TOTAL")
  const totalLine = lines.find(l => 
    /total|jumlah|bayar/i.test(l) && /\d{3,}/.test(l)
  )
  const total = totalLine ? parseInt(totalLine.match(/\d+/g)?.join('') || '0') : 0
  
  // Extract vendor/store name (usually first few lines)
  const vendor = lines.slice(0, 3).find(l => l.length > 3 && !/\d/.test(l)) || ''
  
  // Extract items (lines with product name + price)
  const items: Array<{name: string, qty: string, price: number}> = []
  
  lines.forEach(line => {
    // Pattern: "Beras 5kg Rp 60.000" atau "Telur 2kg 40000"
    const match = line.match(/^([a-zA-Z\s]+)\s+(\d+(?:\.\d+)?(?:kg|gram|liter|pcs|bks)?)\s+(?:Rp\s*)?(\d+(?:[.,]\d+)*)/)
    
    if (match) {
      items.push({
        name: match[1].trim(),
        qty: match[2],
        price: parseInt(match[3].replace(/[.,]/g, ''))
      })
    }
  })
  
  return { total, vendor, items, rawText: text }
}
```

---

## 🎨 Frontend Component

```typescript
// File: src/components/expenses/ReceiptScanner.tsx

'use client'

import { useState } from 'react'
import { CameraIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface ScannedItem {
  name: string
  qty: string
  price: number
}

interface ReceiptScannerProps {
  onDataExtracted: (data: { total: number, items: ScannedItem[], notes: string }) => void
}

export function ReceiptScanner({ onDataExtracted }: ReceiptScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<any>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Scan receipt
    setScanning(true)
    try {
      // Convert to base64
      const base64 = await fileToBase64(file)
      const base64Content = base64.split(',')[1] // Remove data:image/jpeg;base64,

      // Call API
      const response = await fetch('/api/receipt-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Content })
      })

      const result = await response.json()
      
      if (result.success) {
        setExtractedData(result.data)
      } else {
        alert('Gagal scan struk. Coba foto yang lebih jelas.')
      }
    } catch (error) {
      console.error('Scan error:', error)
      alert('Error saat scan struk')
    } finally {
      setScanning(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const handleConfirm = () => {
    if (!extractedData) return

    // Format notes from items
    const notes = extractedData.items
      .map((item: ScannedItem) => `${item.name} ${item.qty}`)
      .join(', ')

    onDataExtracted({
      total: extractedData.total,
      items: extractedData.items,
      notes: `${extractedData.vendor}\n${notes}`
    })

    // Reset
    setPreview(null)
    setExtractedData(null)
  }

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center gap-2">
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            capture="environment" // Open camera di mobile
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <CameraIcon className="w-5 h-5" />
            <span className="text-sm font-medium">📸 Scan Struk Belanja</span>
          </div>
        </label>
        
        {preview && (
          <button
            onClick={() => { setPreview(null); setExtractedData(null) }}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Preview & Results */}
      {preview && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          {/* Image Preview */}
          <div className="relative">
            <img 
              src={preview} 
              alt="Receipt preview" 
              className="w-full max-w-sm mx-auto rounded-lg shadow-md"
            />
            {scanning && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">🧠 AI sedang scan struk...</p>
                </div>
              </div>
            )}
          </div>

          {/* Extracted Data */}
          {extractedData && !scanning && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">✅ Data Terekstrak</h3>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                >
                  Gunakan Data Ini
                </button>
              </div>

              {/* Total */}
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600">Total Belanja:</p>
                <p className="text-xl font-bold text-gray-900">
                  Rp {extractedData.total.toLocaleString('id-ID')}
                </p>
              </div>

              {/* Vendor */}
              {extractedData.vendor && (
                <div className="bg-white p-2 rounded border border-gray-200">
                  <p className="text-xs text-gray-600">Vendor:</p>
                  <p className="text-sm font-medium text-gray-900">{extractedData.vendor}</p>
                </div>
              )}

              {/* Items */}
              {extractedData.items.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs font-medium text-gray-700">
                      Daftar Belanjaan ({extractedData.items.length} items)
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {extractedData.items.map((item: ScannedItem, i: number) => (
                      <div key={i} className="px-3 py-2 flex justify-between text-sm">
                        <span className="text-gray-700">{item.name} <span className="text-gray-500">({item.qty})</span></span>
                        <span className="font-medium text-gray-900">
                          Rp {item.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Text (for debugging) */}
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  Lihat raw text (debug)
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-[10px]">
                  {extractedData.rawText}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-gray-500">
        💡 Tip: Foto struk dengan pencahayaan yang bagus untuk hasil terbaik
      </p>
    </div>
  )
}
```

---

## 🎯 Integration dengan Form

Update `input-expenses/page.tsx`:

```typescript
import { ReceiptScanner } from '@/components/expenses/ReceiptScanner'

// Inside component:
const [showScanner, setShowScanner] = useState(false)

const handleReceiptData = (data: any) => {
  // Auto-fill form
  setAmount(data.total.toLocaleString('id-ID'))
  setNotes(data.notes)
  setShowScanner(false)
  
  // Optional: Auto-suggest products based on items
  if (category === 'raw_materials' && data.items.length > 0) {
    // Smart matching: "Beras" → product "Beras"
    // Show dialog: "Ketemu 3 produk di database, mau auto-link?"
  }
}

// In JSX, after category select:
{category === 'raw_materials' && (
  <ReceiptScanner onDataExtracted={handleReceiptData} />
)}
```

---

## 💰 Cost Estimation

### Google Vision API:
- **Free Tier:** 1,000 requests/month
- **After that:** $1.50 per 1,000 requests
- **Example:** 100 warung × 60 struk/month = 6,000 scans = $7.50/month

**ROI:**
- User save time: 2 min → 30 sec per input
- Accuracy: 95% vs 70% manual input
- **Worth it!**

---

## 🚀 Alternative: Tesseract.js (Free, Client-side)

```bash
npm install tesseract.js
```

```typescript
import Tesseract from 'tesseract.js'

const scanReceipt = async (imageFile: File) => {
  const { data: { text } } = await Tesseract.recognize(
    imageFile,
    'ind', // Indonesian language
    {
      logger: m => console.log(m) // Progress log
    }
  )
  
  return parseReceiptText(text)
}
```

**Pros:**
- ✅ Free (no API cost)
- ✅ Privacy (process di browser)
- ✅ Offline capable

**Cons:**
- ⚠️ Slower (5-10 detik vs 2 detik)
- ⚠️ Lower accuracy (70-80% vs 95%)
- ⚠️ Larger bundle size

---

## 📊 Comparison

| Feature | Google Vision | Tesseract.js | Manual Input |
|---------|---------------|--------------|--------------|
| **Speed** | ⭐⭐⭐ 2 sec | ⭐⭐ 5-10 sec | ⭐ 2 min |
| **Accuracy** | ⭐⭐⭐ 95% | ⭐⭐ 75% | ⭐⭐⭐ 100% |
| **Cost** | $1.50/1k | Free | Free |
| **Privacy** | Cloud | Local | Local |
| **Ease** | ⭐⭐⭐ Easy | ⭐⭐ Medium | ⭐ Hard |

---

## 🎯 Recommended Approach

**Phase 1 (NOW):** Manual input dengan notes (sudah jalan) ✅

**Phase 2 (Next):** Add Google Vision OCR
- Start dengan free tier (1000/month)
- Monitor usage & accuracy
- Collect user feedback

**Phase 3 (Future):** Advanced AI
- GPT-4 Vision untuk smart categorization
- Auto-match items ke products
- Learn from corrections

**Phase 4 (Advanced):** Voice input as alternative
- "Alexa/Siri mode" untuk input cepat
- Good for delivery drivers, non-tech users

---

## ✅ Conclusion

**Best solution:** Google Vision API karena:
1. Balance antara cost & quality
2. Easy implementation (1-2 hari)
3. Scalable (pay as you grow)
4. Proven technology

**Fallback:** Tesseract.js untuk user yang concern dengan privacy atau budget ketat

Mau saya implement Google Vision API integration sekarang? 🚀

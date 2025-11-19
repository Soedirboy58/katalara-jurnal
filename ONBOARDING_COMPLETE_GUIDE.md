# Onboarding Wizard - Complete Implementation Guide

## Current Status
✅ Step 0: Welcome screen - DONE
⚠️ Step 1-4: Placeholder - NEED TO IMPLEMENT  
✅ Step 5: Review & Complete - DONE

## What Needs to Be Added

File yang perlu dimodifikasi akan sangat besar (~1000 lines), jadi saya berikan summary implementation:

### Step 1: Business Type (Line ~215-280 in OnboardingWizard.tsx)

**Tambahkan setelah Step 0, ganti placeholder "Step 1 content will be implemented...":**

```tsx
{/* Step 1: Business Type Selection */}
{currentStep === 1 && (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-900">Apa Bisnis Anda?</h2>
    
    {/* Manual Selection */}
    <div className="space-y-3">
      {Object.values(BUSINESS_CATEGORIES).map((category) => (
        <button
          key={category}
          onClick={() => handleCategorySelect(category)}
          className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
            formData.businessCategory === category
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="font-semibold text-gray-900">{category}</div>
          <div className="text-sm text-gray-600 mt-1">
            {getCategoryExplanation(category)}
          </div>
        </button>
      ))}
    </div>

    {/* OR Divider */}
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-2 bg-white text-gray-500">ATAU</span>
      </div>
    </div>

    {/* Auto-Classify */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        💡 Tidak yakin? Jelaskan bisnis Anda:
      </label>
      <textarea
        value={formData.businessDescription || ''}
        onChange={(e) => setFormData(prev => ({ ...prev, businessDescription: e.target.value }))}
        placeholder="Contoh: Saya jual beras dan sembako di warung"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        rows={3}
      />
      <button
        onClick={handleAnalyzeDescription}
        disabled={isAnalyzing || !formData.businessDescription}
        className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isAnalyzing ? 'Menganalisis...' : 'Analisis Bisnis Saya →'}
      </button>
    </div>

    {/* Classification Result */}
    {classificationResult && classificationResult.confidence > 0.5 && (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="font-semibold text-green-900">
          🎯 Hasil: {classificationResult.category}
        </div>
        <div className="text-sm text-green-700 mt-1">
          {classificationResult.reasoning}
        </div>
        <div className="text-xs text-green-600 mt-2">
          Confidence: {Math.round(classificationResult.confidence * 100)}%
        </div>
      </div>
    )}

    <div className="flex justify-between">
      <button onClick={handleBack} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
        ← Kembali
      </button>
      <button 
        onClick={handleNext}
        disabled={!formData.businessCategory}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        Lanjut →
      </button>
    </div>
  </div>
)}
```

### Step 2: Targets & Goals (Add after Step 1)

```tsx
{/* Step 2: Targets & Goals */}
{currentStep === 2 && (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-900">Tentukan Target Bisnis</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Penjualan per Bulan
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
          <input
            type="number"
            value={formData.monthlyRevenueTarget || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, monthlyRevenueTarget: Number(e.target.value) }))}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
            placeholder="10000000"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Profit Margin (%)
        </label>
        <input
          type="number"
          value={formData.profitMarginTarget || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, profitMarginTarget: Number(e.target.value) }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="25"
        />
        <p className="text-xs text-gray-500 mt-1">
          💡 {suggestTargets(formData.businessCategory || '').profitMarginRange} untuk bisnis Anda
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Balik Modal (bulan)
        </label>
        <input
          type="number"
          value={formData.breakEvenMonths || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, breakEvenMonths: Number(e.target.value) }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="12"
        />
      </div>
    </div>

    <div className="flex justify-between">
      <button onClick={handleBack} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
        ← Kembali
      </button>
      <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Lanjut →
      </button>
    </div>
  </div>
)}
```

### Step 3: Capital & Finance (Add after Step 2)

```tsx
{/* Step 3: Capital & Finance */}
{currentStep === 3 && (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-900">Modal & Keuangan</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Modal Awal Usaha
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
          <input
            type="number"
            value={formData.initialCapital || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, initialCapital: Number(e.target.value) }))}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
            placeholder="50000000"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">💡 Termasuk: Stok awal, peralatan, sewa awal</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Biaya Operasional per Bulan
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
          <input
            type="number"
            value={formData.monthlyOperationalCost || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, monthlyOperationalCost: Number(e.target.value) }))}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
            placeholder="8000000"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">💡 Termasuk: Gaji, sewa, listrik, transport</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Batas Kas Minimum (Alert Threshold)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
          <input
            type="number"
            value={formData.minimumCashAlert || calculateMinimumCash()}
            onChange={(e) => setFormData(prev => ({ ...prev, minimumCashAlert: Number(e.target.value) }))}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          💡 Auto-fill: Rp {calculateMinimumCash().toLocaleString('id-ID')} (2x biaya operasional)
        </p>
      </div>
    </div>

    <div className="flex justify-between">
      <button onClick={handleBack} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
        ← Kembali
      </button>
      <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Lanjut →
      </button>
    </div>
  </div>
)}
```

### Step 4: Skip Products (Add after Step 3)

```tsx
{/* Step 4: Products/Services - SKIP for now */}
{currentStep === 4 && (
  <div className="space-y-6 text-center py-12">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
      <span className="text-3xl">📦</span>
    </div>
    <h2 className="text-2xl font-bold text-gray-900">Produk/Layanan</h2>
    <p className="text-gray-600">
      Anda bisa menambahkan produk atau layanan nanti di dashboard.<br />
      Klik "Lanjut" untuk menyelesaikan setup.
    </p>
    <div className="flex justify-between mt-8">
      <button onClick={handleBack} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
        ← Kembali
      </button>
      <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Lanjut ke Review →
      </button>
    </div>
  </div>
)}
```

## Implementation Steps

1. Open `src/components/onboarding/OnboardingWizard.tsx`
2. Find line with `{currentStep > 0 && currentStep < 5 && (`
3. Replace entire placeholder section with the 4 steps above
4. Save file
5. Test di browser

## Expected Result

Setelah implementasi complete:
- Step 0: Welcome ✅
- Step 1: Business Type + Auto-Classify ✅
- Step 2: Targets & Goals ✅
- Step 3: Capital & Finance ✅
- Step 4: Products Skip ✅
- Step 5: Review & Complete ✅

Total ~850 lines of code.

Karena file terlalu besar untuk di-edit sekaligus, saya recommend:
1. Manual copy-paste step by step, ATAU
2. Saya buat file baru `OnboardingWizardComplete.tsx` lalu rename

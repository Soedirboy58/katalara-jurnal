# 📝 PANDUAN KATEGORI PENGELUARAN

## 🎯 Overview
Sistem pengeluaran Katalara menggunakan **3 tipe transaksi** sesuai standar Laporan Arus Kas UMKM Indonesia:
1. **Operasional** (Operating Activities)
2. **Investasi** (Investing Activities) 
3. **Pendanaan** (Financing Activities)

---

## 1️⃣ OPERASIONAL (Operating Activities)

**Definisi:** Pengeluaran rutin bisnis sehari-hari untuk menjalankan operasional usaha.

### 📦 Pembelian Stok
| Kategori | Kode | Deskripsi | Contoh |
|----------|------|-----------|--------|
| Bahan Baku | `raw_materials` | Bahan mentah untuk produksi | Tepung, telur, gula, minyak goreng |
| Produk Jadi | `finished_goods` | Produk siap jual dari supplier | Kaos polos, kemasan, merchandise |

### 💼 Operasional Rutin
| Kategori | Kode | Deskripsi | Contoh |
|----------|------|-----------|--------|
| Gaji Karyawan | `salary` | Upah pegawai & lembur | Gaji bulanan, THR, bonus |
| Sewa Tempat | `rent` | Sewa gedung/kios/lahan | Sewa toko, kontrakan pabrik |
| Listrik & Air | `utilities` | Utilitas dasar | Tagihan PLN, PDAM |
| Internet & Komunikasi | `communication` | Telekomunikasi | WiFi, pulsa, paket data |
| Transportasi | `transportation` | Biaya perjalanan operasional | Bensin, ojek online, parkir |
| Perawatan & Maintenance | `maintenance` | Perbaikan rutin | Service mesin, cat dinding |
| Marketing & Promosi | `marketing` | Biaya promosi | Iklan FB/IG, spanduk, brosur |
| Pajak & Perizinan | `tax` | Kewajiban legal | PBB, izin usaha, retribusi |
| Lain-lain | `other` | Operasional tidak terkategori | ATK, kebersihan, keamanan |

---

## 2️⃣ INVESTASI (Investing Activities)

**Definisi:** Pembelian aset atau peralatan jangka panjang yang akan digunakan > 1 tahun.

### 🏢 Investasi Aset
| Kategori | Kode | Deskripsi | Contoh |
|----------|------|-----------|--------|
| Peralatan Kantor | `office_equipment` | Peralatan administrasi | Laptop, printer, AC, meja kursi |
| Alat Produksi | `production_equipment` | Mesin & peralatan produksi | Oven, mixer, mesin jahit, kompor gas |
| Kendaraan Operasional | `vehicle` | Kendaraan untuk bisnis | Motor untuk delivery, mobil box |
| Renovasi Bangunan | `building_renovation` | Perbaikan/perluasan bangunan | Bangun dapur, partisi ruangan |
| Peralatan Lainnya | `other_assets` | Aset lain > 1 tahun | Kulkas, freezer, etalase |

**💡 Tips Investasi:**
- Aset dengan nilai > Rp 1.000.000 dan umur ekonomis > 1 tahun
- Akan didepresiasi (penyusutan) dalam laporan keuangan
- Masuk ke **Neraca (Balance Sheet)**, bukan langsung ke Laba Rugi

---

## 3️⃣ PENDANAAN (Financing Activities)

**Definisi:** Transaksi terkait modal pemilik dan pinjaman/hutang usaha.

### 💰 Aktivitas Pendanaan
| Kategori | Kode | Deskripsi | Contoh |
|----------|------|-----------|--------|
| Pembayaran Pokok Pinjaman | `loan_principal` | Cicilan pokok hutang | Angsuran KUR, P2P lending |
| Pembayaran Bunga Pinjaman | `loan_interest` | Beban bunga hutang | Bunga bank, bunga pinjaman |
| Prive Pemilik | `owner_withdrawal` | Penarikan uang pribadi | Ambil uang untuk biaya hidup, sekolah anak |

**⚠️ Catatan Penting tentang PRIVE:**
- **BUKAN pengeluaran bisnis**, tapi penarikan modal
- Tidak masuk ke **Laporan Laba Rugi**
- Dicatat terpisah di **Laporan Perubahan Ekuitas**
- Mengurangi modal pemilik di Neraca

---

## 📊 Cara Memilih Kategori yang Tepat

### ✅ Contoh Benar
| Transaksi | Tipe | Kategori | Alasan |
|-----------|------|----------|--------|
| Beli tepung 50kg untuk produksi roti | Operasional | Bahan Baku | Untuk produksi, habis dalam 1 bulan |
| Beli oven baru Rp 5 juta | Investasi | Alat Produksi | Aset > 1 tahun, untuk produksi |
| Bayar gaji karyawan bulan ini | Operasional | Gaji Karyawan | Operasional rutin |
| Bayar cicilan KUR Rp 1 juta | Pendanaan | Pembayaran Pokok Pinjaman | Hutang ke bank |
| Ambil uang Rp 500rb untuk belanja bulanan | Pendanaan | Prive Pemilik | Uang pribadi, bukan bisnis |

### ❌ Kesalahan Umum
| ❌ Salah | ✅ Benar | Penjelasan |
|---------|----------|------------|
| Beli laptop → Operasional | Beli laptop → **Investasi** | Laptop adalah aset > 1 tahun |
| Prive → Operasional | Prive → **Pendanaan** | Bukan pengeluaran bisnis |
| Bayar bunga pinjaman → Operasional | Bayar bunga → **Pendanaan** | Terkait hutang |
| Renovasi toko → Operasional | Renovasi → **Investasi** | Menambah nilai aset |

---

## 🚀 Implementasi di Sistem

### Database Schema
```sql
-- Column: expense_type
-- Values: 'operating' | 'investing' | 'financing'

-- Column: category
-- Values: Lihat kode kategori di tabel atas
```

### Frontend Dropdown
Form input pengeluaran otomatis menampilkan kategori sesuai tipe:
- Pilih **Operasional** → Muncul 11 kategori operasional
- Pilih **Investasi** → Muncul 5 kategori investasi aset
- Pilih **Pendanaan** → Muncul 3 kategori pendanaan

### Validasi
- `expense_type` wajib diisi (default: 'operating')
- `category` wajib dipilih dari dropdown
- Sistem enforce constraint di database level

---

## 📈 Dampak pada Laporan Keuangan

### Laporan Arus Kas (Cash Flow Statement)
```
ARUS KAS DARI AKTIVITAS OPERASIONAL
+ Pemasukan dari penjualan
- Pengeluaran Operasional (salary, rent, utilities, etc.)
= Arus Kas Bersih Operasional

ARUS KAS DARI AKTIVITAS INVESTASI
- Pembelian Aset (equipment, vehicle, renovation)
= Arus Kas Bersih Investasi

ARUS KAS DARI AKTIVITAS PENDANAAN
+ Penerimaan Pinjaman
- Pembayaran Pinjaman (pokok + bunga)
- Prive Pemilik
= Arus Kas Bersih Pendanaan

TOTAL ARUS KAS BERSIH
```

### Laporan Laba Rugi (Income Statement)
- **Operasional**: Masuk sebagai beban/cost
- **Investasi**: TIDAK masuk (dicatat sebagai aset)
- **Pendanaan - Bunga**: Masuk sebagai beban keuangan
- **Pendanaan - Prive**: TIDAK masuk (bukan beban bisnis)

---

## 🎓 Edukasi untuk User

### Pop-up Info Box (saat pilih kategori)
**Prive:**
> 💡 **Apa itu Prive?**  
> Uang bisnis yang Anda ambil untuk keperluan pribadi (belanja bulanan, biaya sekolah, dll).  
> ⚠️ **Penting:** Prive BUKAN pengeluaran bisnis, tapi pengambilan modal. Catat terpisah agar laporan keuangan akurat!

**Investasi:**
> 💡 **Kapan masuk Investasi?**  
> Jika membeli peralatan/aset yang akan digunakan lebih dari 1 tahun dan bernilai > Rp 1 juta.  
> Contoh: Laptop, mesin produksi, kendaraan, renovasi bangunan.

---

## 📝 Checklist Kategori

Sebelum input pengeluaran, tanyakan:

✅ **Untuk apa pengeluaran ini?**
- Operasional harian → Operasional
- Beli aset/peralatan > 1 tahun → Investasi
- Terkait hutang/modal → Pendanaan

✅ **Berapa lama manfaatnya?**
- < 1 bulan → Operasional
- > 1 tahun → Investasi
- Tidak relevan (hutang/prive) → Pendanaan

✅ **Masuk laporan apa?**
- Laba Rugi → Operasional
- Neraca (aset) → Investasi
- Ekuitas → Pendanaan (prive)

---

**Update Terakhir:** 20 November 2025  
**Sesuai:** SQL Migration `add_expense_classification.sql`  
**Status:** ✅ Aktif di Production

# Rangkuman Aktivitas – 28 Februari 2026

## Ringkasan
- Checkout Lapak menambah pencarian pelanggan via no. telepon dan auto-fill data setelah dipilih.
- Alamat pelanggan disimpan lebih lengkap (provinsi/kabupaten/kecamatan/desa + detail/RT/RW/patokan) dan tersinkron ke data pelanggan.
- Dashboard pelanggan mendukung tambah manual + hapus pelanggan.
- Fitur outlet/affiliate: tracking komisi, dashboard performa per outlet, dan metadata outlet di Lapak.
- Perbaikan stok: pengurangan saat status confirmed, rollback saat batal.
- Perbaikan cetak dokumen (invoice/struk) dan judul memakai nama bisnis.
- Konfirmasi hapus transaksi di Input Income memakai UI modal (bukan alert native).
- Setup Lapak menambah field About Us untuk konten footer.
- Modal detail produk menambah popup share dengan template gambar produk, tombol WA/IG/FB, serta tautan lapak.

## Perubahan Utama
1. **Checkout Lapak & pelanggan repeat**
   - Lookup pelanggan berdasarkan no. telepon.
   - Tombol "Cari pelanggan" menampilkan hasil dan apply data ke form.
   - Normalisasi format nomor telepon agar lebih mudah cocok.

2. **Alamat pelanggan terstruktur**
   - Field wilayah lengkap + alamat detail tersimpan di order dan customer.
   - Fallback input manual untuk desa bila daftar tidak tersedia.

3. **CRM pelanggan**
   - Tambah pelanggan manual.
   - Hapus pelanggan.
   - Data pelanggan tampil lebih lengkap.

4. **Affiliate/outlet performance**
   - Tabel performa per outlet (omzet, jumlah order, komisi).
   - Pengaturan outlet & komisi per outlet.
   - Affiliate code tersimpan di order.

5. **Stok & pembatalan**
   - Stok berkurang saat status confirmed.
   - Rollback stok saat status canceled.

6. **Cetak dokumen**
   - Modal cetak diperbaiki (urutan hooks).
   - Judul invoice/struk memakai nama bisnis.

7. **UI konsistensi**
   - Konfirmasi hapus transaksi pada Input Income memakai `ConfirmModal`.

8. **Lapak: About Us & Share Produk**
   - About Us di footer bisa diedit dari Setup Lapak.
   - Popup share menampilkan template gambar produk + logo.
   - Tautan lapak tersedia dengan tombol salin.
   - Tombol share WA/IG/FB minimalis (ikon).

## Status
- **Build:** ✅ Berhasil di Vercel
- **Deploy:** ✅ Auto-deploy dari branch `main`

## Catatan
- Pencarian pelanggan sekarang manual via tombol agar menghindari salah pilih data.
- Jika masih ada data pelanggan tidak ditemukan, cek format nomor telepon di database (prefix 62/0).
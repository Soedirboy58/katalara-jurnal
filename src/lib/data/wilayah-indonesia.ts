// Data wilayah Indonesia (simplified - production should use API)
// Source: Based on administrative regions of Indonesia

export interface Provinsi {
  id: string
  nama: string
}

export interface Kabupaten {
  id: string
  provinsi_id: string
  nama: string
}

export interface Kecamatan {
  id: string
  kabupaten_id: string
  nama: string
}

export const provinsiList: Provinsi[] = [
  { id: '11', nama: 'Aceh' },
  { id: '12', nama: 'Sumatera Utara' },
  { id: '13', nama: 'Sumatera Barat' },
  { id: '14', nama: 'Riau' },
  { id: '15', nama: 'Jambi' },
  { id: '16', nama: 'Sumatera Selatan' },
  { id: '17', nama: 'Bengkulu' },
  { id: '18', nama: 'Lampung' },
  { id: '19', nama: 'Kepulauan Bangka Belitung' },
  { id: '21', nama: 'Kepulauan Riau' },
  { id: '31', nama: 'DKI Jakarta' },
  { id: '32', nama: 'Jawa Barat' },
  { id: '33', nama: 'Jawa Tengah' },
  { id: '34', nama: 'DI Yogyakarta' },
  { id: '35', nama: 'Jawa Timur' },
  { id: '36', nama: 'Banten' },
  { id: '51', nama: 'Bali' },
  { id: '52', nama: 'Nusa Tenggara Barat' },
  { id: '53', nama: 'Nusa Tenggara Timur' },
  { id: '61', nama: 'Kalimantan Barat' },
  { id: '62', nama: 'Kalimantan Tengah' },
  { id: '63', nama: 'Kalimantan Selatan' },
  { id: '64', nama: 'Kalimantan Timur' },
  { id: '65', nama: 'Kalimantan Utara' },
  { id: '71', nama: 'Sulawesi Utara' },
  { id: '72', nama: 'Sulawesi Tengah' },
  { id: '73', nama: 'Sulawesi Selatan' },
  { id: '74', nama: 'Sulawesi Tenggara' },
  { id: '75', nama: 'Gorontalo' },
  { id: '76', nama: 'Sulawesi Barat' },
  { id: '81', nama: 'Maluku' },
  { id: '82', nama: 'Maluku Utara' },
  { id: '91', nama: 'Papua' },
  { id: '92', nama: 'Papua Barat' },
  { id: '93', nama: 'Papua Selatan' },
  { id: '94', nama: 'Papua Tengah' },
  { id: '95', nama: 'Papua Pegunungan' },
  { id: '96', nama: 'Papua Barat Daya' }
]

// Sample kabupaten data (tambahkan lebih banyak sesuai kebutuhan)
export const kabupatenList: Kabupaten[] = [
  // DKI Jakarta
  { id: '3101', provinsi_id: '31', nama: 'Jakarta Pusat' },
  { id: '3102', provinsi_id: '31', nama: 'Jakarta Utara' },
  { id: '3103', provinsi_id: '31', nama: 'Jakarta Barat' },
  { id: '3104', provinsi_id: '31', nama: 'Jakarta Selatan' },
  { id: '3105', provinsi_id: '31', nama: 'Jakarta Timur' },
  { id: '3106', provinsi_id: '31', nama: 'Kepulauan Seribu' },
  
  // Jawa Barat
  { id: '3201', provinsi_id: '32', nama: 'Kabupaten Bogor' },
  { id: '3202', provinsi_id: '32', nama: 'Kabupaten Sukabumi' },
  { id: '3203', provinsi_id: '32', nama: 'Kabupaten Cianjur' },
  { id: '3204', provinsi_id: '32', nama: 'Kabupaten Bandung' },
  { id: '3205', provinsi_id: '32', nama: 'Kabupaten Garut' },
  { id: '3206', provinsi_id: '32', nama: 'Kabupaten Tasikmalaya' },
  { id: '3207', provinsi_id: '32', nama: 'Kabupaten Ciamis' },
  { id: '3208', provinsi_id: '32', nama: 'Kabupaten Kuningan' },
  { id: '3209', provinsi_id: '32', nama: 'Kabupaten Cirebon' },
  { id: '3210', provinsi_id: '32', nama: 'Kabupaten Majalengka' },
  { id: '3211', provinsi_id: '32', nama: 'Kabupaten Sumedang' },
  { id: '3212', provinsi_id: '32', nama: 'Kabupaten Indramayu' },
  { id: '3213', provinsi_id: '32', nama: 'Kabupaten Subang' },
  { id: '3214', provinsi_id: '32', nama: 'Kabupaten Purwakarta' },
  { id: '3215', provinsi_id: '32', nama: 'Kabupaten Karawang' },
  { id: '3216', provinsi_id: '32', nama: 'Kabupaten Bekasi' },
  { id: '3217', provinsi_id: '32', nama: 'Kabupaten Bandung Barat' },
  { id: '3218', provinsi_id: '32', nama: 'Kabupaten Pangandaran' },
  { id: '3271', provinsi_id: '32', nama: 'Kota Bogor' },
  { id: '3272', provinsi_id: '32', nama: 'Kota Sukabumi' },
  { id: '3273', provinsi_id: '32', nama: 'Kota Bandung' },
  { id: '3274', provinsi_id: '32', nama: 'Kota Cirebon' },
  { id: '3275', provinsi_id: '32', nama: 'Kota Bekasi' },
  { id: '3276', provinsi_id: '32', nama: 'Kota Depok' },
  { id: '3277', provinsi_id: '32', nama: 'Kota Cimahi' },
  { id: '3278', provinsi_id: '32', nama: 'Kota Tasikmalaya' },
  { id: '3279', provinsi_id: '32', nama: 'Kota Banjar' },
  
  // Jawa Tengah
  { id: '3301', provinsi_id: '33', nama: 'Kabupaten Cilacap' },
  { id: '3302', provinsi_id: '33', nama: 'Kabupaten Banyumas' },
  { id: '3303', provinsi_id: '33', nama: 'Kabupaten Purbalingga' },
  { id: '3304', provinsi_id: '33', nama: 'Kabupaten Banjarnegara' },
  { id: '3305', provinsi_id: '33', nama: 'Kabupaten Kebumen' },
  { id: '3306', provinsi_id: '33', nama: 'Kabupaten Purworejo' },
  { id: '3307', provinsi_id: '33', nama: 'Kabupaten Wonosobo' },
  { id: '3308', provinsi_id: '33', nama: 'Kabupaten Magelang' },
  { id: '3309', provinsi_id: '33', nama: 'Kabupaten Boyolali' },
  { id: '3310', provinsi_id: '33', nama: 'Kabupaten Klaten' },
  { id: '3311', provinsi_id: '33', nama: 'Kabupaten Sukoharjo' },
  { id: '3312', provinsi_id: '33', nama: 'Kabupaten Wonogiri' },
  { id: '3313', provinsi_id: '33', nama: 'Kabupaten Karanganyar' },
  { id: '3314', provinsi_id: '33', nama: 'Kabupaten Sragen' },
  { id: '3315', provinsi_id: '33', nama: 'Kabupaten Grobogan' },
  { id: '3371', provinsi_id: '33', nama: 'Kota Semarang' },
  { id: '3372', provinsi_id: '33', nama: 'Kota Salatiga' },
  { id: '3373', provinsi_id: '33', nama: 'Kota Magelang' },
  { id: '3374', provinsi_id: '33', nama: 'Kota Surakarta' },
  { id: '3375', provinsi_id: '33', nama: 'Kota Pekalongan' },
  { id: '3376', provinsi_id: '33', nama: 'Kota Tegal' },
  
  // Jawa Timur
  { id: '3501', provinsi_id: '35', nama: 'Kabupaten Pacitan' },
  { id: '3502', provinsi_id: '35', nama: 'Kabupaten Ponorogo' },
  { id: '3503', provinsi_id: '35', nama: 'Kabupaten Trenggalek' },
  { id: '3504', provinsi_id: '35', nama: 'Kabupaten Tulungagung' },
  { id: '3505', provinsi_id: '35', nama: 'Kabupaten Blitar' },
  { id: '3506', provinsi_id: '35', nama: 'Kabupaten Kediri' },
  { id: '3507', provinsi_id: '35', nama: 'Kabupaten Malang' },
  { id: '3508', provinsi_id: '35', nama: 'Kabupaten Lumajang' },
  { id: '3509', provinsi_id: '35', nama: 'Kabupaten Jember' },
  { id: '3510', provinsi_id: '35', nama: 'Kabupaten Banyuwangi' },
  { id: '3571', provinsi_id: '35', nama: 'Kota Surabaya' },
  { id: '3572', provinsi_id: '35', nama: 'Kota Malang' },
  { id: '3573', provinsi_id: '35', nama: 'Kota Kediri' },
  { id: '3574', provinsi_id: '35', nama: 'Kota Blitar' },
  { id: '3575', provinsi_id: '35', nama: 'Kota Mojokerto' },
  { id: '3576', provinsi_id: '35', nama: 'Kota Madiun' },
  { id: '3577', provinsi_id: '35', nama: 'Kota Pasuruan' },
  { id: '3578', provinsi_id: '35', nama: 'Kota Probolinggo' },
  { id: '3579', provinsi_id: '35', nama: 'Kota Batu' }
]

// Sample kecamatan data
export const kecamatanList: Kecamatan[] = [
  // Jakarta Pusat
  { id: '310101', kabupaten_id: '3101', nama: 'Gambir' },
  { id: '310102', kabupaten_id: '3101', nama: 'Tanah Abang' },
  { id: '310103', kabupaten_id: '3101', nama: 'Menteng' },
  { id: '310104', kabupaten_id: '3101', nama: 'Senen' },
  { id: '310105', kabupaten_id: '3101', nama: 'Cempaka Putih' },
  { id: '310106', kabupaten_id: '3101', nama: 'Johar Baru' },
  { id: '310107', kabupaten_id: '3101', nama: 'Kemayoran' },
  { id: '310108', kabupaten_id: '3101', nama: 'Sawah Besar' },
  
  // Jakarta Selatan
  { id: '310401', kabupaten_id: '3104', nama: 'Tebet' },
  { id: '310402', kabupaten_id: '3104', nama: 'Setiabudi' },
  { id: '310403', kabupaten_id: '3104', nama: 'Mampang Prapatan' },
  { id: '310404', kabupaten_id: '3104', nama: 'Pasar Minggu' },
  { id: '310405', kabupaten_id: '3104', nama: 'Kebayoran Lama' },
  { id: '310406', kabupaten_id: '3104', nama: 'Cilandak' },
  { id: '310407', kabupaten_id: '3104', nama: 'Kebayoran Baru' },
  { id: '310408', kabupaten_id: '3104', nama: 'Pancoran' },
  { id: '310409', kabupaten_id: '3104', nama: 'Jagakarsa' },
  { id: '310410', kabupaten_id: '3104', nama: 'Pesanggrahan' },
  
  // Kota Bandung
  { id: '327301', kabupaten_id: '3273', nama: 'Bandung Kulon' },
  { id: '327302', kabupaten_id: '3273', nama: 'Babakan Ciparay' },
  { id: '327303', kabupaten_id: '3273', nama: 'Bojongloa Kaler' },
  { id: '327304', kabupaten_id: '3273', nama: 'Bojongloa Kidul' },
  { id: '327305', kabupaten_id: '3273', nama: 'Astanaanyar' },
  { id: '327306', kabupaten_id: '3273', nama: 'Regol' },
  { id: '327307', kabupaten_id: '3273', nama: 'Lengkong' },
  { id: '327308', kabupaten_id: '3273', nama: 'Bandung Kidul' },
  { id: '327309', kabupaten_id: '3273', nama: 'Buahbatu' },
  { id: '327310', kabupaten_id: '3273', nama: 'Rancasari' },
  
  // Kota Surabaya
  { id: '357101', kabupaten_id: '3571', nama: 'Karangpilang' },
  { id: '357102', kabupaten_id: '3571', nama: 'Wonocolo' },
  { id: '357103', kabupaten_id: '3571', nama: 'Rungkut' },
  { id: '357104', kabupaten_id: '3571', nama: 'Wonokromo' },
  { id: '357105', kabupaten_id: '3571', nama: 'Tegalsari' },
  { id: '357106', kabupaten_id: '3571', nama: 'Sawahan' },
  { id: '357107', kabupaten_id: '3571', nama: 'Genteng' },
  { id: '357108', kabupaten_id: '3571', nama: 'Gubeng' },
  { id: '357109', kabupaten_id: '3571', nama: 'Sukolilo' },
  { id: '357110', kabupaten_id: '3571', nama: 'Tambaksari' }
]

// Helper functions
export const getKabupatenByProvinsi = (provinsiId: string): Kabupaten[] => {
  return kabupatenList.filter(kab => kab.provinsi_id === provinsiId)
}

export const getKecamatanByKabupaten = (kabupatenId: string): Kecamatan[] => {
  return kecamatanList.filter(kec => kec.kabupaten_id === kabupatenId)
}

// =====================================================
// RANGER ONBOARDING FORM TYPES
// =====================================================

export type RangerStatus = 'mahasiswa' | 'fresh_graduate' | 'freelancer';

export type SkillType = 
  | 'product_photography'
  | 'data_entry'
  | 'graphic_design'
  | 'copywriting'
  | 'social_media'
  | 'marketplace_optimization'
  | 'other';

export type ExperienceLevel = 
  | 'beginner' // Belum pernah (siap belajar)
  | 'intermediate' // Pernah 1-5 kali
  | 'experienced' // Sering (>5 kali)
  | 'professional'; // Profesional

export interface RangerOnboardingFormData {
  // Step 1: Data Diri
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender?: 'male' | 'female' | 'other';
  
  // Step 2: Alamat
  address: string;
  province: string;
  city: string;
  district: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  
  // Step 3: Status Pendidikan
  status: RangerStatus;
  university?: string; // Optional untuk freelancer umum
  customUniversity?: string; // For manual input when select "Lainnya"
  major?: string;
  studentId?: string; // NIM
  graduationYear?: number;
  idCardFile?: File; // KTM/KTP upload
  
  // Step 4: Keahlian Digital
  skills: SkillType[];
  otherSkill?: string; // Jika pilih 'other'
  experienceLevel: ExperienceLevel;
  
  // Step 5: Portofolio (Optional)
  instagramHandle?: string;
  portfolioUrl?: string;
  portfolioImages?: File[]; // Max 5 files
  
  // Step 6: Data Bank
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
}

// Skill configurations
export const SKILL_OPTIONS: { value: SkillType; label: string; icon: string }[] = [
  {
    value: 'product_photography',
    label: 'Foto Produk (pakai HP)',
    icon: '📸'
  },
  {
    value: 'data_entry',
    label: 'Input Data Produk',
    icon: '⌨️'
  },
  {
    value: 'graphic_design',
    label: 'Desain Grafis Simple',
    icon: '🎨'
  },
  {
    value: 'copywriting',
    label: 'Tulis Deskripsi Produk',
    icon: '✍️'
  },
  {
    value: 'social_media',
    label: 'Posting Social Media',
    icon: '📱'
  },
  {
    value: 'marketplace_optimization',
    label: 'Optimasi Toko Online',
    icon: '🚀'
  },
  {
    value: 'other',
    label: 'Lainnya',
    icon: '➕'
  }
];

export const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string; description: string }[] = [
  {
    value: 'beginner',
    label: 'Belum pernah',
    description: 'Siap belajar!'
  },
  {
    value: 'intermediate',
    label: 'Pernah 1-5 kali',
    description: 'Punya pengalaman dasar'
  },
  {
    value: 'experienced',
    label: 'Sering (>5 kali)',
    description: 'Sudah terbiasa'
  },
  {
    value: 'professional',
    label: 'Profesional',
    description: 'Expert di bidang ini'
  }
];

export const BANK_OPTIONS = [
  'BCA',
  'Mandiri',
  'BRI',
  'BNI',
  'CIMB Niaga',
  'Danamon',
  'Permata',
  'Maybank',
  'BTN',
  'Bank Syariah Indonesia (BSI)',
  'Jenius (BTPN)',
  'Gopay',
  'OVO',
  'DANA',
  'ShopeePay',
  'LinkAja',
  'Lainnya'
];

// List universitas populer (bisa diperluas)
export const UNIVERSITY_OPTIONS = [
  'Universitas Indonesia (UI)',
  'Institut Teknologi Bandung (ITB)',
  'Universitas Gadjah Mada (UGM)',
  'Institut Pertanian Bogor (IPB)',
  'Universitas Airlangga (Unair)',
  'Universitas Diponegoro (Undip)',
  'Universitas Brawijaya (UB)',
  'Universitas Padjadjaran (Unpad)',
  'Institut Teknologi Sepuluh Nopember (ITS)',
  'Universitas Hasanuddin (Unhas)',
  'Universitas Sebelas Maret (UNS)',
  'Universitas Pendidikan Indonesia (UPI)',
  'Telkom University',
  'Binus University',
  'Universitas Trisakti',
  'Universitas Pelita Harapan (UPH)',
  'Universitas Tarumanagara (Untar)',
  'Universitas Multimedia Nusantara (UMN)',
  'Universitas Atma Jaya',
  'President University',
  'Lainnya (tulis manual)'
];

// Form step labels
export const FORM_STEPS = [
  { number: 1, label: 'Data Diri', icon: '👤' },
  { number: 2, label: 'Alamat', icon: '📍' },
  { number: 3, label: 'Pendidikan', icon: '🎓' },
  { number: 4, label: 'Keahlian', icon: '⚡' },
  { number: 5, label: 'Portofolio', icon: '💼' },
  { number: 6, label: 'Bank', icon: '💳' }
];

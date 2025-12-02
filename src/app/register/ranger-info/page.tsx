'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { 
  RangerOnboardingFormData, 
  SKILL_OPTIONS, 
  EXPERIENCE_OPTIONS,
  BANK_OPTIONS,
  UNIVERSITY_OPTIONS,
  FORM_STEPS,
  RangerStatus,
  SkillType,
  ExperienceLevel
} from '@/types/ranger-onboarding'
import { provinsiList, getKabupatenByProvinsi, getKecamatanByKabupaten } from '@/lib/data/wilayah-indonesia'
import { Upload, ChevronLeft, ChevronRight, Check, AlertCircle, Users } from 'lucide-react'

export default function RangerOnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  
  // Location state
  const [selectedProvinsi, setSelectedProvinsi] = useState('')
  const [selectedProvinsiNama, setSelectedProvinsiNama] = useState('')
  const [selectedKabupaten, setSelectedKabupaten] = useState('')
  const [selectedKabupatenNama, setSelectedKabupatenNama] = useState('')
  const [selectedKecamatan, setSelectedKecamatan] = useState('')
  const [selectedKecamatanNama, setSelectedKecamatanNama] = useState('')
  const [availableKabupaten, setAvailableKabupaten] = useState<any[]>([])
  const [availableKecamatan, setAvailableKecamatan] = useState<any[]>([])
  
  // Form data
  const [formData, setFormData] = useState<Partial<RangerOnboardingFormData>>({
    skills: [],
    experienceLevel: 'beginner'
  })
  
  // File upload state
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null)
  const [portfolioPreview, setPortfolioPreviews] = useState<string[]>([])

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login')
        return
      }
      
      setUserId(user.id)
      
      // Pre-fill email from auth
      setFormData(prev => ({
        ...prev,
        email: user.email || ''
      }))
    })
  }, [router, supabase])
  
  // Handle provinsi change
  useEffect(() => {
    if (selectedProvinsi) {
      const kabupaten = getKabupatenByProvinsi(selectedProvinsi)
      setAvailableKabupaten(kabupaten)
      setSelectedKabupaten('')
      setSelectedKabupatenNama('')
      setSelectedKecamatan('')
      setAvailableKecamatan([])
      handleInputChange('province', selectedProvinsiNama)
    } else {
      setAvailableKabupaten([])
      setAvailableKecamatan([])
    }
  }, [selectedProvinsi])
  
  // Handle kabupaten change
  useEffect(() => {
    if (selectedKabupaten) {
      const kecamatan = getKecamatanByKabupaten(selectedKabupaten)
      setAvailableKecamatan(kecamatan)
      setSelectedKecamatan('')
      handleInputChange('city', selectedKabupatenNama)
    } else {
      setAvailableKecamatan([])
    }
  }, [selectedKabupaten])

  const handleInputChange = (field: keyof RangerOnboardingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSkillToggle = (skill: SkillType) => {
    setFormData(prev => {
      const currentSkills = prev.skills || []
      const newSkills = currentSkills.includes(skill)
        ? currentSkills.filter(s => s !== skill)
        : [...currentSkills, skill]
      return { ...prev, skills: newSkills }
    })
  }

  const handleIdCardUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, idCardFile: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setIdCardPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePortfolioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5)
    setFormData(prev => ({ ...prev, portfolioImages: files }))
    
    const previews: string[] = []
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        previews.push(reader.result as string)
        if (previews.length === files.length) {
          setPortfolioPreviews(previews)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Data Diri
        if (!formData.fullName?.trim()) {
          setError('Nama lengkap wajib diisi')
          return false
        }
        if (!formData.phone?.trim()) {
          setError('Nomor WhatsApp wajib diisi')
          return false
        }
        if (!formData.dateOfBirth) {
          setError('Tanggal lahir wajib diisi')
          return false
        }
        return true
        
      case 2: // Alamat
        if (!formData.address?.trim()) {
          setError('Alamat lengkap wajib diisi')
          return false
        }
        if (!selectedProvinsi || !selectedKabupaten || !selectedKecamatan) {
          setError('Provinsi, Kabupaten, dan Kecamatan wajib dipilih')
          return false
        }
        return true
        
      case 3: // Pendidikan
        if (!formData.status) {
          setError('Status wajib dipilih')
          return false
        }
        // Jika mahasiswa/fresh grad, wajib isi data kampus
        if ((formData.status === 'mahasiswa' || formData.status === 'fresh_graduate') && !formData.university?.trim()) {
          setError('Data universitas wajib diisi untuk mahasiswa/fresh graduate')
          return false
        }
        return true
        
      case 4: // Keahlian
        if (!formData.skills || formData.skills.length === 0) {
          setError('Pilih minimal 1 keahlian')
          return false
        }
        if (formData.skills.includes('other') && !formData.otherSkill?.trim()) {
          setError('Sebutkan keahlian lainnya')
          return false
        }
        return true
        
      case 5: // Portofolio (optional, always valid)
        return true
        
      case 6: // Bank
        if (!formData.bankName) {
          setError('Nama bank wajib dipilih')
          return false
        }
        if (!formData.bankAccountNumber?.trim()) {
          setError('Nomor rekening wajib diisi')
          return false
        }
        if (!formData.bankAccountName?.trim()) {
          setError('Nama pemilik rekening wajib diisi')
          return false
        }
        return true
        
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 6))
      setError('')
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError('')
  }

  const handleSubmit = async () => {
    if (!validateStep(6)) return
    if (!userId) {
      setError('User tidak ditemukan')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 1. Upload ID Card if exists
      let idCardUrl = null
      if (formData.idCardFile) {
        const fileExt = formData.idCardFile.name.split('.').pop()
        const fileName = `${userId}_id_card.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('ranger-documents')
          .upload(fileName, formData.idCardFile, { upsert: true })
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('ranger-documents')
            .getPublicUrl(fileName)
          idCardUrl = publicUrl
        }
      }

      // 2. Upload portfolio images if exists
      const portfolioUrls: string[] = []
      if (formData.portfolioImages && formData.portfolioImages.length > 0) {
        for (let i = 0; i < formData.portfolioImages.length; i++) {
          const file = formData.portfolioImages[i]
          const fileExt = file.name.split('.').pop()
          const fileName = `${userId}_portfolio_${i + 1}.${fileExt}`
          const { error: uploadError } = await supabase.storage
            .from('ranger-portfolio')
            .upload(fileName, file, { upsert: true })
          
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('ranger-portfolio')
              .getPublicUrl(fileName)
            portfolioUrls.push(publicUrl)
          }
        }
      }

      // 3. Determine final university name
      const finalUniversityName = formData.university === 'Lainnya (tulis manual)' 
        ? formData.customUniversity 
        : formData.university

      // 4. Insert ranger profile
      const profileData = {
        user_id: userId,
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email || null,
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        province: selectedProvinsiNama || null,
        city: selectedKabupatenNama || null,
        district: selectedKecamatanNama || null,
        address: formData.address || null,
        university: finalUniversityName || null,
        major: formData.major || null,
        student_id: formData.studentId || null,
        graduation_year: formData.graduationYear || null,
        skills: formData.skills || [],
        portfolio_url: formData.portfolioUrl || null,
        instagram_handle: formData.instagramHandle || null,
        id_card_url: idCardUrl,
        bank_name: formData.bankName,
        bank_account_number: formData.bankAccountNumber,
        bank_account_name: formData.bankAccountName,
        is_verified: true, // Auto-approved
        verification_status: 'approved',
        verified_at: new Date().toISOString()
      }

      console.log('Submitting ranger profile:', profileData)

      const { error: insertError } = await supabase
        .from('ranger_profiles')
        .insert(profileData)

      if (insertError) {
        console.error('Insert error:', insertError)
        throw insertError
      }

      // 5. Update user profile role to 'ranger'
      try {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ role: 'ranger' })
          .eq('user_id', userId)
        
        if (updateError) {
          console.error('Failed to update user_profiles role:', updateError)
        } else {
          console.log('Successfully updated user role to ranger')
        }
      } catch (e) {
        console.error('Error updating user_profiles:', e)
      }

      // 6. Redirect to Rangers dashboard
      router.push('/dashboard/rangers')
      
    } catch (err: any) {
      console.error('Error creating ranger profile:', err)
      setError(err.message || 'Gagal menyimpan data. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">👤 Data Diri</h2>
            <p className="text-sm text-gray-600">Informasi dasar tentang Anda</p>
            
            <Input
              label="Nama Lengkap"
              value={formData.fullName || ''}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Sesuai KTP/KTM"
              required
            />
            
            <Input
              label="Email"
              type="email"
              value={formData.email || ''}
              disabled
              className="bg-gray-50"
            />
            
            <Input
              label="Nomor WhatsApp"
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="08xxxxxxxxxx"
              required
            />
            
            <Input
              label="Tanggal Lahir"
              type="date"
              value={formData.dateOfBirth || ''}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Kelamin (Opsional)
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm text-gray-700">Laki-laki</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm text-gray-700">Perempuan</span>
                </label>
              </div>
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">📍 Alamat</h2>
            <p className="text-sm text-gray-600">Lokasi Anda akan membantu matching dengan UMKM terdekat</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provinsi <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProvinsi}
                onChange={(e) => {
                  const selectedOption = provinsiList.find(p => p.id === e.target.value)
                  setSelectedProvinsi(e.target.value)
                  setSelectedProvinsiNama(selectedOption?.nama || '')
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Pilih Provinsi</option>
                {provinsiList.map((prov, idx) => (
                  <option key={`prov-${idx}`} value={prov.id}>{prov.nama}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kabupaten/Kota <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedKabupaten}
                onChange={(e) => {
                  const selectedOption = availableKabupaten.find(k => k.id === e.target.value)
                  setSelectedKabupaten(e.target.value)
                  setSelectedKabupatenNama(selectedOption?.nama || '')
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={!selectedProvinsi}
                required
              >
                <option value="">Pilih Kabupaten/Kota</option>
                {availableKabupaten.map((kab, idx) => (
                  <option key={`kab-${idx}`} value={kab.id}>{kab.nama}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kecamatan <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedKecamatan}
                onChange={(e) => {
                  const selectedOption = availableKecamatan.find(k => k.id === e.target.value)
                  setSelectedKecamatan(e.target.value)
                  setSelectedKecamatanNama(selectedOption?.nama || '')
                  handleInputChange('district', selectedOption?.nama || e.target.value)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={!selectedKabupaten}
                required
              >
                <option value="">Pilih Kecamatan</option>
                {availableKecamatan.map((kec, idx) => (
                  <option key={`kec-${idx}`} value={kec.id}>{kec.nama}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alamat Lengkap <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Jalan, RT/RW, Kelurahan, dll"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
                required
              />
            </div>
            
            <Input
              label="Kode Pos (Opsional)"
              value={formData.postalCode || ''}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              placeholder="12345"
            />
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">🎓 Status Pendidikan</h2>
            <p className="text-sm text-gray-600">Ceritakan latar belakang Anda</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saya adalah: <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                  <input
                    type="radio"
                    name="status"
                    value="mahasiswa"
                    checked={formData.status === 'mahasiswa'}
                    onChange={(e) => handleInputChange('status', e.target.value as RangerStatus)}
                    className="w-5 h-5 text-purple-600 mt-0.5"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Mahasiswa Aktif</div>
                    <div className="text-sm text-gray-600">Masih kuliah, punya KTM aktif</div>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                  <input
                    type="radio"
                    name="status"
                    value="fresh_graduate"
                    checked={formData.status === 'fresh_graduate'}
                    onChange={(e) => handleInputChange('status', e.target.value as RangerStatus)}
                    className="w-5 h-5 text-purple-600 mt-0.5"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Fresh Graduate</div>
                    <div className="text-sm text-gray-600">Baru lulus dalam 2 tahun terakhir</div>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                  <input
                    type="radio"
                    name="status"
                    value="freelancer"
                    checked={formData.status === 'freelancer'}
                    onChange={(e) => handleInputChange('status', e.target.value as RangerStatus)}
                    className="w-5 h-5 text-purple-600 mt-0.5"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Freelancer Umum</div>
                    <div className="text-sm text-gray-600">Tidak sedang kuliah, siap kerja fleksibel</div>
                  </div>
                </label>
              </div>
            </div>
            
            {(formData.status === 'mahasiswa' || formData.status === 'fresh_graduate') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Universitas <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.university || ''}
                    onChange={(e) => {
                      handleInputChange('university', e.target.value)
                      // Reset custom university if switching away from "Lainnya"
                      if (e.target.value !== 'Lainnya (tulis manual)') {
                        handleInputChange('customUniversity', '')
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Pilih Universitas</option>
                    {UNIVERSITY_OPTIONS.map((univ, idx) => (
                      <option key={`univ-${idx}`} value={univ}>{univ}</option>
                    ))}
                  </select>
                </div>
                
                {formData.university === 'Lainnya (tulis manual)' && (
                  <Input
                    label="Tulis Nama Universitas"
                    value={formData.customUniversity || ''}
                    onChange={(e) => handleInputChange('customUniversity', e.target.value)}
                    placeholder="Contoh: Universitas Swasta XYZ"
                    required
                  />
                )}
                
                <Input
                  label="Jurusan/Program Studi"
                  value={formData.major || ''}
                  onChange={(e) => handleInputChange('major', e.target.value)}
                  placeholder="Contoh: Teknik Informatika"
                />
                
                {formData.status === 'mahasiswa' && (
                  <Input
                    label="NIM/NPM"
                    value={formData.studentId || ''}
                    onChange={(e) => handleInputChange('studentId', e.target.value)}
                    placeholder="Contoh: 1234567890"
                  />
                )}
                
                <Input
                  label="Tahun Lulus/Angkatan"
                  type="number"
                  value={formData.graduationYear || ''}
                  onChange={(e) => handleInputChange('graduationYear', parseInt(e.target.value))}
                  placeholder="Contoh: 2025"
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload KTM/Kartu Mahasiswa (Opsional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIdCardUpload}
                      className="hidden"
                      id="id-card-upload"
                    />
                    <label htmlFor="id-card-upload" className="cursor-pointer">
                      {idCardPreview ? (
                        <img src={idCardPreview} alt="Preview" className="max-h-40 mx-auto rounded" />
                      ) : (
                        <>
                          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Klik untuk upload</p>
                          <p className="text-xs text-gray-500 mt-1">JPG, PNG max 2MB</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        )
      
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">⚡ Keahlian Digital</h2>
            <p className="text-sm text-gray-600">Pilih layanan yang bisa Anda kerjakan (bisa pilih lebih dari 1)</p>
            
            <div className="space-y-2">
              {SKILL_OPTIONS.map((skill, idx) => (
                <label
                  key={`skill-${idx}`}
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.skills?.includes(skill.value)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.skills?.includes(skill.value) || false}
                    onChange={() => handleSkillToggle(skill.value)}
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                  <span className="text-2xl">{String(skill.icon)}</span>
                  <span className="font-medium text-gray-900">{String(skill.label)}</span>
                </label>
              ))}
            </div>
            
            {formData.skills?.includes('other') && (
              <Input
                label="Sebutkan keahlian lainnya"
                value={formData.otherSkill || ''}
                onChange={(e) => handleInputChange('otherSkill', e.target.value)}
                placeholder="Contoh: Video Editing, SEO, dll"
                required
              />
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pengalaman <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {EXPERIENCE_OPTIONS.map((exp, idx) => (
                  <label
                    key={`exp-${idx}`}
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.experienceLevel === exp.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="experienceLevel"
                      value={exp.value}
                      checked={formData.experienceLevel === exp.value}
                      onChange={(e) => handleInputChange('experienceLevel', e.target.value as ExperienceLevel)}
                      className="w-5 h-5 text-purple-600 mt-0.5"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{String(exp.label)}</div>
                      <div className="text-sm text-gray-600">{String(exp.description)}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )
      
      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">💼 Portofolio (Opsional)</h2>
            <p className="text-sm text-gray-600">Bisa diisi nanti. Portofolio baru akan ter-record otomatis dari setiap job yang selesai.</p>
            
            <Input
              label="Username Instagram (Opsional)"
              value={formData.instagramHandle || ''}
              onChange={(e) => handleInputChange('instagramHandle', e.target.value)}
              placeholder="@username"
            />
            
            <Input
              label="Link Portfolio/Behance (Opsional)"
              value={formData.portfolioUrl || ''}
              onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
              placeholder="https://..."
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Hasil Karya (Opsional, max 5 foto)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePortfolioUpload}
                  className="hidden"
                  id="portfolio-upload"
                />
                <label htmlFor="portfolio-upload" className="cursor-pointer">
                  {portfolioPreview.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {portfolioPreview.map((preview, idx) => (
                        <img key={idx} src={preview} alt={`Portfolio ${idx + 1}`} className="h-24 object-cover rounded" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Klik untuk upload</p>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG max 2MB per file</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        )
      
      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">💳 Data Bank</h2>
            <p className="text-sm text-gray-600">Diperlukan untuk menerima pembayaran dari UMKM</p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <strong>Penting:</strong> Pastikan data bank sesuai dengan nama Anda. Transfer hanya bisa ke rekening atas nama pribadi.
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Bank <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.bankName || ''}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Pilih Bank</option>
                {BANK_OPTIONS.map((bank, idx) => (
                  <option key={`bank-${idx}`} value={bank}>{bank}</option>
                ))}
              </select>
            </div>
            
            <Input
              label="Nomor Rekening"
              value={formData.bankAccountNumber || ''}
              onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
              placeholder="1234567890"
              required
            />
            
            <Input
              label="Nama Pemilik Rekening"
              value={formData.bankAccountName || ''}
              onChange={(e) => handleInputChange('bankAccountName', e.target.value)}
              placeholder="Sesuai buku tabungan"
              required
            />
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Tips:</strong> Untuk e-wallet (Gopay, OVO, DANA), masukkan nomor HP yang terdaftar sebagai nomor rekening.
              </p>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Daftar Katalara Ranger</h1>
              <p className="text-sm text-gray-600">Bergabung sebagai freelancer digital untuk UMKM</p>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6">
            {FORM_STEPS.map((step, idx) => (
              <div key={`step-${step.number}`} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      currentStep > step.number
                        ? 'bg-green-500 text-white'
                        : currentStep === step.number
                        ? 'bg-purple-600 text-white ring-4 ring-purple-100'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.number ? <Check className="w-5 h-5" /> : String(step.number)}
                  </div>
                  <div className="text-xs mt-2 text-center hidden sm:block">
                    <div className="font-medium">{step.label}</div>
                  </div>
                </div>
                {idx < FORM_STEPS.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all ${
                      currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {currentStep > 1 && (
            <Button
              onClick={handlePrevious}
              variant="secondary"
              disabled={loading}
              className="flex-1"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Kembali
            </Button>
          )}
          
          {currentStep < 6 ? (
            <Button
              onClick={handleNext}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Lanjut
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {loading ? 'Menyimpan...' : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Selesai & Mulai Cari Job
                </>
              )}
            </Button>
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Dengan mendaftar, Anda setuju dengan syarat & ketentuan Katalara Rangers</p>
        </div>
      </div>
    </div>
  )
}

'use client'

export function Features() {
  const stats = [
    { number: '1000+', label: 'UMKM Terdaftar', icon: '🏪' },
    { number: '50K+', label: 'Transaksi/Bulan', icon: '💳' },
    { number: '99.9%', label: 'Uptime', icon: '⚡' },
    { number: 'Gratis', label: 'Selamanya', icon: '🎉' }
  ]

  const benefits = [
    {
      title: 'Setup Cepat',
      description: 'Mulai dalam 2 menit. Tidak perlu training khusus.',
      icon: '⚡'
    },
    {
      title: 'Data Aman',
      description: 'Backup otomatis & enkripsi tingkat enterprise.',
      icon: '🔒'
    },
    {
      title: 'Support 24/7',
      description: 'Tim support siap membantu kapan pun Anda butuh.',
      icon: '💬'
    },
    {
      title: 'Update Gratis',
      description: 'Fitur baru dan improvement tanpa biaya tambahan.',
      icon: '🚀'
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-1">
                {stat.number}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Kenapa Memilih Katalara?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Apa Kata Mereka?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Ibu Siti',
                business: 'Warung Makan Sederhana',
                text: 'Sejak pakai Katalara, pencatatan jadi lebih rapi. Saya bisa tau untung rugi setiap hari!',
                avatar: '👩'
              },
              {
                name: 'Pak Budi',
                business: 'Toko Elektronik',
                text: 'Fitur stock alert sangat membantu. Gak pernah lagi kehabisan barang laris.',
                avatar: '👨'
              },
              {
                name: 'Mbak Dewi',
                business: 'Fashion Online Shop',
                text: 'Gratis tapi fiturnya lengkap! Perfect untuk UMKM seperti saya.',
                avatar: '👩‍🦰'
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center text-2xl mr-3">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.business}</div>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.text}"</p>
                <div className="mt-4 text-yellow-400 text-xl">⭐⭐⭐⭐⭐</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

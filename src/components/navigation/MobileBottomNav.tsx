'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  HomeIcon,
  CubeIcon,
  BuildingStorefrontIcon,
  Bars3Icon,
  PlusIcon,
  PlusCircleIcon,
  MinusCircleIcon
} from '@heroicons/react/24/outline'

type MobileBottomNavProps = {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  storefrontSlug: string | null
}

export function MobileBottomNav({ sidebarOpen, setSidebarOpen, storefrontSlug }: MobileBottomNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [fabOpen, setFabOpen] = useState(false)

  useEffect(() => {
    setFabOpen(false)
  }, [pathname])

  const activeKey = useMemo(() => {
    if (!pathname) return 'home'
    if (pathname.startsWith('/dashboard/products')) return 'products'
    if (pathname.startsWith('/dashboard/lapak')) return 'storefront'
    if (pathname.startsWith('/dashboard')) return 'home'
    return 'home'
  }, [pathname])

  const go = (href: string) => {
    setFabOpen(false)
    router.push(href)
  }

  const onStorefront = () => {
    setFabOpen(false)
    // Prefer dashboard lapak management. Users can still open public storefront from there.
    router.push('/dashboard/lapak')
  }

  return (
    <>
      {/* Backdrop for FAB menu (blur main screen) */}
      {fabOpen && (
        <button
          aria-label="Tutup menu cepat"
          className="fixed inset-0 z-40 lg:hidden bg-black/10 backdrop-blur-sm"
          onClick={() => setFabOpen(false)}
        />
      )}

      {/* FAB menu */}
      {fabOpen && (
        <div className="fixed z-50 left-1/2 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] w-[min(22rem,calc(100vw-2rem))] lg:hidden">
          <div className="space-y-2">
            <button
              onClick={() => go('/dashboard/input-income')}
              className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 bg-white/95 backdrop-blur shadow-xl border border-gray-200 hover:bg-white active:scale-[0.995] transition"
            >
              <span className="h-10 w-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
                <PlusCircleIcon className="h-6 w-6" />
              </span>
              <span className="flex-1 text-left">
                <span className="block text-sm font-semibold text-gray-900">Pendapatan</span>
                <span className="block text-xs text-gray-500">Penjualan, jasa, pemasukan lain</span>
              </span>
            </button>

            <button
              onClick={() => go('/dashboard/input-expenses')}
              className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 bg-white/95 backdrop-blur shadow-xl border border-gray-200 hover:bg-white active:scale-[0.995] transition"
            >
              <span className="h-10 w-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
                <MinusCircleIcon className="h-6 w-6" />
              </span>
              <span className="flex-1 text-left">
                <span className="block text-sm font-semibold text-gray-900">Pengeluaran</span>
                <span className="block text-xs text-gray-500">Belanja, operasional, biaya</span>
              </span>
            </button>

            {storefrontSlug && (
              <p className="mt-1 text-[11px] text-white/90 text-center drop-shadow">
                Lapak publik: /lapak/{storefrontSlug}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Navigasi bawah"
      >
        <div className="mx-auto w-full max-w-6xl">
          <div className="bg-white/95 backdrop-blur border-t border-gray-200">
            <div className="grid grid-cols-5 items-center h-16 px-2">
              <BottomItem
                label="Home"
                active={activeKey === 'home'}
                onClick={() => go('/dashboard')}
                icon={<HomeIcon className="h-6 w-6" />}
              />

              <BottomItem
                label="Produk"
                active={activeKey === 'products'}
                onClick={() => go('/dashboard/products')}
                icon={<CubeIcon className="h-6 w-6" />}
              />

              {/* Center + */}
              <div className="flex items-center justify-center">
                <button
                  onClick={() => setFabOpen((v) => !v)}
                  className="-mt-7 h-14 w-14 rounded-full bg-[#1088ff] text-white shadow-xl flex items-center justify-center hover:bg-[#0d6ecc] active:scale-[0.98] transition ring-4 ring-white"
                  aria-label="Quick input"
                  aria-expanded={fabOpen}
                >
                  <PlusIcon className={`h-7 w-7 transition-transform ${fabOpen ? 'rotate-45' : ''}`} />
                </button>
              </div>

              <BottomItem
                label="Lapak"
                active={activeKey === 'storefront'}
                onClick={onStorefront}
                icon={<BuildingStorefrontIcon className="h-6 w-6" />}
              />

              <BottomItem
                label={sidebarOpen ? 'Hide' : 'Sidebar'}
                active={sidebarOpen}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                icon={<Bars3Icon className="h-6 w-6" />}
              />
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

function BottomItem({
  label,
  icon,
  active,
  onClick
}: {
  label: string
  icon: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 rounded-lg py-2 transition-colors ${
        active ? 'text-[#1088ff]' : 'text-gray-500 hover:text-gray-700'
      }`}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      type="button"
    >
      <span className={`${active ? 'text-[#1088ff]' : 'text-gray-500'}`}>{icon}</span>
      <span className="text-[11px] font-medium leading-none">{label}</span>
    </button>
  )
}

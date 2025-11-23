// ============================================================================
// COMPONENT: WhatsApp Community Button (Floating Action)
// ============================================================================
// Floating button untuk join WhatsApp community group
// Desain transparan & subtle untuk UX yang lebih bersih
// ============================================================================

'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'

export default function WhatsAppGroupButton() {
  const [isHovered, setIsHovered] = useState(false)
  
  // WhatsApp Group Link - GANTI dengan link group Katalara yang sebenarnya
  const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/YOUR_GROUP_CODE_HERE'
  
  const handleClick = () => {
    // Buka WhatsApp group di tab baru
    window.open(WHATSAPP_GROUP_LINK, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      {/* Floating Action Button - Transparan & Subtle */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed bottom-6 right-6 z-40 bg-green-500/70 backdrop-blur-md text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 hover:bg-green-500/90 group"
        title="Join Komunitas WhatsApp"
        aria-label="Join Katalara WhatsApp Community"
      >
        {/* WhatsApp Icon */}
        <MessageCircle className="w-6 h-6" />
        
        {/* Pulse Animation untuk menarik perhatian */}
        <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20" />
        
        {/* Tooltip on Hover */}
        {isHovered && (
          <div className="absolute bottom-full right-0 mb-2 px-4 py-2 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-lg whitespace-nowrap animate-fade-in">
            💬 Join Komunitas Katalara
            <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900/90" />
          </div>
        )}
      </button>

      {/* Optional: Add CSS animation for fade-in */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  )
}

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
        className="fixed bottom-6 right-6 z-40 bg-green-500/85 backdrop-blur-md text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 hover:bg-green-500/95 group"
        title="Join Komunitas WhatsApp"
        aria-label="Join Katalara WhatsApp Community"
      >
        {/* WhatsApp Icon */}
        <MessageCircle className="w-6 h-6" />
        
        {/* Subtle glow effect - no white flash */}
        <span className="absolute inset-0 rounded-full bg-green-400/20 animate-pulse-soft" />
        
        {/* Tooltip on Hover */}
        {isHovered && (
          <div className="absolute bottom-full right-0 mb-2 px-4 py-2 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-lg whitespace-nowrap animate-fade-in">
            💬 Join Komunitas Katalara
            <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900/90" />
          </div>
        )}
      </button>

      {/* Custom animations */}
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
        
        @keyframes pulse-soft {
          0%, 100% {
            opacity: 0.15;
            transform: scale(1);
          }
          50% {
            opacity: 0.25;
            transform: scale(1.1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        
        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
        }
      `}</style>
    </>
  )
}

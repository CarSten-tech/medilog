'use client'

export default function PillLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <style>{`
        @keyframes runVertical {
          /* Pfadlänge ca. 72 */
          to { stroke-dashoffset: -72; } 
        }
        .pill-runner {
          /* 9px Strich (Höhe), Rest Lücke */
          stroke-dasharray: 9 63; 
          /* Schneller: 2.0s */
          animation: runVertical 2.0s linear infinite;
        }
      `}</style>
      
      {/* Container gedreht (-45°) */}
      <div className="relative w-16 h-16 -rotate-45">
        
        {/* 1. HINTERGRUND: Pille (22x9) - Länglicher */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5" // Dicker (wie Bild)
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute inset-0 w-full h-full text-gray-200"
        >
          {/* x=1, y=7.5, w=22, h=9, r=4.5 */}
          <rect x="1" y="7.5" width="22" height="9" rx="4.5" />
          {/* Mittelstrich */}
          <line x1="12" y1="7.5" x2="12" y2="16.5" />
        </svg>

        {/* 2. VORDERGRUND: Läufer */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3" // Läufer etwas dicker hervorheben
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute inset-0 w-full h-full text-[#339989]"
        >
          {/* 
            Pfad für 22x9 Pille (Mitte 12, 7.5):
            M 12 7.5        -> Start Oben Mitte
            L 5.5 7.5       -> Nach Links
            A 4.5 4.5 0 0 0 5.5 16.5 -> Bogen Links
            L 12 16.5       -> Mitte Unten
            L 12 7.5        -> HOCH
            L 18.5 7.5      -> Rechts
            A 4.5 4.5 0 0 1 18.5 16.5 -> Bogen Rechts
            L 12 16.5       -> Mitte Unten
            L 12 7.5        -> HOCH
          */}
          <path 
            d="M12 7.5 L5.5 7.5 A4.5 4.5 0 0 0 5.5 16.5 L12 16.5 L12 7.5 L18.5 7.5 A4.5 4.5 0 0 1 18.5 16.5 L12 16.5 L12 7.5" 
            className="pill-runner" 
          />
        </svg>
      </div>
    </div>
  )
}
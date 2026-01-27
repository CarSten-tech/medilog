'use client'

export default function PillLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <style>{`
        @keyframes runVertical {
          /* Gesamtlänge (ca. 76) */
          to { stroke-dashoffset: -76; } 
        }
        .pill-runner {
          /* 10px Strich (Höhe der Mitte), Rest Lücke */
          stroke-dasharray: 10 66; 
          /* Schneller: 2.5s */
          animation: runVertical 2.5s linear infinite;
        }
      `}</style>
      
      {/* Container gedreht (-45°) */}
      <div className="relative w-16 h-16 -rotate-45">
        
        {/* 1. HINTERGRUND: Längliche Pille (22x10) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute inset-0 w-full h-full text-gray-100"
        >
          {/* Länglicher: Breite 22, Höhe 10, Radius 5 */}
          <rect x="1" y="7" width="22" height="10" rx="5" />
          {/* Mittelstrich */}
          <line x1="12" y1="7" x2="12" y2="17" />
        </svg>

        {/* 2. VORDERGRUND: Läufer */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute inset-0 w-full h-full text-[#339989]"
        >
          {/* 
            Pfad für 22x10 Pille (Mitte 12,7):
            M 12 7          -> Start Oben Mitte
            L 6 7           -> Nach Links (6px)
            A 5 5 0 0 0 6 17 -> Bogen Links Unten (Radius 5)
            L 12 17         -> Zur Mitte Unten (6px)
            L 12 7          -> MITTE HOCH (10px)
            L 18 7          -> Nach Rechts (6px)
            A 5 5 0 0 1 18 17 -> Bogen Rechts Unten (Radius 5)
            L 12 17         -> Zur Mitte Unten (6px)
            L 12 7          -> MITTE HOCH (10px - Loop Ende)
          */}
          <path 
            d="M12 7 L6 7 A5 5 0 0 0 6 17 L12 17 L12 7 L18 7 A5 5 0 0 1 18 17 L12 17 L12 7" 
            className="pill-runner" 
          />
        </svg>
      </div>
    </div>
  )
}
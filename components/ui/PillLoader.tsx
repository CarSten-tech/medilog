'use client'

export default function PillLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <style>{`
        @keyframes runVertical {
          /* Gesamtlänge des Pfads ist ca. 80 Einheiten.
             Wir schieben den Dash-Offset um genau diese Länge, 
             damit der Loop nahtlos ist. */
          to { stroke-dashoffset: -78; } 
        }
        .pill-runner {
          /* 12px Strich (Länge der Mitte), Rest Lücke */
          stroke-dasharray: 12 66; 
          /* Langsamer: 3.5s */
          animation: runVertical 3.5s linear infinite;
        }
      `}</style>
      
      {/* Container gedreht (-45°) */}
      <div className="relative w-16 h-16 -rotate-45">
        
        {/* 1. HINTERGRUND: Pille + Mittelstrich */}
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
          {/* Außenrahmen */}
          <rect x="2" y="6" width="20" height="12" rx="6" />
          {/* Statischer Mittelstrich */}
          <line x1="12" y1="6" x2="12" y2="18" />
        </svg>

        {/* 2. VORDERGRUND: Läufer auf Pfad */}
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
            Pfad-Logik für "Linke Hälfte -> Mitte Hoch -> Rechte Hälfte -> Mitte Hoch":
            M 12 6          -> Start Oben Mitte
            L 8 6           -> Nach Links
            A 6 6 0 0 0 8 18 -> Bogen Links Unten
            L 12 18         -> Zur Mitte Unten
            L 12 6          -> MITTE HOCH (Der senkrechte Strich)
            L 16 6          -> Nach Rechts
            A 6 6 0 0 1 16 18 -> Bogen Rechts Unten
            L 12 18         -> Zur Mitte Unten
            L 12 6          -> MITTE HOCH (Zurück zum Start)
          */}
          <path 
            d="M12 6 L8 6 A6 6 0 0 0 8 18 L12 18 L12 6 L16 6 A6 6 0 0 1 16 18 L12 18 L12 6" 
            className="pill-runner" 
          />
        </svg>
      </div>
    </div>
  )
}
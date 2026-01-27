'use client'

export default function PillLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      {/* Animation: Stroke Offset für den Lauf-Effekt */}
      <style>{`
        @keyframes run8 {
          to { stroke-dashoffset: -100; }
        }
        .pill-runner {
          stroke-dasharray: 20 60; /* Kurzer Strich, lange Lücke */
          animation: run8 2s linear infinite;
        }
      `}</style>
      
      {/* Container gedreht (-45°) für Dynamik */}
      <div className="relative w-16 h-16 -rotate-45">
        
        {/* 1. HINTERGRUND: Normale Pille (Statisch, Grau) */}
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
          <rect x="2" y="6" width="20" height="12" rx="6" />
        </svg>

        {/* 2. VORDERGRUND: Figure-8 Pfad (Animiert, Türkis) */}
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
            Pfad-Logik für eine "Acht" innerhalb der Pille:
            M 8 6           -> Start Oben-Links (Beginn der Rundung)
            A 6 6 0 0 0 8 18 -> Linker Halbkreis nach Unten
            L 16 6          -> Diagonale nach Oben-Rechts (Kreuzung)
            A 6 6 0 0 1 16 18 -> Rechter Halbkreis nach Unten
            L 8 6           -> Diagonale zurück zum Start (Kreuzung)
          */}
          <path 
            d="M 8 6 A 6 6 0 0 0 8 18 L 16 6 A 6 6 0 0 1 16 18 L 8 6" 
            className="pill-runner" 
          />
        </svg>
      </div>
    </div>
  )
}
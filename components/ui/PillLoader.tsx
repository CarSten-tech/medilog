'use client'

export default function PillLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      {/* Hier definieren wir die Animation lokal für diese Komponente. 
        Das macht den Code "Portable" (alles in einer Datei).
      */}
      <style>{`
        @keyframes runAround {
          to {
            /* Die Summe aus Strich (20) und Lücke (55) = 75. 
               Das Minus sorgt für die Laufrichtung. */
            stroke-dashoffset: -75;
          }
        }
        .pill-runner {
          /* 20px Farbe, 55px Lücke (Transparent) */
          stroke-dasharray: 20 55;
          /* Die Animation: 1.5 Sekunden, gleichmäßig, unendlich */
          animation: runAround 1.5s linear infinite;
        }
      `}</style>

      {/* Der Container dreht die Pille schräg (-45 Grad) */}
      <div className="relative w-16 h-16 -rotate-45">
        
        {/* 1. HINTERGRUND (Die graue Schiene) - Statisch */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute inset-0 w-full h-full text-gray-200"
        >
          {/* Eine einfache Form mit abgerundeten Ecken (Pille) */}
          <rect x="2" y="6" width="20" height="12" rx="6" />
        </svg>

        {/* 2. VORDERGRUND (Der farbige Läufer) - Animiert */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          // Hier ändern wir die Farbe (z.B. dein Türkis)
          className="absolute inset-0 w-full h-full text-[#339989]"
        >
          {/* Wir wenden unsere CSS-Klasse 'pill-runner' an */}
          <rect x="2" y="6" width="20" height="12" rx="6" className="pill-runner" />
        </svg>

      </div>
    </div>
  );
}
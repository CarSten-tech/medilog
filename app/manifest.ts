import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MediLog',
    short_name: 'MediLog',
    description: 'Dein persönlicher Begleiter für eine sichere und einfache Medikationsplanung.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f0fdfa', // teal-50
    theme_color: '#0d9488', // teal-600
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}

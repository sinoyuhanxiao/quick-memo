export default function manifest() {
  return {
    name: 'Quick-Memo Dashboard',
    short_name: 'QuickMemo',
    description: 'Capture and organize ideas instantly',
    start_url: '/mobile',
    display: 'standalone',
    background_color: '#f8f6f0',
    theme_color: '#c19a6b',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

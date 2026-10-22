import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The tile server only sends CORS headers to allowlisted origins, so in dev
// map requests are routed through /__map/<host>/ (see MapView's transformRequest).
const MAP_HOSTS = ['v4map', 'v4mapa', 'v4mapb', 'v4mapc', 'v4mapd']

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: Object.fromEntries(
      MAP_HOSTS.map((host) => [
        `/__map/${host}/`,
        {
          target: `https://${host}.amtraker.com`,
          changeOrigin: true,
          rewrite: (path) => path.replace(`/__map/${host}`, ''),
        },
      ]),
    ),
  },
})

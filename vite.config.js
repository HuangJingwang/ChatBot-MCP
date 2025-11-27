import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/mcp': {
        target: 'http://localhost:3399',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mcp/, '/mcp'),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 转发 cookieId 请求头（注意大小写）
            const cookieId = req.headers.cookieid || req.headers.cookieId
            if (cookieId) {
              proxyReq.setHeader('cookieId', cookieId)
            }
          })
        }
      },
      '/api': {
        target: 'http://localhost:3399',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 确保转发所有必要的请求头
            const cookieId = req.headers.cookieid || req.headers.cookieId
            if (cookieId) {
              proxyReq.setHeader('cookieId', cookieId)
            }
          })
        }
      }
    }
  }
})




import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY for the Google GenAI SDK
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },

    build: {
      // Tăng giới hạn cảnh báo lên 1000kb (1MB) nếu cần, nhưng tốt nhất là chia nhỏ file
      chunkSizeWarningLimit: 1000, 
      rollupOptions: {
        output: {
          // Chia nhỏ các thư viện lớn thành các file riêng (Vendor Chunks)
          manualChunks: {
            'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions'],
            'ai-vendor': ['@google/genai'],
            'react-vendor': ['react', 'react-dom'],
            'icons-vendor': ['lucide-react']
          }
        }
      }
    }
  };
});

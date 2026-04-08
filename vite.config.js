import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Change 'shit-tracker' to your actual GitHub repo name
  // e.g. if your repo is github.com/yourname/poop-dashboard, use '/poop-dashboard/'
  // If you use a custom domain, set base: '/'
  base: '/ShitSquad/',
})

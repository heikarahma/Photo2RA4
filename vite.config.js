import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true, // Listen on all local IP addresses (0.0.0.0)
    port: 5174,
    open: false
  }
});

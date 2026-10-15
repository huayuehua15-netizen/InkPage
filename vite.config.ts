import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' 使构建产物可部署在任意子路径（如 GitHub Pages 项目页）
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: 'es2018',
  },
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), {name:'admin-page-access',configureServer(server){
      server.middlewares.use(async(req,res,next)=>{
        if(!/^\/admin(?:\/|$)/.test((req.url||'').split('?')[0]))return next();
        try{const response=await fetch('http://127.0.0.1:3001/admin',{headers:{cookie:req.headers.cookie||''},signal:AbortSignal.timeout(5000)});
          if(response.status===204)return next();
          res.statusCode=response.status;res.setHeader('Cache-Control','no-store');res.end('Administrator access required.');
        }catch{res.statusCode=503;res.end('Authentication service unavailable.');}
      });
    }}],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: { "/api": "http://127.0.0.1:3001" },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

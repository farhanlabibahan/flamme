import {defineConfig, loadEnv} from 'vite';

// Dev only: serve api/ask.js at /api/ask so `npm run dev` works without Vercel.
// Production on Vercel uses the real serverless function.
const localApi = () => ({
  name: 'local-api',
  apply: 'serve',
  configureServer(server) {
    Object.assign(process.env, loadEnv('development', process.cwd(), ''));
    server.middlewares.use('/api/ask', async (req, res) => {
      let raw = '';
      for await (const c of req) raw += c;
      try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
      res.status = code => { res.statusCode = code; return res; };
      res.json = obj => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(obj)); };
      const {default: handler} = await server.ssrLoadModule('/api/ask.js');
      await handler(req, res);
    });
  },
});

export default defineConfig({
  plugins: [localApi()],
  build: {rollupOptions: {output: {manualChunks: {three: ['three', 'three/addons/controls/OrbitControls.js']}}}},
});

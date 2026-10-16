# Luxe Store

Production-ready e-commerce app with a React/Vite frontend and an Express/MongoDB API.

## Local setup

1. Create local environment files from the committed templates:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   Copy-Item frontend/.env.example frontend/.env
   ```

2. Set the real MongoDB Atlas connection string and a random 32+ character `JWT_SECRET` in `backend/.env`. Set `FRONTEND_URL` and `CLIENT_ORIGIN` to the frontend origin.

3. Update `frontend/.env` with the API URL (including `/api`), API asset base URL, and public frontend URL. `VITE_*` values are public browser configuration—never add passwords or secrets there.

4. Install and run each app in separate terminals:

   ```powershell
   cd backend
   npm ci
   npm start
   ```

   ```powershell
   cd frontend
   npm ci
   npm run dev
   ```

## Verification

```powershell
cd backend
npm test

cd ../frontend
npm run lint
npm run build
```

The backend is ready when `http://localhost:<PORT>/api/health` responds with `{"status":"ok","database":"mongodb"}`.

## Deploying to Vercel

Deploy the two folders as separate Vercel projects from the same Git repository. The frontend proxy below lets the default `*.vercel.app` URLs keep browser auth cookies on the frontend origin. Custom hostnames such as `shop.example.com` and `api.example.com` are also supported.

The `.env` files are git-ignored, so enter these values in Vercel Project Settings as well.

1. Import the repository and set the backend project **Root Directory** to `backend`.
2. Add backend production variables: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET` (at least 32 characters), `FRONTEND_URL=https://e-commerce-frontend-abanob-server.vercel.app`, `CLIENT_ORIGIN=https://e-commerce-frontend-abanob-server.vercel.app`, and optional `ADMIN_EMAILS`.
3. Deploy the backend, copy its URL, and confirm `<backend-url>/api/health` works.
4. Import the same repository again and set the frontend project **Root Directory** to `frontend`.
5. Set `VITE_API_URL` to `https://e-commerce-frontend-abanob-server.vercel.app/api`, `VITE_ASSET_URL` to `https://ecommerce-server-api-abanob.vercel.app`, and `VITE_APP_URL` to `https://e-commerce-frontend-abanob-server.vercel.app`. Set the remaining public values such as `VITE_APP_NAME` and `VITE_API_TIMEOUT` from `frontend/.env.example`.
6. The frontend `vercel.json` proxies `/api/*` to the backend. Vercel forwards the request while keeping the browser URL on the frontend origin, which keeps auth cookies first party. If the backend URL changes, update that rewrite and `VITE_ASSET_URL`.
7. Deploy the frontend after setting its variables and rewrite.

Both packages declare Node.js `24.x`; Vercel should use that runtime for builds and functions.

`frontend/vercel.json` handles single-page app routing and response headers. `backend/vercel.json` exposes the Express app as a Vercel Function.

## Security and rendering notes

- Browser sign-in uses a seven-day HttpOnly, Secure, `SameSite=Lax` cookie in production. The frontend `/api/*` Vercel rewrite keeps that cookie on the frontend origin even when the API uses a separate hostname. Set `FRONTEND_URL` and `CLIENT_ORIGIN` to the exact UI origin. The API also accepts bearer tokens for native clients.
- Login and registration throttles are held in process memory. Use a shared rate-limit store when running multiple backend instances.
- The storefront is a client-rendered Vite app. Product metadata is generated after the page loads; add prerendering or server rendering if product pages need HTML metadata before JavaScript runs.
"# E-Commerce" 
"# E-Commerce" 

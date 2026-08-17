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

Deploy the two folders as separate Vercel projects from the same Git repository:

1. Import the repository and set the backend project **Root Directory** to `backend`.
2. Add production environment variables: `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`, `CLIENT_ORIGIN`, and `ADMIN_EMAILS` (optional). Set the two origin variables to the final frontend URL.
3. Deploy the backend, copy its URL, and confirm `<backend-url>/api/health` works.
4. Import the same repository again and set the frontend project **Root Directory** to `frontend`.
5. Add all values from `frontend/.env.example`; use `<backend-url>/api` for `VITE_API_URL`, `<backend-url>` for `VITE_ASSET_URL`, and the final frontend URL for `VITE_APP_URL`.
6. Deploy the frontend. If its URL changed from the value in backend `FRONTEND_URL`/`CLIENT_ORIGIN`, update those backend variables and redeploy the backend.

`frontend/vercel.json` handles single-page app routing and response headers. `backend/vercel.json` exposes the Express app as a Vercel Function.

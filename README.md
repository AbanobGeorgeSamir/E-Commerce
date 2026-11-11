# Luxe Store

Full-stack e-commerce platform with a React storefront, an Express REST API and a MongoDB database. Customers browse products, check out with a payment receipt and track their orders. Administrators manage the catalog and orders.

**[Live storefront](https://e-commerce-frontend-abanob-server.vercel.app)** · **[API health](https://ecommerce-server-api-abanob.vercel.app/api/health)**

[![CI](https://github.com/AbanobGeorgeSamir/E-Commerce/actions/workflows/ci.yml/badge.svg)](https://github.com/AbanobGeorgeSamir/E-Commerce/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

<!-- Add screenshots here, for example: ![Storefront](docs/storefront.png) -->

## Features

**Storefront**
- Product catalog with categories and product detail pages
- Shopping cart persisted in the browser
- Registration and login with JWT authentication
- Checkout with validated shipping details, Cash on Delivery and a required payment-receipt image
- Order history and order detail pages

**Admin**
- Dashboard overview
- Create, edit and delete products and categories
- View orders and move them through an enforced status workflow (pending, processing, shipped, delivered, or cancelled)

**Security and reliability**
- Checkout runs in a MongoDB transaction and decrements stock atomically, only when enough stock is available, so products cannot be oversold
- Passwords hashed with scrypt and a per-user salt
- JWT stored in a seven-day `HttpOnly`, `Secure`, `SameSite=Lax` cookie in production; bearer tokens are also accepted for native clients
- Rate limiting on login and registration
- Server-side validation of shipping fields and receipt images (AVIF, JPEG, PNG or WebP, up to 2 MB)
- Health check endpoint at `/api/health`
- Backend tests with Node's built-in test runner
- Postman collection with every endpoint in [`docs/postman`](docs/postman/luxe-store.postman_collection.json)

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, React Router, Axios, Tailwind CSS, React Hot Toast, Lucide icons |
| Backend | Node.js 24, Express 5, Mongoose 9, JSON Web Tokens |
| Database | MongoDB (Atlas) |
| Hosting | Vercel (frontend and API as separate projects) |

## Project Structure

```text
backend/    Express API: routes, models, middleware, utils, scripts, tests
frontend/   React + Vite storefront and admin interface
```

## API Overview

All routes are prefixed with `/api`.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/register`, `/login`, `/logout` | Public | Authentication |
| GET | `/user` | User | Current user |
| GET | `/products`, `/products/:id` | Public | List and view products |
| POST, PUT, DELETE | `/products`, `/products/:id` | Admin | Manage products |
| GET | `/categories`, `/categories/:id` | Public | List and view categories |
| POST, PUT, DELETE | `/categories`, `/categories/:id` | Admin | Manage categories |
| POST | `/checkout` | User | Place an order |
| GET | `/orders`, `/orders/:id` | User | Order history and details |
| PATCH | `/orders/:id/status` | Admin | Update order status |
| GET | `/admin/dashboard` | Admin | Dashboard data |
| GET | `/health` | Public | API and database status |

## Getting Started

**Requirements:** Node.js 24.x and a MongoDB database (a free MongoDB Atlas cluster works).

1. Clone the repository and create the environment files:

   ```bash
   git clone https://github.com/AbanobGeorgeSamir/E-Commerce.git
   cd E-Commerce
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

   On Windows PowerShell use `Copy-Item` instead of `cp`.

2. Edit `backend/.env`:

   | Variable | Description |
   | --- | --- |
   | `MONGODB_URI` | MongoDB connection string |
   | `JWT_SECRET` | Random secret, at least 32 characters |
   | `FRONTEND_URL`, `CLIENT_ORIGIN` | Origin of the frontend, used for CORS and cookies |
   | `ADMIN_EMAILS` | Optional list of admin emails |
   | `PORT`, `NODE_ENV` | Server port and environment |

3. Edit `frontend/.env`. These values are public browser configuration, so never put secrets in them:

   | Variable | Description |
   | --- | --- |
   | `VITE_API_URL` | API URL including `/api` |
   | `VITE_ASSET_URL` | Base URL for API-hosted assets |
   | `VITE_APP_URL` | Public URL of the frontend |
   | `VITE_APP_NAME`, `VITE_API_TIMEOUT` | App name and request timeout in ms |

4. Install and run both apps in separate terminals:

   ```bash
   cd backend && npm ci && npm start
   ```

   ```bash
   cd frontend && npm ci && npm run dev
   ```

5. Check that the API is up: `http://localhost:<PORT>/api/health` returns `{"status":"ok","database":"mongodb"}`.

To make a user an administrator:

```bash
cd backend
npm run make-admin -- user@example.com
```

## API Testing with Postman

Import [`docs/postman/luxe-store.postman_collection.json`](docs/postman/luxe-store.postman_collection.json) into Postman, set `baseUrl` (default `http://localhost:8000/api`), and run **Auth > Login** first. Postman keeps the auth cookie for the following requests. Admin requests need an account promoted with `npm run make-admin`.

## Testing

```bash
cd backend && npm test          # syntax checks + Node test runner (needs JWT_SECRET in backend/.env)
cd frontend && npm run lint && npm run build
```

GitHub Actions runs the backend tests and the frontend lint and build on every push and pull request.

## Deployment

| Component | Production URL |
| --- | --- |
| Storefront (React) | [e-commerce-frontend-abanob-server.vercel.app](https://e-commerce-frontend-abanob-server.vercel.app) |
| REST API (Express) | [ecommerce-server-api-abanob.vercel.app](https://ecommerce-server-api-abanob.vercel.app/api/health) |

Deploy the two folders as separate Vercel projects from the same repository.

1. **Backend:** set the project Root Directory to `backend`, add the backend environment variables (`NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`, `CLIENT_ORIGIN`, optional `ADMIN_EMAILS`) and deploy. Confirm `<backend-url>/api/health` responds.
2. **Frontend:** set the Root Directory to `frontend`, add the `VITE_*` variables and update the `/api/*` rewrite in `frontend/vercel.json` to point at your backend URL. The rewrite keeps the auth cookie on the frontend origin.

Both packages target Node.js 24.x.

## Notes

- Login and registration rate limits are kept in process memory. Use a shared store such as Redis if you run several backend instances.
- The storefront is a client-rendered Vite app. Add prerendering or server rendering if product pages need HTML metadata before JavaScript runs.

## License

Released under the [MIT License](LICENSE).

## Author

**Abanoub George Samir** · Junior Full-Stack Developer · [Portfolio](https://devabanobgeorge.vercel.app) · [LinkedIn](https://www.linkedin.com/in/abanob-george-samir) · [GitHub](https://github.com/AbanobGeorgeSamir)

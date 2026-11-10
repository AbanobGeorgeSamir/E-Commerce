# 🛒 Luxe Store — Full-Stack MERN E-Commerce

A modern, responsive e-commerce web platform engineered with a React 19 / Vite storefront, Tailwind CSS v4 styling, and an Express 5 / MongoDB Atlas backend API deployed on Vercel.

[![Live Storefront](https://img.shields.io/badge/Live_Site-Vercel_Deployment-blue?style=for-the-badge&logo=vercel)](https://e-commerce-frontend-abanob-server.vercel.app)
[![API Health](https://img.shields.io/badge/API_Health-Passing-success?style=for-the-badge&logo=node.js)](https://ecommerce-server-api-abanob.vercel.app/api/health)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 🌟 Key Features

- **Product Catalog & Discovery:** Dynamic product browsing, categories, price filtering, and keyword search.
- **Cart & Order Management:** Client-side cart state management with real-time tax and shipping calculations.
- **Authentication & Security:** Secure JWT session handling with HttpOnly cookies, password hashing with bcrypt, and express-rate-limit protection.
- **Admin Control Panel:** Dedicated dashboard routes to create, edit, and delete products, organize categories, and review customer orders.
- **Vercel Serverless Architecture:** Frontend reverse-proxy rewrite to ensure first-party cookie domains and secure cross-origin communication.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite 8, Tailwind CSS v4, Axios, React Router 7, Lucide Icons
- **Backend:** Node.js 24 LTS, Express 5, Mongoose 9, JWT
- **Database:** MongoDB Atlas (TLS enabled)
- **Deployment:** Vercel (Fluid Compute & Edge Network)

---

## 📐 System Architecture

```
[ Browser Client ]
        │
        ▼
[ React 19 SPA (Vercel Edge) ] ─── (/api/* proxy) ───► [ Express 5 Serverless (Vercel) ]
                                                                     │
                                                                     ▼
                                                          [ MongoDB Atlas Cluster ]
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js 24.x LTS
- MongoDB connection URI

### 2. Backend Configuration
```bash
cd backend
cp .env.example .env
npm install
npm start
```
*Configure `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_ORIGIN` inside `backend/.env`.*

### 3. Frontend Configuration
```bash
cd ../frontend
cp .env.example .env
npm install
npm run dev
```
*Configure `VITE_API_URL=http://localhost:8000/api` inside `frontend/.env`.*

---

## 🌐 Production Deployments

| Component | Target URL |
|---|---|
| **Storefront UI** | [https://e-commerce-frontend-abanob-server.vercel.app](https://e-commerce-frontend-abanob-server.vercel.app) |
| **Backend REST API** | [https://ecommerce-server-api-abanob.vercel.app](https://ecommerce-server-api-abanob.vercel.app) |

---

## 📄 License

This repository is licensed under the [MIT License](LICENSE).

## 👤 Author

**Abanoub George Samir** — [LinkedIn](https://www.linkedin.com/in/abanob-george-samir) · [GitHub](https://github.com/AbanobGeorgeSamir)

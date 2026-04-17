<div align="center">

# 🛒 E-Shop - Modern E-Commerce Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2.1-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-61dafb?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.8.4-47a248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.14-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-000)](https://ui.shadcn.com/)
[![Redux](https://img.shields.io/badge/Redux_Toolkit-2.11.2-764abc?logo=redux&logoColor=white)](https://redux-toolkit.js.org/)
[![Razorpay](https://img.shields.io/badge/Razorpay-2.9.5-005bbb?logo=razorpay&logoColor=white)](https://razorpay.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-2.5.1-3448c5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Vercel](https://img.shields.io/badge/deployed_on-Vercel-black?logo=vercel)](https://store.gravityscript.com)

</div>

---

## 📖 Overview

A **full-featured, production-ready e-commerce platform** built with modern web technologies. It delivers a complete shopping experience with a polished storefront, a capable admin dashboard, secure payment handling, user account management, newsletter tooling, and operational controls like maintenance mode.

This project is designed for real-world commerce workflows, including product discovery, cart and checkout, order tracking, profile and address management, coupon handling, Razorpay payments, Cloudinary media uploads, and email-driven auth flows.

---

## ✨ Features

### 🛍️ Store Front
- **Modern Homepage** - Featured products, promotional sections, newsletter signup, and conversion-focused landing experience
- **Advanced Product Catalog** - Filter by category, price, rating, stock, featured status, and search terms
- **Rich Product Pages** - Slug-based product detail pages with gallery, specs, reviews, and related products
- **Smart Shopping Cart** - Persistent cart experience with quantity updates, coupon support, and cart syncing
- **Flexible Checkout** - Address selection, delivery method support, COD and Razorpay-based payment flows
- **Order Management** - Order history, order detail pages, invoice download, cancellation, returns, and refund handling
- **User Profiles** - Profile editing, password updates, address book management, and wishlist support
- **Store Pages** - About, contact, FAQ, privacy, terms, returns, and track-order pages

### 👨‍💼 Admin Panel
- **Analytics Dashboard** - Revenue and order insights, top products, and category-level reporting
- **Product Management** - Create, update, delete, and bulk-manage products with Cloudinary-backed media
- **Category Management** - Manage catalog categories and storefront organization
- **Coupon Engine** - Create and maintain discount codes with rules, limits, and expiry
- **Order Processing** - Review orders, update statuses, export data, and trigger refunds
- **User Management** - Inspect and manage user accounts from the admin area
- **Newsletter Center** - Subscriber management, exports, welcome emails, and campaign tooling
- **Store Settings** - Update store preferences and control maintenance mode

### 🔐 Authentication & Security
- Email/password registration with verification
- Google OAuth login
- Password reset and password change flows
- NextAuth.js v5 session handling
- Role-based access control for admin routes
- Rate limiting for key auth and form flows when Redis is configured
- CSRF protection on sensitive actions such as payment/order operations

### 🎨 User Experience
- Responsive design for desktop, tablet, and mobile
- Dark/light mode support
- Toast notifications, loading states, error handling, and empty states
- Accessible UI patterns using shadcn/ui and Radix primitives
- Smooth admin and storefront workflows with reusable components

---

## 🚀 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.2.1 | React framework with App Router |
| **React** | 19.0.0 | UI library |
| **TypeScript** | 5.7.2 | Type-safe development |
| **Tailwind CSS** | 3.4.14 | Utility-first styling |
| **shadcn/ui** | Latest | Accessible UI building blocks |
| **Redux Toolkit** | 2.11.2 | Client state management |
| **TanStack Query** | 5.95.2 | Async/server state management |

### Backend & Database
| Technology | Version | Purpose |
|------------|---------|---------|
| **MongoDB** | 8.8.4 | Primary database |
| **Mongoose** | 8.8.4 | ODM for MongoDB |
| **NextAuth.js** | 5.0.0-beta.30 | Authentication and session management |
| **Nodemailer** | 7.0.13 | Transactional email delivery |

### Payments & Media
| Technology | Version | Purpose |
|------------|---------|---------|
| **Razorpay** | 2.9.5 | Payment gateway and refunds |
| **Cloudinary** | 2.5.1 | Media upload and hosting |

### Tools & Utilities
| Technology | Version | Purpose |
|------------|---------|---------|
| **Zod** | 3.23.8 | Runtime validation |
| **TipTap** | 2.9.1 | Rich text editor |
| **Recharts** | 2.12.7 | Charts and analytics |
| **React Hook Form** | 7.53.2 | Form handling |
| **Lucide React** | 0.453.0 | Icon library |
| **bcryptjs** | 2.4.3 | Password hashing |
| **Redis** | 5.11.0 | Optional rate-limit backing store |

---

## 📦 Prerequisites

Before running this project, make sure you have:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MongoDB** local or hosted via [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **npm** package manager
- **Google OAuth credentials**
- **Razorpay account**
- **Cloudinary account**
- **SMTP credentials**

Optional:

- **Redis** for persistent rate limiting

---

## 🔧 Installation

### 1. Clone Repository

```bash
git clone https://github.com/Shubham-Guptaji/Ecommerce_Web_Application.git
cd Ecommerce_Web_Application
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

```bash
cp .env.local.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.local.example .env.local
```

Edit `.env.local` and fill in your credentials:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/ecom

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here-minimum-32-characters
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# Cloudinary (Image Uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
# CLOUDINARY_UPLOAD_FOLDER=ecommerce
# CLOUDINARY_UPLOAD_PRESET=your-upload-preset

# Email (SMTP - Brevo/SendGrid/etc.)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=no-reply@yourdomain.com

# Redis (Optional)
# REDIS_URL=redis://default:password@localhost:6379/0
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_USERNAME=default
# REDIS_PASSWORD=your-redis-password
# REDIS_DB=0
# REDIS_TLS=false
# REDIS_KEY_PREFIX=ecom
```

### 4. External Service Setup

#### Cloudinary Configuration
1. Log in to [Cloudinary](https://cloudinary.com/)
2. Copy your **Cloud Name**, **API Key**, and **API Secret** into `.env.local`
3. Optional: set `CLOUDINARY_UPLOAD_FOLDER` if you want uploads grouped under a custom folder
4. Optional: set `CLOUDINARY_UPLOAD_PRESET` only if your account uses preset-based rules

#### Razorpay Setup
1. Sign up at [Razorpay](https://razorpay.com/)
2. Get your **Key ID** and **Key Secret** from Dashboard → Settings → API Keys
3. Add webhook endpoint:
   - URL: `https://your-domain.com/api/payment/webhook`
   - Events: `payment.captured`, `payment.failed`, `refund.processed`
   - Secret: Set webhook secret in `.env.local`

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and generate an OAuth 2.0 Client ID
3. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Add credentials to `.env.local`

#### Redis Setup (Optional)
1. Provide either `REDIS_URL` or host-based Redis variables
2. If Redis is not configured, the app still runs
3. Rate limiting will fall back to a non-persistent mode

### 5. Seed Database

```bash
npm run seed
```

This creates sample data:
- **5 categories** (Electronics, Clothing, Books, Home & Kitchen, Sports)
- **20 sample products**
- **2 coupon codes** (`SAVE10`, `FLAT100`)
- **1 admin user**
  - Email: `admin@example.com`
  - Password: `Admin@123`

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```text
ecom/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Sign-in, sign-up, forgot/reset password, verify email
│   │   ├── (store)/              # Storefront routes
│   │   │   ├── about/
│   │   │   ├── cart/
│   │   │   ├── categories/
│   │   │   ├── category/[slug]/
│   │   │   ├── checkout/
│   │   │   ├── contact/
│   │   │   ├── faq/
│   │   │   ├── orders/
│   │   │   ├── payment/
│   │   │   ├── products/
│   │   │   ├── profile/
│   │   │   ├── returns/
│   │   │   ├── terms/
│   │   │   ├── track-order/
│   │   │   └── wishlist/
│   │   ├── admin/                # Admin dashboard routes
│   │   │   ├── categories/
│   │   │   ├── coupons/
│   │   │   ├── newsletter/
│   │   │   ├── orders/
│   │   │   ├── products/
│   │   │   ├── settings/
│   │   │   └── users/
│   │   ├── api/                  # API route handlers
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── cart/
│   │   │   ├── categories/
│   │   │   ├── coupons/
│   │   │   ├── health/
│   │   │   ├── newsletter/
│   │   │   ├── orders/
│   │   │   ├── payment/
│   │   │   ├── products/
│   │   │   ├── track-order/
│   │   │   ├── upload/
│   │   │   └── user/
│   │   └── maintenance/
│   ├── components/
│   │   ├── admin/
│   │   ├── cart/
│   │   ├── category/
│   │   ├── checkout/
│   │   ├── editor/
│   │   ├── layout/
│   │   ├── product/
│   │   ├── providers.tsx
│   │   ├── providers/
│   │   ├── shared/
│   │   └── ui/
│   ├── hooks/
│   ├── lib/
│   │   ├── emails/
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── env.ts
│   │   ├── newsletter.ts
│   │   ├── nodemailer.ts
│   │   ├── ratelimit.ts
│   │   ├── razorpay.ts
│   │   └── utils.ts
│   ├── models/
│   ├── schemas/
│   ├── store/
│   └── types/
├── scripts/
│   └── seed.ts
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json
└── package.json
```

---

## 💻 Usage Examples

### Fetch Products with Filters

```typescript
const response = await fetch(
  '/api/products?category=electronics&sortBy=price&sortOrder=asc&page=1&limit=12'
)

const data = await response.json()
return data.data
```

### Add Item to Cart

```typescript
import { useAppDispatch } from '@/hooks/useRedux'
import { addItem } from '@/store/slices/cartSlice'

function ProductPage({
  product,
}: {
  product: { _id: string; name: string; price: number; image?: string }
}) {
  const dispatch = useAppDispatch()

  const handleAddToCart = () => {
    dispatch(
      addItem({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: 1,
      })
    )
  }

  return <button onClick={handleAddToCart}>Add to Cart</button>
}
```

### Checkout with Razorpay

```typescript
const result = await fetch('/api/payment/create-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    addressId: 'address-id',
    deliveryMethod: 'standard',
    couponCode: 'SAVE10',
  }),
}).then((res) => res.json())

const options = {
  key: result.data.key,
  amount: result.data.amount * 100,
  currency: result.data.currency,
  name: result.data.name,
  description: result.data.description,
  order_id: result.data.razorpayOrderId,
  prefill: result.data.prefill,
  handler: async (response: any) => {
    await fetch('/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: result.data.orderId,
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      }),
    })
  },
}

const razorpay = new (window as any).Razorpay(options)
razorpay.open()
```

---

## 📊 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | User registration |
| `POST` | `/api/auth/forgot-password` | Request password reset |
| `POST` | `/api/auth/reset-password` | Reset password using token in request body |
| `GET` | `/api/auth/verify-email?token=...` | Email verification |
| `POST` | `/api/auth/resend-verification` | Resend verification email |

### Product Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | List products with filters and pagination |
| `POST` | `/api/products` | Create product |
| `GET` | `/api/products/by-slug/[slug]` | Get product details by slug |
| `GET` | `/api/products/[id]` | Get product details by ID |
| `PUT` | `/api/products/[id]` | Update product |
| `DELETE` | `/api/products/[id]` | Delete product |

### Order Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/orders` | Get current user orders |
| `POST` | `/api/orders` | Create COD order |
| `GET` | `/api/orders/[id]` | Get order details |
| `DELETE` | `/api/orders/[id]` | Cancel order when eligible |
| `POST` | `/api/orders/[id]/cancel` | Cancel order through dedicated action |
| `POST` | `/api/orders/[id]/return` | Request return/refund |
| `GET` | `/api/orders/[id]/invoice` | Download invoice |

### Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payment/create-order` | Create Razorpay order |
| `POST` | `/api/payment/verify` | Verify payment signature |
| `POST` | `/api/payment/cod` | Create Cash on Delivery order |
| `POST` | `/api/payment/webhook` | Razorpay webhook handler |
| `POST` | `/api/payment/refund/[id]` | Refund eligible order |

### Utility Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/categories` | List categories |
| `POST` | `/api/coupons/validate` | Validate coupon code |
| `POST` | `/api/newsletter/subscribe` | Subscribe to newsletter |
| `GET` | `/api/newsletter/unsubscribe` | Unsubscribe from newsletter |
| `POST` | `/api/track-order` | Track order by details |
| `GET` | `/api/health` | Health check |

---

## 🧪 Scripts & Checks

```bash
# Start development
npm run dev

# Build production bundle
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Type checking
npm run type-check

# Seed sample data
npm run seed
```

Note: the current `lint` script runs ESLint with `--fix`.

---

## 🤝 Contributing

We welcome contributions from the community. A good workflow is:

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make focused changes
5. Run `npm run lint` and `npm run type-check`
6. Commit with clear messages
7. Push and open a pull request

Guidelines:

- Follow existing TypeScript and component conventions
- Reuse patterns from `src/components/ui` and existing app routes
- Keep documentation updated when API behavior changes
- Keep commits small and intentional

---

## 🔒 Security

This application includes multiple security layers:

- **Authentication** - NextAuth.js with session management
- **Authorization** - Admin-only protection for sensitive routes
- **Password Security** - bcrypt hashing
- **Payment Security** - Razorpay signature verification
- **Input Validation** - Zod schemas on key endpoints
- **CSRF Protection** - Applied on sensitive order/payment actions
- **Rate Limiting** - Redis-backed rate limiting when configured
- **Operational Control** - Maintenance mode support for storefront lockdown

If you discover a security issue, please disclose it responsibly instead of posting public exploit details.

---

## 🚢 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/)

1. Push code to GitHub
2. Import the project into [Vercel](https://vercel.com/)
3. Configure all required environment variables
4. Deploy and set your production domain
5. Update `NEXTAUTH_URL` and payment webhook settings

### Manual Deployment

```bash
npm run build
npm run start
```

For VPS deployments, configure:

- Reverse proxy such as Nginx
- SSL certificate
- Environment variables
- Process manager such as PM2, if desired

---

## 📝 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[Next.js](https://nextjs.org/)** - Full-stack React framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Accessible, composable UI components
- **[Vercel](https://vercel.com/)** - Hosting and deployment platform
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Razorpay](https://razorpay.com/)** - Payment gateway
- **[Cloudinary](https://cloudinary.com/)** - Media management
- **[MongoDB](https://www.mongodb.com/)** - Flexible document database

---

## 📞 Support

- **Project URL**: [https://store.gravityscript.com](https://store.gravityscript.com)

---

<div align="center">

Built with care using modern web technologies

[Next.js](https://nextjs.org/) • [React](https://reactjs.org/) • [TypeScript](https://www.typescriptlang.org/) • [MongoDB](https://www.mongodb.com/) • [Tailwind CSS](https://tailwindcss.com/)

</div>

<div align="center">

# 🛒 E-Shop - Modern E-Commerce Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2.1-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-61dafb?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.8.4-47a248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.14-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-000?logo=shadcn/ui)](https://ui.shadcn.com/)
[![Redux](https://img.shields.io/badge/Redux-2.11.2-764abc?logo=redux&logoColor=white)](https://redux.js.org/)
[![Razorpay](https://img.shields.io/badge/Razorpay-2.9.5-005bbb?logo=razorpay&logoColor=white)](https://razorpay.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-2.5.1-3448c5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)


[![GitHub license](https://img.shields.io/github/license/your-username/ecom)](LICENSE)
[![CodeFactor](https://www.codefactor.io/repository/github/your-username/ecom/badge)](https://www.codefactor.io/repository/github/your-username/ecom)
[![Vercel](https://img.shields.io/badge/deployed_on-Vercel-black?logo=vercel)](https://vercel.com)

</div>

---

## 📖 Overview

A **full-featured, production-ready e-commerce platform** built with modern web technologies. This application provides a complete online shopping experience with a powerful admin dashboard, secure payment processing, and seamless user management.

Whether you're launching a small boutique or scaling to enterprise level, this platform offers the flexibility, security, and performance needed for today's competitive e-commerce landscape.

## ✨ Features

### 🛍️ Store Front
- **Stunning Homepage** - Hero sections, featured products, flash sales, and promotional banners
- **Advanced Product Catalog** - Filter by category, price, ratings; sort and paginate effortlessly
- **Rich Product Pages** - Image galleries, specifications, customer reviews, and related products
- **Smart Shopping Cart** - Persistent cart with localStorage sync and quantity management
- **Seamless Checkout** - Multi-step process with address book and order summary
- **Secure Payments** - Razorpay integration with signature verification
- **Order Management** - Track orders, view history, and real-time status updates
- **User Profiles** - Account settings, address management, and wishlist

### 👨‍💼 Admin Panel
- **Analytics Dashboard** - Revenue charts, top products, order statistics, and KPIs
- **Product Management** - Full CRUD, bulk actions, Cloudinary image uploads
- **Order Processing** - View, update status, track shipments, handle refunds
- **User Management** - Role-based access, account status control
- **Category System** - Hierarchical categories with images and SEO-friendly URLs
- **Coupon Engine** - Create discount codes with percentage/fixed amounts
- **Store Settings** - Configure email templates and store preferences

### 🔐 Authentication & Security
- Email/password registration with verification
- Google OAuth social login
- Password reset with secure tokens
- Session management with NextAuth.js v5
- Role-based access control (admin vs customer)

### 🎨 User Experience
- Dark/Light mode toggle with system preference detection
- Fully responsive design (mobile, tablet, desktop)
- Smooth animations with Tailwind CSS
- Loading states and error boundaries
- Real-time search and filtering

---

## 🚀 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.2.1 | React framework with App Router |
| **React** | 19.0.0 | UI library |
| **TypeScript** | 5.7.2 | Type-safe JavaScript |
| **Tailwind CSS** | 3.4.14 | Utility-first styling |
| **shadcn/ui** | Latest | Pre-built accessible components |
| **Redux Toolkit** | 2.11.2 | State management |
| **TanStack Query** | 5.95.2 | Server state management |

### Backend & Database
| Technology | Version | Purpose |
|------------|---------|---------|
| **MongoDB** | 8.8.4 | Primary database |
| **Mongoose** | 8.8.4 | ODM for MongoDB |
| **NextAuth.js** | 5.0.0-beta.30 | Authentication |
| **Nodemailer** | 7.0.13 | Email delivery |

### Payments & Media
| Technology | Version | Purpose |
|------------|---------|---------|
| **Razorpay** | 2.9.5 | Payment gateway |
| **Cloudinary** | 2.5.1 | Image hosting/optimization |

### Tools & Utilities
| Technology | Version | Purpose |
|------------|---------|---------|
| **Zod** | 3.23.8 | Runtime validation |
| **TipTap** | 2.9.1 | Rich text editor |
| **Recharts** | 2.12.7 | Data visualization |
| **React Hook Form** | 7.53.2 | Form management |
| **Lucide Icons** | 0.453.0 | Icon library |
| **BCryptjs** | 2.4.3 | Password hashing |

---

## 📦 Prerequisites

Before running this project, make sure you have:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MongoDB** - Local installation or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account
- **Git** for version control
- **npm** or **yarn** package manager

---

## 🔧 Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-username/ecom.git
cd ecom
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your credentials:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/ecom

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here-minimum-32-characters
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (Optional)
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

# Email (SMTP - Brevo/SendGrid/etc.)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-smtp-password
SMTP_FROM=no-reply@yourdomain.com

# App Settings (Optional)
NEXT_PUBLIC_APP_NAME=E-Shop
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. External Service Setup

#### Cloudinary Configuration
1. Log in to [Cloudinary](https://cloudinary.com/)
2. Copy your **Cloud Name**, **API Key**, and **API Secret** into `.env.local`
3. Optional: set `CLOUDINARY_UPLOAD_FOLDER` if you want uploads grouped under a custom folder
4. Optional: set `CLOUDINARY_UPLOAD_PRESET` only if your Cloudinary account is configured to require preset-based rules

#### Razorpay Setup
1. Sign up at [Razorpay](https://razorpay.com/)
2. Get your **Key ID** and **Key Secret** from Dashboard → Settings → API Keys
3. Add webhook endpoint:
   - URL: `https://your-domain.com/api/payment/webhook`
   - Events: `payment.captured`, `payment.failed`, `refund.processed`
   - Secret: Set webhook secret in `.env.local`

#### Google OAuth (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Credentials → OAuth 2.0 Client ID
3. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Add credentials to `.env.local`

### 5. Seed Database

```bash
npm run seed
```

This creates sample data:
- **5 categories** (Electronics, Clothing, Books, Home & Kitchen, Sports)
- **20 sample products** with images
- **2 coupon codes** (SAVE10, FLAT100)
- **1 admin user**:
  - Email: `admin@example.com`
  - Password: `Admin@123`

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
ecom/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Authentication routes (grouped)
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   ├── sign-in/
│   │   │   ├── sign-up/
│   │   │   └── verify-email/
│   │   ├── (store)/             # Store front routes
│   │   │   ├── cart/
│   │   │   ├── categories/
│   │   │   ├── checkout/
│   │   │   ├── orders/
│   │   │   ├── products/
│   │   │   └── profile/
│   │   ├── admin/              # Admin panel routes
│   │   │   ├── categories/
│   │   │   ├── coupons/
│   │   │   ├── orders/
│   │   │   ├── products/
│   │   │   ├── settings/
│   │   │   └── users/
│   │   ├── api/                # API route handlers
│   │   │   ├── auth/
│   │   │   ├── cart/
│   │   │   ├── categories/
│   │   │   ├── coupons/
│   │   │   ├── orders/
│   │   │   ├── payment/
│   │   │   ├── products/
│   │   │   ├── reviews/
│   │   │   ├── upload/
│   │   │   └── user/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/             # Navbar, Footer, Sidebar
│   │   ├── product/            # Product cards, gallery, etc.
│   │   ├── cart/               # Cart drawer, item cards
│   │   ├── checkout/           # Checkout wizard
│   │   ├── admin/              # Admin panel components
│   │   └── shared/             # Reusable utilities
│   ├── lib/
│   │   ├── db.ts               # MongoDB connection
│   │   ├── auth.ts             # NextAuth configuration
│   │   ├── nodemailer.ts       # Email service setup
│   │   ├── cloudinary.ts       # Cloudinary client
│   │   ├── razorpay.ts         # Razorpay instance
│   │   └── utils.ts            # Helper functions
│   ├── models/                 # Mongoose schemas
│   │   ├── User.ts
│   │   ├── Product.ts
│   │   ├── Category.ts
│   │   ├── Order.ts
│   │   ├── Cart.ts
│   │   ├── Coupon.ts
│   │   └── Review.ts
│   ├── hooks/                  # Custom React hooks
│   │   ├── useCart.ts
│   │   ├── useLocalStorage.ts
│   │   └── useMediaQuery.ts
│   ├── store/                  # Redux Toolkit
│   │   ├── index.ts
│   │   ├── slices/
│   │   │   ├── cartSlice.ts
│   │   │   └── uiSlice.ts
│   ├── types/                  # TypeScript definitions
│   │   ├── product.ts
│   │   ├── order.ts
│   │   └── user.ts
│   ├── schemas/                # Zod validation
│   │   ├── auth.ts
│   │   ├── product.ts
│   │   ├── order.ts
│   │   └── user.ts
│   └── emails/                 # HTML email templates
│       ├── verification.tsx
│       ├── welcome.tsx
│       ├── order-confirmation.tsx
│       └── password-reset.tsx
├── public/                     # Static assets
│   ├── images/
│   └── favicon.ico
├── .env.local.example          # Environment template
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind setup
├── tsconfig.json               # TypeScript config
├── components.json             # shadcn/ui config
└── package.json                # Dependencies
```

---

## 💻 Usage Examples

### Create a New Product (Admin API)

```typescript
// POST /api/products
const response = await fetch('/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Sample Product',
    price: 99.99,
    category: 'electronics',
    description: 'Product description',
    stock: 100,
    images: ['cloudinary-image-url'],
  }),
});
```

### Add Item to Cart

```typescript
import { useDispatch } from 'react-redux';
import { addItem } from '@/store/slices/cartSlice';

function ProductPage() {
  const dispatch = useDispatch();

  const handleAddToCart = (product) => {
    dispatch(addItem({
      productId: product._id,
      quantity: 1,
      price: product.price,
    }));
  };

  return <button onClick={() => handleAddToCart(product)}>Add to Cart</button>;
}
```

### Checkout with Razorpay

```typescript
// 1. Create order
const { orderId, amount } = await fetch('/api/payment/create-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount, currency: 'INR' }),
}).then(res => res.json());

// 2. Initialize Razorpay
const options = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  amount: amount * 100, // in paise
  currency: 'INR',
  name: 'E-Shop',
  description: 'Order Payment',
  orderId: orderId,
  handler: async (response) => {
    // 3. Verify payment
    await fetch('/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      }),
    });
  },
};
const razorpay = new window.Razorpay(options);
razorpay.open();
```

---

## 🤝 Contributing

We welcome contributions from the community! Follow these steps to get started:

### Development Workflow

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/your-username/ecom.git
   cd ecom
   ```
3. **Create a branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Make changes** and follow our coding standards
5. **Lint and format**:
   ```bash
   npm run lint
   npm run type-check
   ```
6. **Commit** with clear messages:
   ```bash
   git commit -m "feat: add new admin dashboard widget"
   ```
7. **Push** to your branch:
   ```bash
   git push origin feature/amazing-feature
   ```
8. **Open a Pull Request** with detailed description

### Guidelines

- Follow TypeScript strict mode
- Use existing component patterns from `src/components/ui`
- Write tests for new features (if test files exist)
- Ensure code passes linting and type checking
- Update documentation for API changes
- Keep commits atomic and descriptive


---

## 🔒 Security

This application implements multiple security layers:

- **Authentication**: NextAuth.js with secure session management
- **Authorization**: Role-based middleware on admin routes
- **Password Security**: bcryptjs with 12 salt rounds
- **Payment Security**: Razorpay signature verification
- **Input Validation**: Zod schemas on all API endpoints
- **CSRF Protection**: Built-in NextAuth CSRF tokens
- **CSP Headers**: Content Security Policy configured
- **Rate Limiting**: Recommended for auth endpoints (needs setup)

**Responsible Disclosure**: If you find a security vulnerability, please email `security@yourdomain.com` instead of opening a public issue.

---

## 🚢 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/ecom)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Configure environment variables
4. Deploy automatically on push

### Manual VPS Deployment

```bash
# Build production bundle
npm run build

# Start production server
npm start

# Or use PM2 for process management
pm2 start npm --name "ecom" -- start
```

**Important**: Configure reverse proxy (nginx) and SSL certificate for production.

---

## 📊 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | User registration |
| `POST` | `/api/auth/forgot-password` | Request password reset |
| `POST` | `/api/auth/reset-password/[token]` | Reset password |
| `GET` | `/api/auth/verify/[token]` | Email verification |

### Product Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | List products with filters |
| `GET` | `/api/products/[slug]` | Get product details |
| `POST` | `/api/products` | Create product (admin) |
| `PUT` | `/api/products/[id]` | Update product (admin) |
| `DELETE` | `/api/products/[id]` | Delete product (admin) |

### Order Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/orders` | Get user orders |
| `GET` | `/api/orders/[id]` | Get order details |
| `POST` | `/api/orders` | Create order |
| `PUT` | `/api/orders/[id]` | Update order status (admin) |

### Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payment/create-order` | Create Razorpay order |
| `POST` | `/api/payment/verify` | Verify payment signature |
| `POST` | `/api/payment/webhook` | Razorpay webhook handler |

For full API documentation, see [API.md](API.md).

---

## 🧪 Testing

```bash
# Lint code
npm run lint

# Type checking
npm run type-check

# Run all checks
npm run lint && npm run type-check
```

---

## 📸 Screenshots

### Store Front
![Store Homepage](screenshots/store-homepage.png)
*Hero section with featured products and categories*

### Product Details
![Product Page](screenshots/product-details.png)
*Rich product pages with image gallery and reviews*

### Admin Dashboard
![Admin Dashboard](screenshots/admin-dashboard.png)
*Analytics with revenue charts and top products*

### Admin Product Management
![Admin Products](screenshots/admin-products.png)
*Product CRUD with bulk actions and image upload*


## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful, accessible components
- **[Vercel](https://vercel.com/)** - Hosting and deployment platform
- **[Tailwind CSS](https://tailwindcss.com/)** - Amazing utility-first CSS framework
- **[Razorpay](https://razorpay.com/)** - Reliable payment gateway for India
- **[Cloudinary](https://cloudinary.com/)** - Powerful media management
- **[MongoDB](https://www.mongodb.com/)** - Flexible document database

---

## 📞 Support

- **Email**: support@gravityscript.com
---

<div align="center">

Built with ❤️ using modern web technologies

[Next.js](https://nextjs.org/) • [React](https://reactjs.org/) • [TypeScript](https://www.typescriptlang.org/) • [MongoDB](https://www.mongodb.com/) • [Tailwind CSS](https://tailwindcss.com/)

</div>

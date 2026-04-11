// src/app/(auth)/layout.tsx
// src/app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Brand Panel - Desktop only */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 flex-col justify-center items-center text-white p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-12 left-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-12 right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10 text-center space-y-6">
          <h1 className="text-5xl font-bold tracking-tight">E-Shop</h1>
          <p className="text-xl opacity-90">The best products at unbeatable prices</p>
          <ul className="space-y-3 text-lg mt-8">
            <li className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Free delivery on orders above ₹499
            </li>
            <li className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Easy returns within 30 days
            </li>
            <li className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Secure payments
            </li>
            <li className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              24/7 customer support
            </li>
          </ul>
        </div>
      </div>

      {/* Right Form Content */}
      <div className="flex-1 flex items-center justify-center p-4 bg-background">
        {children}
      </div>
    </div>
  )
}

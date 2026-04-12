import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { auth } from '@/lib/auth'
import { isMaintenanceModeEnabled } from '@/lib/settings'

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, maintenanceModeEnabled] = await Promise.all([
    auth(),
    isMaintenanceModeEnabled(),
  ])

  if (maintenanceModeEnabled && session?.user?.role !== 'admin') {
    redirect('/maintenance')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}

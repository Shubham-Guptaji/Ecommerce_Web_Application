// File path: src/app/maintenance/page.tsx
import Link from 'next/link'
import { Wrench, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center space-y-6 max-w-lg mx-auto p-8">
        <div className="flex justify-center">
          <Wrench className="h-20 w-20 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">We&apos;ll Be Back Soon!</h1>
        <p className="text-muted-foreground">
          Our store is currently undergoing scheduled maintenance to improve your shopping experience.
          We apologize for any inconvenience. Please check back in a little while.
        </p>
        <p className="text-sm text-muted-foreground">
          Need help? Contact us at {process.env.SMTP_FROM}
        </p>
        <div className="rounded-xl border bg-background/80 p-5 text-left">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-3">
              <div>
                <p className="font-medium">Admin access</p>
                <p className="text-sm text-muted-foreground">
                  Store admins can still sign in to manage the site while maintenance mode is active.
                </p>
              </div>
              <Button asChild>
                <Link href="/sign-in?callbackUrl=/admin&maintenance=1">
                  Admin Sign In
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

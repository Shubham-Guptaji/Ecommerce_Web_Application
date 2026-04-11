// File path: src/app/maintenance/page.tsx
import { Wrench } from 'lucide-react'

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center space-y-6 max-w-md mx-auto p-8">
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
      </div>
    </div>
  )
}

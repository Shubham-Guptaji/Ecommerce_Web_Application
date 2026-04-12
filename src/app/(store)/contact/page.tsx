// src/app/(store)/contact/page.tsx
import { Metadata } from 'next'
import { ContactForm } from '@/components/shared/contact-form'
import { Button } from '@/components/ui/button'
import { getStoreSettings } from '@/lib/settings'
import { Mail, Phone, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with our customer support team',
}

export default async function ContactPage() {
  const settings = await getStoreSettings()
  const storeEmail = settings?.storeEmail || 'support@eshop.com'
  const storePhone = settings?.storePhone || '+1 (555) 123-4567'
  const storeAddress = settings?.storeAddress || '123 Commerce Street, New York, NY 10001'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
        <p className="text-muted-foreground mb-8">
          Have a question or need assistance? We&apos;d love to hear from you.
          Fill out the form below and we&apos;ll get back to you as soon as possible.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Email */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Email</h3>
              <a href={`mailto:${storeEmail}`} className="text-muted-foreground hover:text-foreground transition-colors">
                {storeEmail}
              </a>
              <p className="text-sm text-muted-foreground">We respond within 24 hours</p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Phone</h3>
              <a href={`tel:${storePhone}`} className="text-muted-foreground hover:text-foreground transition-colors">
                {storePhone}
              </a>
              <p className="text-sm text-muted-foreground">Mon-Fri 9am-6pm EST</p>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Address</h3>
              <p className="text-muted-foreground whitespace-pre-line">{storeAddress}</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Send us a message</h2>
            <ContactForm />
          </div>

          {/* FAQ Teaser */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground mb-6">
              Find answers to common questions about orders, shipping, returns, and more.
            </p>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">How do I track my order?</h3>
                <p className="text-sm text-muted-foreground">
                  Once your order ships, you&apos;ll receive a tracking number via email.
                  You can also view order status in your account.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">What is your return policy?</h3>
                <p className="text-sm text-muted-foreground">
                  We offer 30-day returns on most items. Items must be unused and in original packaging.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">How long does shipping take?</h3>
                <p className="text-sm text-muted-foreground">
                  Standard shipping takes 5-7 business days. Express shipping is available at checkout.
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-6" asChild>
              <a href="/faq">View All FAQs</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

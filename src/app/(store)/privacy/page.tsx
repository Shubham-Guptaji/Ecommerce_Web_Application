// src/app/(store)/privacy/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for E-Shop',
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose max-w-none">
          <p className="text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground mb-4">
              At E-Shop (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), we respect your privacy and are committed to
              protecting your personal information. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you visit our
              website or make a purchase.
            </p>
            <p className="text-muted-foreground">
              Please read this Privacy Policy carefully. By using our site, you consent
              to the practices described in this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
            <h3 className="text-lg font-medium mb-2">Personal Information</h3>
            <p className="text-muted-foreground mb-4">
              We may collect personal information that you voluntarily provide to us when
              you:
            </p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground">
              <li>Create an account</li>
              <li>Place an order</li>
              <li>Subscribe to our newsletter</li>
              <li>Contact customer support</li>
              <li>Participate in promotions or surveys</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              This may include your name, email address, phone number, shipping address,
              and payment information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground">
              <li>Process your orders and payments</li>
              <li>Communicate order status and updates</li>
              <li>Provide customer support</li>
              <li>Send newsletters and promotional offers (if opt-in)</li>
              <li>Improve our website and services</li>
              <li>Prevent fraud and ensure security</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Information Sharing</h2>
            <p className="text-muted-foreground mb-4">
              We do not sell or rent your personal information to third parties. We may
              share your information with:
            </p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground">
              <li>Service providers who assist our operations (payment processing, shipping, email delivery)</li>
              <li>Legal authorities when required by law</li>
              <li>Business partners with your consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Cookies & Tracking</h2>
            <p className="text-muted-foreground mb-4">
              We use cookies and similar tracking technologies to enhance your browsing
              experience, analyze site traffic, and personalize content. You can control
              cookie preferences through your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Data Security</h2>
            <p className="text-muted-foreground mb-4">
              We implement industry-standard security measures to protect your personal
              information. However, no method of transmission over the internet or
              electronic storage is 100% secure, and we cannot guarantee absolute
              security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Your Rights</h2>
            <p className="text-muted-foreground mb-4">
              Depending on your location, you may have the right to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Data portability</li>
            </ul>
            <p className="text-muted-foreground">
              To exercise any of these rights, please contact us at privacy@eshop.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground">
              Our services are not intended for individuals under 18. We do not knowingly
              collect personal information from minors. If you become aware that a child
              has provided us with personal information, please contact us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of
              any changes by posting the new policy on this page with an updated
              revision date. Your continued use of our site after changes constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have questions about this Privacy Policy, please contact us:
            </p>
            <div className="text-muted-foreground">
              <p>E-Shop</p>
              <p>123 Commerce Street</p>
              <p>New York, NY 10001</p>
              <p>Email: privacy@eshop.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

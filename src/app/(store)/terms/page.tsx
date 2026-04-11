// src/app/(store)/terms/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of service for E-Shop',
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

        <div className="prose max-w-none">
          <p className="text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground mb-4">
              Welcome to E-Shop. By accessing or using our website and services, you
              agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not
              agree with these Terms, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground">
              E-Shop is an online retail platform that allows users to browse and
              purchase products. We reserve the right to modify, suspend, or
              discontinue any part of our services at any time without prior notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
            <h3 className="text-lg font-medium mb-2">Registration</h3>
            <p className="text-muted-foreground mb-4">
              To access certain features, you may need to create an account. You agree
              to provide accurate, current, and complete information during registration
              and to update such information to keep it accurate.
            </p>
            <h3 className="text-lg font-medium mb-2">Account Security</h3>
            <p className="text-muted-foreground mb-4">
              You are responsible for maintaining the confidentiality of your account
              credentials and for all activities under your account. Please notify us
              immediately of any unauthorized use.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Products & Pricing</h2>
            <p className="text-muted-foreground mb-4">
              We strive to display accurate product information, but errors may occur.
              We reserve the right to correct any errors, even after an order has been
              placed. Prices are subject to change without notice.
            </p>
            <p className="text-muted-foreground">
              Product availability is not guaranteed. We may limit quantities or
              discontinue products at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Orders & Payment</h2>
            <p className="text-muted-foreground mb-4">
              All orders are subject to acceptance and availability. We reserve the right
              to refuse or cancel any order for any reason, including but not limited to
              product availability, errors in product information, or suspected fraud.
            </p>
            <p className="text-muted-foreground mb-4">
              Payment must be made at the time of order. We accept various payment
              methods as indicated at checkout. By providing payment information, you
              represent that you are authorized to use the payment method.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Shipping & Delivery</h2>
            <p className="text-muted-foreground mb-4">
              Shipping times are estimates only. We are not responsible for delays
              caused by shipping carriers or circumstances beyond our control.
            </p>
            <p className="text-muted-foreground">
              Risk of loss and title to products pass to you upon delivery to the
              carrier.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Returns & Refunds</h2>
            <p className="text-muted-foreground mb-4">
              Our return policy is detailed separately. Returns must comply with the
              stated policy to be eligible for a refund or exchange.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Intellectual Property</h2>
            <p className="text-muted-foreground mb-4">
              All content on this site, including logos, graphics, and product images,
              is the property of E-Shop or its licensors and is protected by
              intellectual property laws. You may not use, reproduce, or distribute this
              content without our written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. User Conduct</h2>
            <p className="text-muted-foreground mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground">
              <li>Use our services for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt our services</li>
              <li>Submit false or misleading information</li>
              <li>Engage in any fraudulent activity</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground">
              OUR SERVICES ARE PROVIDED &quot;AS IS&quot; WITHOUT ANY WARRANTIES, EXPRESS OR
              IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS
              FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Limitation of Liability</h2>
            <p className="text-muted-foreground mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, E-SHOP AND ITS AFFILIATES SHALL
              NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
              PUNITIVE DAMAGES ARISING FROM YOUR USE OF OUR SERVICES.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">12. Indemnification</h2>
            <p className="text-muted-foreground mb-4">
              You agree to indemnify and hold harmless E-Shop and its affiliates from
              any claims, damages, or expenses arising from your use of our services or
              violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">13. Governing Law</h2>
            <p className="text-muted-foreground mb-4">
              These Terms shall be governed by and construed in accordance with the laws
              of the State of New York, without regard to its conflict of law principles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">14. Changes to Terms</h2>
            <p className="text-muted-foreground mb-4">
              We reserve the right to modify these Terms at any time. Changes will be
              effective upon posting. Your continued use of our services after changes
              constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">15. Contact Information</h2>
            <div className="text-muted-foreground">
              <p>For questions about these Terms, please contact us:</p>
              <p>E-Shop Legal Department</p>
              <p>123 Commerce Street</p>
              <p>New York, NY 10001</p>
              <p>Email: legal@eshop.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

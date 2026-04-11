// src/app/(store)/returns/page.tsx
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { CheckCircle, HelpCircle, Package } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Returns & Exchanges',
  description: 'Learn about our return policy and how to return items',
}

export default function ReturnsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Returns & Exchanges</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We want you to be completely satisfied with your purchase. If for any reason
            you&apos;re not happy with your order, we offer a hassle-free return policy.
          </p>
        </div>

        {/* Return Policy Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="text-center p-6 border rounded-lg">
            <div className="text-3xl font-bold text-primary mb-2">30</div>
            <p className="text-sm text-muted-foreground">Day return window</p>
          </div>
          <div className="text-center p-6 border rounded-lg">
            <div className="text-3xl font-bold text-primary mb-2">Free</div>
            <p className="text-sm text-muted-foreground">Returns for defective items</p>
          </div>
          <div className="text-center p-6 border rounded-lg">
            <div className="text-3xl font-bold text-primary mb-2">5-7</div>
            <p className="text-sm text-muted-foreground">Business days for refunds</p>
          </div>
        </div>

        {/* Return Steps */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">How to Return an Item</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="font-semibold text-primary">1</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Start Your Return</h3>
                <p className="text-muted-foreground">
                  Log into your account, go to &quot;Orders&quot;, find the order with the item
                  you want to return, and click &quot;Return Item&quot;. Follow the prompts to
                  select items and reason for return.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="font-semibold text-primary">2</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Print Return Label</h3>
                <p className="text-muted-foreground">
                  Once your return is approved, you&apos;ll receive a prepaid shipping label
                  via email (for eligible returns). Print the label and attach it to your
                  package.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="font-semibold text-primary">3</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Ship It Back</h3>
                <p className="text-muted-foreground">
                  Drop off your package at the designated carrier location. Keep the
                  tracking number for your records. We recommend keeping the original
                  packaging if possible.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="font-semibold text-primary">4</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Get Your Refund</h3>
                <p className="text-muted-foreground">
                  Once we receive and inspect your return (usually within 3-5 business
                  days), we&apos;ll process your refund to your original payment method.
                  It may take 5-10 business days to appear.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Eligible Items */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Return Eligibility</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h3 className="font-semibold">Eligible for Return</h3>
              </div>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>• Unused, unwashed items</li>
                <li>• Original packaging with tags</li>
                <li>• Within 30 days of delivery</li>
                <li>• Non-final sale items</li>
                <li>• Non-customized products</li>
              </ul>
            </div>

            <div className="p-6 border rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <HelpCircle className="h-6 w-6 text-orange-600" />
                <h3 className="font-semibold">Non-Returnable Items</h3>
              </div>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>• Intimate apparel</li>
                <li>• Personal care items</li>
                <li>• Gift cards</li>
                <li>• Customized/monogrammed items</li>
                <li>• Sale items marked &quot;Final Sale&quot;</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Exchange Policy */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Exchange Policy</h2>
          <div className="p-6 bg-muted rounded-lg">
            <p className="text-muted-foreground mb-4">
              We currently do not offer direct exchanges. To exchange an item for a
              different size or color, please return the original item for a refund and
              place a new order for the desired item.
            </p>
            <Button asChild>
              <a href="/contact">Contact Support for Assistance</a>
            </Button>
          </div>
        </div>

        {/* Refund Timeline */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Refund Timeline</h2>
          <div className="overflow-hidden border rounded-lg">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Refund Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Timeline</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-4 py-3">Credit/Debit Card</td>
                  <td className="px-4 py-3">5-10 business days</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">After return received</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">PayPal</td>
                  <td className="px-4 py-3">3-5 business days</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">Instant after approval</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Store Credit</td>
                  <td className="px-4 py-3">Immediate</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">Upon return approval</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="text-center p-8 bg-muted rounded-lg">
          <Package className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-bold mb-4">Need Help with a Return?</h2>
          <p className="text-muted-foreground mb-6">
            Our customer support team is here to help if you have questions about
            the return process.
          </p>
          <Button asChild>
            <a href="/contact">Contact Support</a>
          </Button>
        </div>
      </div>
    </div>
  )
}

// src/app/(store)/about/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle, Truck, Shield, HeadphonesIcon } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn more about E-Shop, your trusted destination for quality products',
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">About E-Shop</h1>
        <p className="text-xl text-muted-foreground">
          Your one-stop destination for quality products at the best prices.
          Shop with confidence.
        </p>
      </div>

      {/* Mission Section */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-muted-foreground mb-4">
              At E-Shop, we believe everyone deserves access to high-quality products
              without breaking the bank. Our mission is to make online shopping
              accessible, secure, and enjoyable for everyone.
            </p>
            <p className="text-muted-foreground">
              We carefully curate our product selection to ensure that every item meets
              our strict quality standards. From electronics to fashion, home goods to
              accessories, we&apos;ve got something for everyone.
            </p>
          </div>
          <div className="bg-muted p-8 rounded-lg">
            <div className="text-4xl font-bold text-primary mb-2">10K+</div>
            <p className="text-muted-foreground">Happy Customers</p>
            <div className="text-4xl font-bold text-primary mb-2 mt-6">50K+</div>
            <p className="text-muted-foreground">Products Sold</p>
            <div className="text-4xl font-bold text-primary mb-2 mt-6">4.8</div>
            <p className="text-muted-foreground">Average Rating</p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-5xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-center mb-12">Why Choose Us?</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="p-4 bg-primary/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Free Shipping</h3>
            <p className="text-sm text-muted-foreground">
              Free shipping on orders over $50
            </p>
          </div>
          <div className="text-center">
            <div className="p-4 bg-primary/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Secure Payment</h3>
            <p className="text-sm text-muted-foreground">
              100% secure transactions
            </p>
          </div>
          <div className="text-center">
            <div className="p-4 bg-primary/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Quality Guaranteed</h3>
            <p className="text-sm text-muted-foreground">
              All products verified for quality
            </p>
          </div>
          <div className="text-center">
            <div className="p-4 bg-primary/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <HeadphonesIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">24/7 Support</h3>
            <p className="text-sm text-muted-foreground">
              Always here to help
            </p>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Our Values</h2>
        <div className="space-y-6">
          <div className="flex gap-4">
            <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Customer First</h3>
              <p className="text-muted-foreground">
                Our customers are at the heart of everything we do. We listen, adapt, and
                continuously improve based on your feedback.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Integrity</h3>
              <p className="text-muted-foreground">
                We believe in honest business practices, transparent pricing, and
                delivering on our promises.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Innovation</h3>
              <p className="text-muted-foreground">
                We constantly seek new ways to enhance your shopping experience,
                from better technology to improved services.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto text-center bg-muted p-12 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Ready to Start Shopping?</h2>
        <p className="text-muted-foreground mb-6">
          Explore our wide range of products and find something you&apos;ll love.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/products">Browse Products</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

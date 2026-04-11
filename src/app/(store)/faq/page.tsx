// src/app/(store)/faq/page.tsx
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about shopping with E-Shop',
}

const faqCategories = [
  {
    title: 'Orders & Shipping',
    items: [
      {
        question: 'How do I place an order?',
        answer:
          'Simply browse our products, add items to your cart, and proceed to checkout. You can create an account or checkout as a guest. Follow the prompts to enter shipping and payment information.',
      },
      {
        question: 'What shipping methods do you offer?',
        answer:
          'We offer Standard (5-7 business days) and Express (2-3 business days) shipping. Shipping costs vary based on your location and order total. Orders over $50 qualify for free standard shipping.',
      },
      {
        question: 'How can I track my order?',
        answer:
          'Once your order ships, we&apos;ll send you a tracking number via email. You can also track your order by logging into your account and viewing order details.',
      },
      {
        question: 'Do you ship internationally?',
        answer:
          'Yes! We ship to most countries worldwide. International shipping rates and delivery times vary by destination. You&apos;ll see shipping options and costs at checkout.',
      },
      {
        question: 'What if my order is delayed?',
        answer:
          'If your order is delayed beyond the estimated delivery date, please contact our support team. We&apos;ll investigate and provide updates.',
      },
    ],
  },
  {
    title: 'Returns & Refunds',
    items: [
      {
        question: 'What is your return policy?',
        answer:
          'We offer a 30-day return policy on most items. Products must be unused, unwashed, and in their original packaging with all tags attached. Some items like intimate apparel and personal care products are non-returnable.',
      },
      {
        question: 'How do I initiate a return?',
        answer:
          'Log into your account, go to your orders, select the order containing the item you want to return, and click &quot;Return Item&quot;. Follow the instructions to generate a return shipping label.',
      },
      {
        question: 'How long do refunds take?',
        answer:
          'Once we receive your returned item, we inspect it and process your refund within 3-5 business days. Refunds are issued to your original payment method and may take 5-10 business days to appear.',
      },
      {
        question: 'Can I exchange an item?',
        answer:
          'Currently, we don&apos;t offer direct exchanges. Please return the unwanted item for a refund and place a new order for the item you want.',
      },
      {
        question: 'Who pays for return shipping?',
        answer:
          'For returns due to size/fit or buyer&apos;s remorse, you&apos;re responsible for return shipping costs. If the item is defective or we made an error, we&apos;ll cover return shipping.',
      },
    ],
  },
  {
    title: 'Products & Inventory',
    items: [
      {
        question: 'Are your products authentic?',
        answer:
          'Yes, all products sold on E-Shop are 100% authentic. We source directly from authorized distributors and manufacturers. We never sell counterfeit goods.',
      },
      {
        question: 'How often do you restock items?',
        answer:
          'We restock popular items regularly. If an item is out of stock, you can sign up for stock notifications on the product page.',
      },
      {
        question: 'What if an item is damaged or defective?',
        answer:
          'If you receive a damaged or defective item, please contact us within 48 hours of delivery with photos. We&apos;ll arrange a replacement or full refund at no cost to you.',
      },
      {
        question: 'Can I cancel or modify my order?',
        answer:
          'Orders can be modified or cancelled within 2 hours of placement. After that, orders are processed quickly and cannot be changed. You can return items after delivery if needed.',
      },
    ],
  },
  {
    title: 'Account & Security',
    items: [
      {
        question: 'How do I reset my password?',
        answer:
          'Click &quot;Sign In&quot; then &quot;Forgot Password?&quot; Enter your email and we&apos;ll send a reset link. The link is valid for 1 hour.',
      },
      {
        question: 'Is my payment information secure?',
        answer:
          'Absolutely. We use industry-standard SSL encryption and PCI-compliant payment processors. We never store your full credit card details on our servers.',
      },
      {
        question: 'How can I update my account information?',
        answer:
          'Log into your account, go to &quot;Profile&quot; or &quot;Account Settings&quot; and you can update your name, email, password, and shipping addresses.',
      },
      {
        question: 'How do I delete my account?',
        answer:
          'Contact our support team and we&apos;ll assist you with account deletion. Please note that order history may be retained for legal and accounting purposes.',
      },
    ],
  },
  {
    title: 'Payments',
    items: [
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept all major credit cards (Visa, MasterCard, American Express, Discover), debit cards, PayPal, and popular digital wallets like Apple Pay and Google Pay.',
      },
      {
        question: 'Is it safe to use my credit card on your site?',
        answer:
          'Yes, our site uses 256-bit SSL encryption. Additionally, we use trusted payment processors that are PCI DSS compliant, ensuring your payment data is secure.',
      },
      {
        question: 'Do you offer cash on delivery?',
        answer:
          'Unfortunately, we don&apos;t offer cash on delivery at this time. We only accept online payments through our secure payment gateway.',
      },
      {
        question: 'Why was my payment declined?',
        answer:
          'Payment declines can occur due to insufficient funds, incorrect card details, or fraud prevention by your bank. Please verify your information or contact your bank. You can also try a different payment method.',
      },
    ],
  },
]

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">
            Find answers to common questions about orders, shipping, returns, and more.
          </p>
        </div>

        {faqCategories.map((category, idx) => (
          <div key={idx} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{category.title}</h2>
            <Accordion type="multiple" className="w-full">
              {category.items.map((item, itemIdx) => (
                <AccordionItem key={itemIdx} value={`item-${idx}-${itemIdx}`}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>

      {/* Still need help? */}
      <div className="max-w-3xl mx-auto mt-12 text-center bg-muted p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
        <p className="text-muted-foreground mb-6">
          Can&apos;t find what you&apos;re looking for? Our customer support team is here to help.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <a href="/contact">Contact Support</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="mailto:support@eshop.com">Send Email</a>
          </Button>
        </div>
      </div>
    </div>
  )
}

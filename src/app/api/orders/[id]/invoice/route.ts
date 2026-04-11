// src/app/api/orders/[id]/invoice/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Order from '@/models/Order'
import { auth } from '@/lib/auth'
import { InvoicePDF } from '@/lib/invoice'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    // Fetch order with populated user
    const order = await Order.findById(id)
      .populate('user', 'name email')
      .populate('items.product', 'name')
      .lean() as any

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Prepare invoice data
    const invoiceData = {
      order,
      storeName: 'E-Shop',
      storeEmail: 'contact@eshop.com',
      storeAddress: '123 Commerce Street, India',
      storePhone: '+91 9876543210',
      currency: 'INR',
      currencySymbol: 'ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹',
    }

    // Generate PDF buffer on server
    const pdfBuffer = await renderToBuffer(
      createElement(InvoicePDF, { data: invoiceData as any }) as any
    )

    // Return PDF as response
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.orderNumber}.pdf"`,
      },
    })

  } catch (error) {
    console.error('Invoice generation error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}

// src/lib/invoice.ts
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { IOrder } from '@/models/Order'
import type { IUser } from '@/models/User'

// Define invoice data interface
export interface InvoiceData {
  order: IOrder & {
    user?: IUser & { email: string; name: string }
  }
  storeName: string
  storeEmail: string
  storeAddress: string
  storePhone?: string
  currency: string
  currencySymbol: string
}

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 12,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 20,
  },
  storeInfo: {
    width: '50%',
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2563eb',
  },
  storeDetails: {
    fontSize: 10,
    color: '#666',
    lineHeight: 1.5,
  },
  invoiceInfo: {
    textAlign: 'right',
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  invoiceNumber: {
    fontSize: 14,
    marginBottom: 5,
  },
  invoiceDate: {
    fontSize: 14,
  },
  customerSection: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  customerInfo: {
    width: '50%',
  },
  customerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  customerDetails: {
    fontSize: 11,
    lineHeight: 1.6,
  },
  shippingInfo: {
    width: '50%',
    paddingLeft: 20,
  },
  table: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottom: '1 solid #e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  tableCell: {
    fontSize: 11,
  },
  itemName: {
    width: '40%',
  },
  itemQty: {
    width: '10%',
    textAlign: 'center',
  },
  itemPrice: {
    width: '20%',
    textAlign: 'right',
  },
  itemTotal: {
    width: '20%',
    textAlign: 'right',
  },
  totals: {
    alignSelf: 'flex-end',
    width: '40%',
    marginBottom: 30,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottom: '1 solid #e2e8f0',
  },
  totalLabel: {
    fontSize: 12,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  grandTotal: {
    backgroundColor: '#2563eb',
    padding: 15,
    marginTop: 10,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#888',
    borderTop: '1 solid #e2e8f0',
    paddingTop: 20,
  },
})

// Helper to format currency
function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toFixed(2)}`
}

// Helper to format date
function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Invoice PDF Component
const InvoicePDF = ({ data }: { data: InvoiceData }) => {
  const { order, storeName, storeEmail, storeAddress, storePhone, currency, currencySymbol } = data

  const subtotal = order.pricing.subtotal
  const discount = order.pricing.discount + (order.pricing.couponDiscount || 0)
  const delivery = order.pricing.deliveryCharge
  const tax = order.pricing.tax
  const total = order.pricing.total

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{storeName}</Text>
          <Text style={styles.storeDetails}>{storeAddress}</Text>
          {storePhone && <Text style={styles.storeDetails}>Phone: {storePhone}</Text>}
          <Text style={styles.storeDetails}>Email: {storeEmail}</Text>
        </View>
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>Order #: {order.orderNumber}</Text>
          <Text style={styles.invoiceDate}>Date: {formatDate(order.createdAt)}</Text>
          <Text style={styles.invoiceDate}>Status: {order.status.toUpperCase()}</Text>
        </View>
      </View>

      {/* Customer & Shipping */}
      <View style={styles.customerSection}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerTitle}>Bill To</Text>
          {order.user && (
            <Text style={styles.customerDetails}>
              {order.user.name || 'Customer'}
              {'\n'}{order.user.email || ''}
            </Text>
          )}
        </View>
        <View style={styles.shippingInfo}>
          <Text style={styles.customerTitle}>Ship To</Text>
          <Text style={styles.customerDetails}>
            {order.shippingAddress.fullName}
            {'\n'}{order.shippingAddress.line1}
            {order.shippingAddress.line2 && `\n${order.shippingAddress.line2}`}
            {'\n'}{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
            {'\n'}{order.shippingAddress.country}
            {'\n'}Phone: {order.shippingAddress.phone}
          </Text>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.itemName]}>Item</Text>
          <Text style={[styles.tableHeaderCell, styles.itemQty]}>Qty</Text>
          <Text style={[styles.tableHeaderCell, styles.itemPrice]}>Price</Text>
          <Text style={[styles.tableHeaderCell, styles.itemTotal]}>Total</Text>
        </View>

        {order.items.map((item: any, index: number) => {
          const price = item.discountedPrice || item.price
          const itemTotal = price * item.quantity

          return (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.itemName]}>{item.name}</Text>
              <Text style={[styles.tableCell, styles.itemQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.itemPrice]}>{formatCurrency(price, currencySymbol)}</Text>
              <Text style={[styles.tableCell, styles.itemTotal]}>{formatCurrency(itemTotal, currencySymbol)}</Text>
            </View>
          )
        })}
      </View>

      {/* Totals */}
      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatCurrency(subtotal, currencySymbol)}</Text>
        </View>
        {discount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount</Text>
            <Text style={[styles.totalValue, { color: '#dc2626' }]}>-{formatCurrency(discount, currencySymbol)}</Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Delivery</Text>
          <Text style={styles.totalValue}>{delivery === 0 ? 'FREE' : formatCurrency(delivery, currencySymbol)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>GST (18%)</Text>
          <Text style={styles.totalValue}>{formatCurrency(tax, currencySymbol)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.grandTotalLabel}>TOTAL</Text>
          <Text style={styles.grandTotalValue}>{formatCurrency(total, currencySymbol)}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Thank you for your business!</Text>
        <Text style={{ marginTop: 5 }}>For any queries, contact us at {storeEmail}</Text>
      </View>
    </Page>
  )
}

export { InvoicePDF, styles }

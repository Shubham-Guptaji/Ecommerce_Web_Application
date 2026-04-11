// File path: scripts/seed.ts
import mongoose from 'mongoose'
import Category from '@/models/Category'
import Product from '@/models/Product'
import Coupon from '@/models/Coupon'
import User from '@/models/User'
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/ecom'

// Sample categories
const categories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Latest electronic gadgets and devices',
    isActive: true,
  },
  {
    name: 'Clothing',
    slug: 'clothing',
    description: 'Trendy apparel and accessories',
    isActive: true,
  },
  {
    name: 'Books',
    slug: 'books',
    description: 'Books, stationery, and educational materials',
    isActive: true,
  },
  {
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    description: 'Furniture, decor, and kitchen essentials',
    isActive: true,
  },
  {
    name: 'Sports',
    slug: 'sports',
    description: 'Sports equipment and fitness gear',
    isActive: true,
  },
]

// Sample products - 4 per category = 20 total
const products = [
  // Electronics
  {
    name: 'iPhone 15 Pro',
    slug: 'iphone-15-pro',
    description: '<p>The latest iPhone with A17 Pro chip, titanium design, and advanced camera system.</p>',
    shortDescription: 'Latest iPhone with titanium design and A17 Pro chip',
    price: 129900,
    discountedPrice: 119900,
    target_category: 'electronics',
    sku: 'ELEC-IPHONE-001',
    stock: 50,
    tags: ['apple', 'smartphone', 'ios'],
    isFeatured: true,
    isActive: true,
    specifications: [
      { key: 'Display', value: '6.1" Super Retina XDR' },
      { key: 'Chip', value: 'A17 Pro' },
      { key: 'Storage', value: '256GB' },
      { key: 'Camera', value: '48MP Main' },
    ],
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    slug: 'samsung-galaxy-s24-ultra',
    description: '<p>Premium Android smartphone with S Pen, 200MP camera, and AI features.</p>',
    shortDescription: 'Flagship Android with AI and S Pen',
    price: 139999,
    discountedPrice: 129999,
    target_category: 'electronics',
    sku: 'ELEC-SAMSUNG-001',
    stock: 35,
    tags: ['samsung', 'android', 's-pen'],
    isFeatured: true,
    isActive: true,
    specifications: [
      { key: 'Display', value: '6.8" Dynamic AMOLED 2X' },
      { key: 'Processor', value: 'Snapdragon 8 Gen 3' },
      { key: 'Storage', value: '512GB' },
      { key: 'Camera', value: '200MP Main' },
    ],
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    slug: 'sony-wh-1000xm5',
    description: '<p>Industry-leading noise cancellation with exceptional sound quality.</p>',
    shortDescription: 'Premium noise cancelling headphones',
    price: 34990,
    discountedPrice: 29990,
    target_category: 'electronics',
    sku: 'ELEC-SONY-001',
    stock: 60,
    tags: ['sony', 'headphones', 'noise-cancelling'],
    isFeatured: true,
    isActive: true,
    specifications: [
      { key: 'Driver', value: '30mm' },
      { key: 'Frequency Response', value: '4Hz-40kHz' },
      { key: 'Battery Life', value: '30 hours' },
      { key: 'Noise Cancellation', value: 'Yes' },
    ],
  },
  {
    name: 'Canon EOS R5 Camera',
    slug: 'canon-eos-r5',
    description: '<p>Full-frame mirrorless camera with 45MP sensor and 8K video.</p>',
    shortDescription: 'Full-frame mirrorless with 8K video',
    price: 269990,
    discountedPrice: 249990,
    target_category: 'electronics',
    sku: 'ELEC-CANON-001',
    stock: 15,
    tags: ['canon', 'camera', 'mirrorless'],
    isFeatured: true,
    isActive: true,
    specifications: [
      { key: 'Sensor', value: '45MP Full-Frame CMOS' },
      { key: 'Video', value: '8K RAW' },
      { key: 'ISO Range', value: '100-51200' },
      { key: 'AF Points', value: '5940' },
    ],
  },
  // Clothing
  {
    name: 'Nike Air Max 270',
    slug: 'nike-air-max-270',
    description: '<p>Iconic Nike Air Max with visible Air cushioning for all-day comfort.</p>',
    shortDescription: 'Iconic Nike Air Max with visible Air unit',
    price: 14999,
    discountedPrice: 11999,
    target_category: 'clothing',
    sku: 'CLOTH-NIKE-001',
    stock: 100,
    tags: ['nike', 'sneakers', 'casual'],
    isFeatured: true,
    isActive: true,
    specifications: [
      { key: 'Material', value: 'Mesh and Synthetic' },
      { key: 'Sole', value: 'Rubber' },
      { key: 'Closure', value: 'Lace-up' },
      { key: 'Style', value: 'Casual' },
    ],
  },
  {
    name: "Levi's 501 Original Jeans",
    slug: 'levis-501-original',
    description: '<p>The iconic straight fit jeans that started it all. Classic 501 with signature button fly.</p>',
    shortDescription: 'The iconic straight fit jeans since 1873',
    price: 4999,
    discountedPrice: 3999,
    target_category: 'clothing',
    sku: 'CLOTH-LEVI-001',
    stock: 150,
    tags: ['levis', 'denim', 'jeans'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Fit', value: 'Regular' },
      { key: 'Rise', value: 'Mid' },
      { key: 'Material', value: '100% Cotton' },
      { key: 'Closure', value: 'Button Fly' },
    ],
  },
  {
    name: 'Adidas Ultraboost 23',
    slug: 'adidas-ultraboost-23',
    description: '<p>Premium running shoes with responsive Boost midsole for maximum energy return.</p>',
    shortDescription: 'High-performance running shoes',
    price: 18999,
    discountedPrice: 15999,
    target_category: 'clothing',
    sku: 'CLOTH-ADIDAS-001',
    stock: 80,
    tags: ['adidas', 'running', 'sports'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Midsole', value: 'Boost' },
      { key: 'Upper', value: 'Primeknit' },
      { key: 'Sole', value: 'Continental Rubber' },
      { key: 'Drop', value: '10mm' },
    ],
  },
  {
    name: 'Ray-Ban Aviator Classic',
    slug: 'ray-ban-aviator',
    description: '<p>Iconic aviator sunglasses with metal frame and G-15 lenses.</p>',
    shortDescription: 'Timeless aviator style',
    price: 8499,
    discountedPrice: 6999,
    target_category: 'clothing',
    sku: 'CLOTH-RAYBAN-001',
    stock: 120,
    tags: ['ray-ban', 'sunglasses', 'aviator'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Frame', value: 'Metal' },
      { key: 'Lens', value: 'G-15' },
      { key: 'UV Protection', value: '100%' },
      { key: 'Size', value: '58mm' },
    ],
  },
  // Books
  {
    name: 'Harry Potter Complete Series',
    slug: 'harry-potter-complete-series',
    description: '<p>All seven books of the beloved Harry Potter series in a beautiful box set.</p>',
    shortDescription: 'Complete 7-book Harry Potter series',
    price: 2999,
    discountedPrice: 2499,
    target_category: 'books',
    sku: 'BOOK-HP-001',
    stock: 200,
    tags: ['fantasy', 'harry-potter', 'fiction'],
    isFeatured: true,
    isActive: true,
    specifications: [
      { key: 'Author', value: 'J.K. Rowling' },
      { key: 'Format', value: 'Paperback' },
      { key: 'Pages', value: '4096' },
      { key: 'Language', value: 'English' },
    ],
  },
  {
    name: 'Atomic Habits',
    slug: 'atomic-habits',
    description: '<p>Transform your life with tiny changes in behavior by James Clear.</p>',
    shortDescription: 'Build good habits and break bad ones',
    price: 599,
    discountedPrice: 499,
    target_category: 'books',
    sku: 'BOOK-ATOMIC-001',
    stock: 300,
    tags: ['self-help', 'productivity', 'habits'],
    isFeatured: true,
    isActive: true,
    specifications: [
      { key: 'Author', value: 'James Clear' },
      { key: 'Format', value: 'Paperback' },
      { key: 'Pages', value: '320' },
      { key: 'Language', value: 'English' },
    ],
  },
  {
    name: 'The Psychology of Money',
    slug: 'psychology-of-money',
    description: '<p>Timeless lessons on wealth, greed, and happiness by Morgan Housel.</p>',
    shortDescription: 'Learn the behavioral aspects of money',
    price: 499,
    discountedPrice: 399,
    target_category: 'books',
    sku: 'BOOK-PSYCH-001',
    stock: 250,
    tags: ['finance', 'psychology', 'investing'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Author', value: 'Morgan Housel' },
      { key: 'Format', value: 'Paperback' },
      { key: 'Pages', value: '256' },
      { key: 'Language', value: 'English' },
    ],
  },
  {
    name: 'Steve Jobs Biography',
    slug: 'steve-jobs-biography',
    description: '<p>The definitive biography of Apple co-founder Steve Jobs by Walter Isaacson.</p>',
    shortDescription: 'The authorized biography',
    price: 799,
    discountedPrice: 599,
    target_category: 'books',
    sku: 'BOOK-JOBS-001',
    stock: 180,
    tags: ['biography', 'technology', 'apple'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Author', value: 'Walter Isaacson' },
      { key: 'Format', value: 'Paperback' },
      { key: 'Pages', value: '656' },
      { key: 'Language', value: 'English' },
    ],
  },
  // Home & Kitchen
  {
    name: 'Ergonomic Office Chair',
    slug: 'ergonomic-office-chair',
    description: '<p>High-back ergonomic chair with lumbar support and adjustable armrests.</p>',
    shortDescription: 'High-back ergonomic office chair',
    price: 24999,
    discountedPrice: 19999,
    target_category: 'home-kitchen',
    sku: 'HOME-CHAIR-001',
    stock: 30,
    tags: ['furniture', 'office', 'ergonomic'],
    isFeatured: true,
    isActive: true,
    specifications: [
      { key: 'Material', value: 'Mesh & Foam' },
      { key: 'Weight Capacity', value: '120 kg' },
      { key: 'Adjustments', value: 'Height, Tilt, Armrests' },
      { key: 'Assembly', value: 'Required' },
    ],
  },
  {
    name: 'KitchenAid Stand Mixer',
    slug: 'kitchenaid-stand-mixer',
    description: '<p>Professional grade stand mixer for all your baking and cooking needs.</p>',
    shortDescription: 'Premium stand mixer',
    price: 54990,
    discountedPrice: 49990,
    target_category: 'home-kitchen',
    sku: 'HOME-KITCHEN-001',
    stock: 20,
    tags: ['kitchen', 'baking', 'appliances'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Capacity', value: '4.7 quarts' },
      { key: 'Motor', value: '275W' },
      { key: 'Speed Settings', value: '10' },
      { key: 'Includes', value: 'Pasta maker, grinder' },
    ],
  },
  {
    name: 'Non-Stick Cookware Set',
    slug: 'non-stick-cookware-set',
    description: '<p>10-piece non-stick cookware set with ceramic coating.</p>',
    shortDescription: 'Complete non-stick kitchen set',
    price: 8999,
    discountedPrice: 6999,
    target_category: 'home-kitchen',
    sku: 'HOME-COOKWARE-001',
    stock: 45,
    tags: ['cookware', 'kitchen', 'non-stick'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Pieces', value: '10' },
      { key: 'Material', value: 'Aluminum with Ceramic Coating' },
      { key: 'Oven Safe', value: 'Up to 260°C' },
      { key: 'Dishwasher Safe', value: 'Yes' },
    ],
  },
  {
    name: 'Robot Vacuum Cleaner',
    slug: 'robot-vacuum-cleaner',
    description: '<p>Smart robot vacuum with app control, scheduling, and powerful suction.</p>',
    shortDescription: 'Intelligent floor cleaning',
    price: 29999,
    discountedPrice: 24999,
    target_category: 'home-kitchen',
    sku: 'HOME-VACUUM-001',
    stock: 25,
    tags: ['cleaning', 'smart-home', 'robot'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Navigation', value: 'LIDAR' },
      { key: 'Battery Life', value: '150 min' },
      { key: 'Dustbin', value: '0.5L' },
      { key: 'Features', value: 'App control, voice assistant compatible' },
    ],
  },
  // Sports
  {
    name: 'Bosch Power Drill',
    slug: 'bosch-power-drill',
    description: '<p>Professional cordless drill with high torque and long battery life.</p>',
    shortDescription: 'Professional cordless drill kit',
    price: 8999,
    discountedPrice: 7499,
    target_category: 'sports',
    sku: 'SPRT-BOSCH-001',
    stock: 45,
    tags: ['bosch', 'power-tools', 'drill'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Voltage', value: '20V' },
      { key: 'Chuck Size', value: '13mm' },
      { key: 'Torque', value: '45 Nm' },
      { key: 'Battery', value: '2.0Ah Li-ion' },
    ],
  },
  {
    name: 'Yoga Mat Premium',
    slug: 'yoga-mat-premium',
    description: '<p>Extra thick eco-friendly yoga mat with perfect grip and cushioning.</p>',
    shortDescription: 'Non-slip exercise mat',
    price: 1999,
    discountedPrice: 1499,
    target_category: 'sports',
    sku: 'SPRT-YOGA-001',
    stock: 200,
    tags: ['yoga', 'fitness', 'exercise'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Thickness', value: '8mm' },
      { key: 'Material', value: 'TPE Eco-friendly' },
      { key: 'Size', value: '183x61cm' },
      { key: 'Includes', value: 'Carrying strap' },
    ],
  },
  {
    name: 'Adjustable Dumbbell Set',
    slug: 'adjustable-dumbbell-set',
    description: '<p>Space-saving adjustable dumbbells from 5 to 25 kg.</p>',
    shortDescription: 'All-in-one dumbbell set',
    price: 15999,
    discountedPrice: 13499,
    target_category: 'sports',
    sku: 'SPRT-DUMBBELL-001',
    stock: 35,
    tags: ['weights', 'strength', 'home-gym'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Weight Range', value: '5-25 kg' },
      { key: 'Increment', value: '2.5 kg' },
      { key: 'Material', value: 'Steel with rubber coating' },
      { key: 'Adjustment', value: 'Dial system' },
    ],
  },
  {
    name: 'Treadmill with Incline',
    slug: 'treadmill-with-incline',
    description: '<p>Compact home treadmill with 12% incline and 12 km/h max speed.</p>',
    shortDescription: 'Foldable cardio machine',
    price: 44999,
    discountedPrice: 37999,
    target_category: 'sports',
    sku: 'SPRT-TREADMILL-001',
    stock: 15,
    tags: ['cardio', 'running', 'home-gym'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Motor', value: '2.5 HP Continuous' },
      { key: 'Speed Range', value: '1-12 km/h' },
      { key: 'Incline', value: '0-12%' },
      { key: 'Max User Weight', value: '100 kg' },
    ],
  },
]

// Sample coupons as per spec
const coupons = [
  {
    code: 'SAVE10',
    type: 'percentage',
    value: 10,
    minOrderValue: 1000,
    maxDiscount: 500,
    usageLimit: 1000,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    isActive: true,
  },
  {
    code: 'FLAT100',
    type: 'flat',
    value: 100,
    minOrderValue: 999,
    usageLimit: 500,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    isActive: true,
  },
]

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Clear existing data
    await Category.deleteMany({})
    await Product.deleteMany({})
    await Coupon.deleteMany({})
    await User.deleteMany({})
    console.log('🗑️  Cleared existing data')

    // Insert categories
    const createdCategories = await Category.insertMany(categories)
    const categoryMap = new Map()
    createdCategories.forEach((cat) => {
      categoryMap.set(cat.name.toLowerCase(), cat._id)
    })
    console.log(`📂 Created ${createdCategories.length} categories`)
    
    // Debug map
    console.log('Category map:', Object.fromEntries(categoryMap))

    // Insert products
    const productsWithCategory = products.map((product) => {
      const categoryId = categoryMap.get(product.target_category.toLowerCase())
      if (!categoryId) {
        console.error(`No category found for '${product.target_category}' in map:`, Object.fromEntries(categoryMap))
        console.error('Product:', product.name)
        return null
      }
      const productData = {
        ...product,
        category: categoryId,
      }
      // Remove target_category field as it's not part of the Product schema
      if ('target_category' in productData) {
        delete (productData as any).target_category
      }
      return productData
    }).filter(Boolean)

    const createdProducts = await Product.insertMany(productsWithCategory)
    console.log(`📦 Created ${createdProducts.length} products`)

    // Insert coupons
    const createdCoupons = await Coupon.insertMany(coupons)
    console.log(`🎟️  Created ${createdCoupons.length} coupons`)

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Admin@123',
      role: 'admin',
      isEmailVerified: true,
    })
    console.log(`👑 Created admin user: ${adminUser.email}`)

    console.log('\n🎉 Database seeded successfully!')
    console.log(`   - Categories: ${createdCategories.length}`)
    console.log(`   - Products: ${createdProducts.length}`)
    console.log(`   - Coupons: ${createdCoupons.length}`)
    console.log(`   - Admin User: ${adminUser.email} (password: Admin@123)`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

seed()

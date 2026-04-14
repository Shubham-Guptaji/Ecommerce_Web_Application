// File path: scripts/seed.ts
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Category from '@/models/Category'
import Product from '@/models/Product'
import Coupon from '@/models/Coupon'
import User from '@/models/User'

dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/ecom'

const htmlParagraphs = (...paragraphs: string[]) =>
  paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('')

const normalizeCategoryKey = (value: string) => value.trim().toLowerCase()

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
    description: htmlParagraphs(
      'The iPhone 15 Pro blends premium craftsmanship with serious performance. Built from aerospace-grade titanium, it feels lighter in the hand while remaining exceptionally strong, and the contoured edges make it more comfortable for all-day use.',
      'At its core is the A17 Pro chip, delivering fast app launches, smooth multitasking, console-level gaming, and advanced on-device intelligence. The 48MP main camera, ultra wide lens, and telephoto system capture sharp photos, cinematic video, and detailed close-ups in almost any lighting condition.',
      'With a 6.1-inch Super Retina XDR display, ProMotion 120Hz refresh rate, USB-C connectivity, and dependable all-day battery life, the iPhone 15 Pro is designed for creators, professionals, and anyone who wants a flagship phone that feels truly refined.'
    ),
    shortDescription:
      'A titanium-built flagship iPhone with the A17 Pro chip, 48MP pro camera system, and a brilliant 120Hz Super Retina XDR display.',
    price: 129900,
    discountedPrice: 119900,
    target_category: 'electronics',
    sku: 'ELEC-IPHONE-001',
    stock: 50,
    tags: ['apple', 'smartphone', 'ios', 'titanium', 'flagship', 'pro-camera', '5g'],
    isFeatured: true,
    isActive: true,
    specifications: [
      { key: 'Display', value: '6.1" Super Retina XDR OLED, 2556 x 1179, ProMotion 120Hz' },
      { key: 'Chip', value: 'A17 Pro with 6-core CPU, 6-core GPU, and 16-core Neural Engine' },
      { key: 'Storage', value: '256GB onboard storage' },
      { key: 'Rear Camera', value: '48MP Main + 12MP Ultra Wide + 12MP Telephoto with 3x optical zoom' },
      { key: 'Front Camera', value: '12MP TrueDepth camera with Night mode and 4K Dolby Vision video' },
      { key: 'Build', value: 'Aerospace-grade titanium frame with Ceramic Shield front and textured matte glass back' },
      { key: 'Operating System', value: 'iOS with Dynamic Island, Face ID, and advanced privacy controls' },
      { key: 'Connectivity', value: '5G, Wi-Fi 6E, Bluetooth 5.3, NFC, and USB-C' },
      { key: 'Battery', value: 'All-day battery life with fast charging and MagSafe support' },
      { key: 'Durability', value: 'IP68 water and dust resistance' },
    ],
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    slug: 'samsung-galaxy-s24-ultra',
    description: htmlParagraphs(
      'The Samsung Galaxy S24 Ultra is built for users who want a no-compromise Android flagship. Its flat titanium frame, expansive 6.8-inch display, and integrated S Pen make it equally capable for productivity, creative work, and entertainment.',
      'Powered by Snapdragon 8 Gen 3 for Galaxy, it handles demanding apps, high-frame-rate gaming, and on-device AI features with ease. The quad-camera setup, led by a 200MP main sensor, gives you versatile shooting options from ultra wide landscapes to stabilized telephoto zoom.',
      'With Galaxy AI tools, a bright anti-reflective display, robust battery life, and desktop-style productivity features, the S24 Ultra is designed for professionals, power users, and mobile creators who expect flagship performance every day.'
    ),
    shortDescription:
      'Samsung’s top-tier Android flagship with Galaxy AI, a 200MP quad-camera setup, integrated S Pen, and a bright 6.8-inch AMOLED display.',
    price: 139999,
    discountedPrice: 129999,
    target_category: 'electronics',
    sku: 'ELEC-SAMSUNG-001',
    stock: 35,
    tags: ['samsung', 'android', 'galaxy-ai', 's-pen', 'flagship', '200mp', '5g'],
    isFeatured: true,
    isActive: true,
    specifications: [
      { key: 'Display', value: '6.8" QHD+ Dynamic AMOLED 2X, adaptive 1-120Hz refresh rate' },
      { key: 'Processor', value: 'Snapdragon 8 Gen 3 for Galaxy' },
      { key: 'Memory', value: '12GB RAM' },
      { key: 'Storage', value: '512GB internal storage' },
      { key: 'Rear Camera', value: '200MP Main + 12MP Ultra Wide + dual telephoto zoom lenses' },
      { key: 'Front Camera', value: '12MP selfie camera with 4K video support' },
      { key: 'Battery', value: '5000mAh battery with fast wired and wireless charging' },
      { key: 'Build', value: 'Titanium frame with Corning Gorilla Armor protection' },
      { key: 'Productivity', value: 'Built-in S Pen with Samsung Notes and Air Command support' },
      { key: 'Connectivity', value: '5G, Wi-Fi 7, Bluetooth 5.3, NFC, USB-C' },
    ],
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    slug: 'sony-wh-1000xm5',
    description: htmlParagraphs(
      'The Sony WH-1000XM5 sets the standard for premium wireless listening with refined styling, long-wear comfort, and class-leading active noise cancellation. Its lightweight design and soft-fit synthetic leather cushions make it ideal for workdays, flights, and focused listening sessions.',
      'Sony pairs dual processors with eight microphones to intelligently adapt noise cancellation to your surroundings, while the 30mm driver units deliver rich detail, clean vocals, and a balanced low end. Calls sound impressively clear thanks to AI-assisted beamforming microphones that reduce background chatter.',
      'With support for Hi-Res Audio, LDAC, multipoint Bluetooth pairing, touch controls, and 30 hours of battery life, the WH-1000XM5 is an easy recommendation for commuters, remote professionals, and serious music lovers.'
    ),
    shortDescription:
      'Premium wireless headphones with industry-leading ANC, clear voice pickup, 30-hour battery life, and rich high-resolution sound.',
    price: 34990,
    discountedPrice: 29990,
    target_category: 'electronics',
    sku: 'ELEC-SONY-001',
    stock: 60,
    tags: ['sony', 'headphones', 'wireless', 'noise-cancelling', 'bluetooth', 'audio', 'premium'],
    isFeatured: true,
    isActive: true,
    specifications: [
      { key: 'Driver Unit', value: '30mm precision-engineered dynamic drivers' },
      { key: 'Noise Cancellation', value: 'Dual processors with 8 microphones and adaptive ANC' },
      { key: 'Connectivity', value: 'Bluetooth 5.2 with multipoint pairing and 3.5mm wired mode' },
      { key: 'Audio Support', value: 'Hi-Res Audio, LDAC, AAC, SBC, and DSEE Extreme' },
      { key: 'Battery Life', value: 'Up to 30 hours playback with ANC enabled' },
      { key: 'Quick Charge', value: '3 minutes charging for up to 3 hours playback' },
      { key: 'Charging Port', value: 'USB-C fast charging' },
      { key: 'Call Quality', value: 'Beamforming microphones with AI-based noise reduction' },
      { key: 'Controls', value: 'Touch controls for playback, calls, volume, and voice assistant' },
      { key: 'Weight', value: 'Approx. 250 g' },
    ],
  },
  {
    name: 'Canon EOS R5 Camera',
    slug: 'canon-eos-r5',
    description: htmlParagraphs(
      'The Canon EOS R5 is a professional-grade full-frame mirrorless camera built for photographers and filmmakers who need speed, detail, and versatility in one body. Its 45MP CMOS sensor captures immense resolution for studio, wedding, wildlife, and commercial work.',
      'Canon’s advanced Dual Pixel CMOS AF II system provides fast and confident focusing with subject detection for people, animals, and vehicles, while in-body image stabilization helps keep handheld shots impressively sharp. It also records high-quality 8K and oversampled 4K footage for demanding hybrid creators.',
      'Weather sealing, dual card slots, a high-resolution EVF, and deep RF lens compatibility make the EOS R5 a dependable tool for professionals who want flagship stills performance without sacrificing video capability.'
    ),
    shortDescription:
      'A professional 45MP full-frame mirrorless camera with advanced autofocus, in-body stabilization, and high-resolution 8K video capture.',
    price: 269990,
    discountedPrice: 249990,
    target_category: 'electronics',
    sku: 'ELEC-CANON-001',
    stock: 15,
    tags: ['canon', 'camera', 'mirrorless', 'full-frame', '8k-video', 'photography', 'rf-mount'],
    isFeatured: true,
    isActive: true,
    specifications: [
      { key: 'Sensor', value: '45MP full-frame CMOS sensor' },
      { key: 'Lens Mount', value: 'Canon RF mount' },
      { key: 'Processor', value: 'DIGIC X image processor' },
      { key: 'Autofocus', value: 'Dual Pixel CMOS AF II with subject detection' },
      { key: 'Stabilization', value: '5-axis in-body image stabilization' },
      { key: 'Video', value: '8K RAW and oversampled 4K recording options' },
      { key: 'Burst Shooting', value: 'Up to 20 fps electronic shutter' },
      { key: 'ISO Range', value: '100-51200 expandable for low-light work' },
      { key: 'Storage', value: 'Dual card slots: CFexpress and SD UHS-II' },
      { key: 'Viewfinder', value: '5.76M-dot electronic viewfinder' },
    ],
  },
  // Clothing
  {
    name: 'Nike Air Max 270',
    slug: 'nike-air-max-270',
    description: htmlParagraphs(
      'The Nike Air Max 270 combines street-ready style with plush everyday comfort. Inspired by Nike running heritage, it features the brand’s tallest heel Air unit in the Air Max family for a cushioned, lightweight ride you can wear from morning commutes to evening outings.',
      'Its breathable engineered mesh upper keeps airflow moving, while the stretchy inner sleeve creates a snug, sock-like fit. The sculpted silhouette and oversized Air window give the shoe a bold, modern look that pairs easily with jeans, joggers, or athleisure fits.',
      'Whether you want a comfortable daily sneaker or an unmistakable lifestyle silhouette, the Air Max 270 delivers standout design with the soft underfoot support Nike is known for.'
    ),
    shortDescription:
      'A stylish lifestyle sneaker with Nike’s oversized heel Air unit, breathable mesh upper, and soft cushioning for all-day wear.',
    price: 14999,
    discountedPrice: 11999,
    target_category: 'clothing',
    sku: 'CLOTH-NIKE-001',
    stock: 100,
    tags: ['nike', 'sneakers', 'air-max', 'casual', 'streetwear', 'lifestyle', 'cushioned'],
    isFeatured: true,
    isActive: true,
    specifications: [
      { key: 'Upper', value: 'Breathable engineered mesh with synthetic overlays' },
      { key: 'Cushioning', value: 'Large-volume Max Air unit in the heel' },
      { key: 'Midsole', value: 'Lightweight foam for soft underfoot comfort' },
      { key: 'Outsole', value: 'Durable rubber in high-wear zones' },
      { key: 'Closure', value: 'Traditional lace-up fastening' },
      { key: 'Fit', value: 'Secure everyday fit with stretchy inner sleeve' },
      { key: 'Style', value: 'Lifestyle sneaker' },
      { key: 'Best For', value: 'Casual wear, travel, and all-day city use' },
    ],
  },
  {
    name: "Levi's 501 Original Jeans",
    slug: 'levis-501-original',
    description: htmlParagraphs(
      "Levi's 501 Original Jeans are the blueprint for classic denim. With their iconic straight-leg cut, signature button fly, and durable construction, they deliver the timeless look that helped define modern casualwear.",
      'Made from sturdy cotton denim that softens beautifully over time, the 501 offers authentic character and a broken-in feel the more you wear it. The regular fit through the thigh makes it easy to pair with tees, shirts, jackets, or boots across seasons.',
      'For shoppers who want a dependable pair of jeans with heritage appeal and everyday versatility, the 501 remains one of the most recognizable and enduring silhouettes in fashion.'
    ),
    shortDescription:
      'The original straight-fit denim icon with authentic button-fly styling, sturdy cotton construction, and timeless everyday versatility.',
    price: 4999,
    discountedPrice: 3999,
    target_category: 'clothing',
    sku: 'CLOTH-LEVI-001',
    stock: 150,
    tags: ['levis', 'denim', 'jeans', 'straight-fit', 'heritage', 'casualwear', 'button-fly'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Fit', value: 'Regular fit with straight leg' },
      { key: 'Rise', value: 'Sits at the waist' },
      { key: 'Material', value: 'Heavyweight cotton denim' },
      { key: 'Closure', value: 'Signature button fly' },
      { key: 'Stretch', value: 'Low-stretch or rigid feel depending on wash' },
      { key: 'Pockets', value: 'Classic 5-pocket styling' },
      { key: 'Style', value: 'Timeless heritage denim' },
      { key: 'Care', value: 'Machine wash cold, wash inside out' },
    ],
  },
  {
    name: 'Adidas Ultraboost 23',
    slug: 'adidas-ultraboost-23',
    description: htmlParagraphs(
      'The Adidas Ultraboost 23 is a premium daily trainer engineered for runners who want soft cushioning without sacrificing responsiveness. Its updated midsole packs in more BOOST material for a smoother, more energetic ride over short jogs, long efforts, and recovery runs.',
      'The adaptive adidas PRIMEKNIT+ upper hugs the foot with a supportive yet breathable fit, while the Linear Energy Push system helps add stiffness for a more propulsive toe-off. Underneath, the Continental rubber outsole offers dependable grip across urban roads and mixed weather conditions.',
      'From serious training miles to comfortable all-day wear after the run, the Ultraboost 23 delivers the polished fit, premium feel, and recognizable performance Adidas fans expect.'
    ),
    shortDescription:
      'A premium running shoe with responsive BOOST cushioning, adaptive PRIMEKNIT comfort, and dependable traction for daily miles.',
    price: 18999,
    discountedPrice: 15999,
    target_category: 'clothing',
    sku: 'CLOTH-ADIDAS-001',
    stock: 80,
    tags: ['adidas', 'running', 'ultraboost', 'boost', 'road-running', 'performance', 'comfort'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Midsole', value: 'Light BOOST cushioning for soft energy return' },
      { key: 'Upper', value: 'adidas PRIMEKNIT+ adaptive knit upper' },
      { key: 'Outsole', value: 'Continental Rubber outsole for grip' },
      { key: 'Support', value: 'Linear Energy Push system for improved forefoot stiffness' },
      { key: 'Drop', value: 'Approx. 10 mm heel-to-toe drop' },
      { key: 'Use Case', value: 'Daily training, recovery runs, and long walks' },
      { key: 'Closure', value: 'Lace-up performance fit' },
      { key: 'Ride Feel', value: 'Cushioned, stable, and responsive' },
    ],
  },
  {
    name: 'Ray-Ban Aviator Classic',
    slug: 'ray-ban-aviator',
    description: htmlParagraphs(
      'The Ray-Ban Aviator Classic is one of the most iconic eyewear designs ever made. Originally created for pilots, its slim metal frame, teardrop lens shape, and signature proportions still feel effortlessly stylish decades later.',
      'The G-15 lenses are designed to provide excellent visual clarity while helping reduce glare and eye fatigue in bright outdoor conditions. Lightweight construction and adjustable nose pads make the frame comfortable enough for extended wear during travel, commuting, or weekend outings.',
      'If you want a timeless accessory that works across casual, smart-casual, and vacation wardrobes, the Aviator Classic remains a dependable statement piece that never feels overdone.'
    ),
    shortDescription:
      'An iconic metal-frame sunglass with classic aviator styling, glare-reducing lenses, and lightweight comfort for everyday wear.',
    price: 8499,
    discountedPrice: 6999,
    target_category: 'clothing',
    sku: 'CLOTH-RAYBAN-001',
    stock: 120,
    tags: ['ray-ban', 'sunglasses', 'aviator', 'eyewear', 'classic-style', 'uv-protection', 'metal-frame'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Frame Material', value: 'Lightweight metal frame' },
      { key: 'Lens Type', value: 'Classic G-15 lenses for balanced color perception' },
      { key: 'UV Protection', value: '100% UVA and UVB protection' },
      { key: 'Frame Shape', value: 'Classic aviator silhouette' },
      { key: 'Bridge', value: 'Double bridge design with adjustable nose pads' },
      { key: 'Size', value: '58 mm lens width' },
      { key: 'Best For', value: 'Driving, travel, and everyday outdoor wear' },
      { key: 'Style', value: 'Unisex heritage eyewear' },
    ],
  },
  // Books
  {
    name: 'Harry Potter Complete Series',
    slug: 'harry-potter-complete-series',
    description: htmlParagraphs(
      'The Harry Potter Complete Series brings together all seven beloved novels in one collectible box set, making it ideal for first-time readers and longtime fans alike. From the moment Harry discovers he is a wizard to the final battle at Hogwarts, the collection offers a rich, immersive reading journey filled with friendship, courage, and wonder.',
      'Each book builds on the world of Hogwarts with memorable characters, magical creatures, and increasingly mature themes that continue to resonate across generations. The set looks great on a shelf and makes a thoughtful gift for young readers, fantasy enthusiasts, and collectors.',
      'Whether you are revisiting the story or discovering it for the first time, this complete set delivers one of the most celebrated fantasy sagas ever written in a convenient, display-worthy edition.'
    ),
    shortDescription:
      'A collectible 7-book box set of the complete Harry Potter saga, perfect for fans, gift-giving, and immersive fantasy reading.',
    price: 2999,
    discountedPrice: 2499,
    target_category: 'books',
    sku: 'BOOK-HP-001',
    stock: 200,
    tags: ['fantasy', 'harry-potter', 'fiction', 'box-set', 'young-adult', 'collectible', 'magic'],
    isFeatured: true,
    isActive: true,
    specifications: [
      { key: 'Author', value: 'J.K. Rowling' },
      { key: 'Format', value: 'Paperback box set' },
      { key: 'Books Included', value: 'All 7 novels in the Harry Potter series' },
      { key: 'Total Pages', value: 'Approx. 4096 pages' },
      { key: 'Language', value: 'English' },
      { key: 'Genre', value: 'Fantasy adventure' },
      { key: 'Audience', value: 'Middle grade, young adult, and adult readers' },
      { key: 'Packaging', value: 'Slipcase presentation box' },
    ],
  },
  {
    name: 'Atomic Habits',
    slug: 'atomic-habits',
    description: htmlParagraphs(
      'Atomic Habits is a practical, highly readable guide to building better routines through small, consistent changes. James Clear explains why lasting transformation rarely comes from dramatic overhauls and instead emerges from systems, identity shifts, and repeatable behaviors.',
      'Blending behavioral science with real-world examples, the book offers clear frameworks for making good habits obvious, attractive, easy, and satisfying while helping readers reduce friction around bad habits. Its structure makes it easy to apply ideas immediately in work, health, money, and personal growth.',
      'For readers who want an actionable self-improvement book rather than motivational fluff, Atomic Habits remains one of the strongest modern titles on sustainable behavior change.'
    ),
    shortDescription:
      'A practical bestseller on building good habits, breaking bad ones, and using small daily systems to create lasting change.',
    price: 599,
    discountedPrice: 499,
    target_category: 'books',
    sku: 'BOOK-ATOMIC-001',
    stock: 300,
    tags: ['self-help', 'productivity', 'habits', 'behavior-change', 'personal-growth', 'best-seller', 'mindset'],
    isFeatured: true,
    isActive: true,
    specifications: [
      { key: 'Author', value: 'James Clear' },
      { key: 'Format', value: 'Paperback' },
      { key: 'Pages', value: '320' },
      { key: 'Language', value: 'English' },
      { key: 'Genre', value: 'Self-help and productivity' },
      { key: 'Core Theme', value: 'Habit formation through systems and identity' },
      { key: 'Reading Level', value: 'Accessible for general readers and professionals' },
      { key: 'Ideal For', value: 'Students, founders, managers, and self-improvement readers' },
    ],
  },
  {
    name: 'The Psychology of Money',
    slug: 'psychology-of-money',
    description: htmlParagraphs(
      'The Psychology of Money explores how behavior, emotion, and personal experience shape financial decisions far more than spreadsheets alone. Morgan Housel uses short, memorable chapters to show why patience, humility, and long-term thinking often matter more than technical brilliance.',
      'Rather than teaching complex formulas, the book focuses on timeless truths about saving, investing, risk, greed, and contentment. Its storytelling style makes sophisticated ideas approachable for beginners while still offering depth for more experienced readers.',
      'Anyone looking to improve their financial mindset, not just their financial knowledge, will find this book insightful, calming, and genuinely useful.'
    ),
    shortDescription:
      'A clear, engaging look at how behavior and emotion influence wealth, investing, risk, and long-term financial decisions.',
    price: 499,
    discountedPrice: 399,
    target_category: 'books',
    sku: 'BOOK-PSYCH-001',
    stock: 250,
    tags: ['finance', 'psychology', 'investing', 'money-management', 'behavioral-finance', 'non-fiction', 'wealth'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Author', value: 'Morgan Housel' },
      { key: 'Format', value: 'Paperback' },
      { key: 'Pages', value: '256' },
      { key: 'Language', value: 'English' },
      { key: 'Genre', value: 'Personal finance and behavioral economics' },
      { key: 'Core Theme', value: 'Wealth decisions are driven by psychology and behavior' },
      { key: 'Writing Style', value: 'Short chapter essays with real-world examples' },
      { key: 'Ideal For', value: 'New investors, working professionals, and finance readers' },
    ],
  },
  {
    name: 'Steve Jobs Biography',
    slug: 'steve-jobs-biography',
    description: htmlParagraphs(
      'Walter Isaacson’s Steve Jobs is a deeply researched portrait of one of the most influential and complicated figures in modern technology. Based on extensive interviews with Jobs, his family, colleagues, and critics, the book traces the development of Apple alongside the evolution of Jobs himself.',
      'It covers the highs and failures, the obsession with design, the intensity of his leadership style, and the product decisions that changed personal computing, music, phones, animation, and digital retail. The narrative is candid rather than flattering, which makes the biography more compelling.',
      'For readers interested in entrepreneurship, innovation, leadership, or the story behind Apple’s most iconic products, this remains an essential and engrossing biography.'
    ),
    shortDescription:
      'The definitive Walter Isaacson biography of Steve Jobs, covering Apple’s rise, creative vision, leadership, and lasting impact on technology.',
    price: 799,
    discountedPrice: 599,
    target_category: 'books',
    sku: 'BOOK-JOBS-001',
    stock: 180,
    tags: ['biography', 'technology', 'apple', 'innovation', 'leadership', 'entrepreneurship', 'non-fiction'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Author', value: 'Walter Isaacson' },
      { key: 'Format', value: 'Paperback' },
      { key: 'Pages', value: '656' },
      { key: 'Language', value: 'English' },
      { key: 'Genre', value: 'Biography and business history' },
      { key: 'Subject', value: 'Steve Jobs and the evolution of Apple' },
      { key: 'Source Material', value: 'Extensive interviews and archival reporting' },
      { key: 'Ideal For', value: 'Readers interested in technology, startups, and leadership' },
    ],
  },
  // Home & Kitchen
  {
    name: 'Ergonomic Office Chair',
    slug: 'ergonomic-office-chair',
    description: htmlParagraphs(
      'This ergonomic office chair is designed to support long work sessions without sacrificing comfort or posture. Its breathable mesh back promotes airflow, while the contoured lumbar support helps reduce lower-back fatigue during extended desk time.',
      'Multiple adjustment points let you fine-tune the seat height, recline tension, headrest position, and armrest placement to better match your body and workspace. The cushioned seat and stable rolling base make it equally suitable for home offices, study rooms, and professional setups.',
      'If you spend several hours a day at a desk, this chair offers the kind of ergonomic support and everyday usability that can make a noticeable difference in comfort and focus.'
    ),
    shortDescription:
      'A high-back ergonomic office chair with breathable mesh, lumbar support, and multi-point adjustments for long work sessions.',
    price: 24999,
    discountedPrice: 19999,
    target_category: 'home-kitchen',
    sku: 'HOME-CHAIR-001',
    stock: 30,
    tags: ['furniture', 'office', 'ergonomic', 'home-office', 'lumbar-support', 'adjustable', 'workspace'],
    isFeatured: true,
    isActive: true,
    specifications: [
      { key: 'Backrest', value: 'Breathable mesh back with integrated lumbar support' },
      { key: 'Seat', value: 'High-density foam cushion with waterfall edge' },
      { key: 'Adjustments', value: 'Seat height, recline, tilt tension, headrest, and armrests' },
      { key: 'Frame', value: 'Reinforced nylon frame with smooth-rolling caster wheels' },
      { key: 'Weight Capacity', value: 'Up to 120 kg' },
      { key: 'Use Case', value: 'Home office, study, and professional workstation setups' },
      { key: 'Assembly', value: 'Self-assembly required with hardware included' },
      { key: 'Finish', value: 'Modern black ergonomic finish' },
    ],
  },
  {
    name: 'KitchenAid Stand Mixer',
    slug: 'kitchenaid-stand-mixer',
    description: htmlParagraphs(
      'The KitchenAid Stand Mixer is a premium countertop essential for bakers, home cooks, and anyone who wants consistent mixing performance with less effort. Its powerful motor and planetary mixing action ensure ingredients are incorporated evenly, whether you are making bread dough, cake batter, whipped cream, or cookie mixes.',
      'The sturdy metal construction gives it a durable, appliance-grade feel, while the tilt-head design makes it easy to add ingredients or swap accessories mid-recipe. Beyond baking, the attachment hub opens the door to pasta making, grinding, shredding, and more with compatible accessories.',
      'Beautiful enough to live on the counter and capable enough for frequent use, this mixer brings professional-style convenience to everyday cooking and weekend baking projects.'
    ),
    shortDescription:
      'A premium countertop stand mixer with powerful planetary mixing, durable metal construction, and versatile attachment support.',
    price: 54990,
    discountedPrice: 49990,
    target_category: 'home-kitchen',
    sku: 'HOME-KITCHEN-001',
    stock: 20,
    tags: ['kitchenaid', 'kitchen', 'baking', 'stand-mixer', 'appliances', 'countertop', 'premium'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Bowl Capacity', value: '4.7-quart stainless steel bowl' },
      { key: 'Motor', value: 'Powerful motor tuned for dense batters and doughs' },
      { key: 'Mixing Action', value: 'Planetary mixing for thorough ingredient incorporation' },
      { key: 'Speed Settings', value: '10 speed levels from gentle stirring to fast whipping' },
      { key: 'Design', value: 'Tilt-head design for easy bowl access' },
      { key: 'Construction', value: 'Durable die-cast metal body' },
      { key: 'Attachments Included', value: 'Flat beater, dough hook, and wire whisk' },
      { key: 'Accessory Hub', value: 'Compatible with optional pasta, grinder, and prep attachments' },
    ],
  },
  {
    name: 'Non-Stick Cookware Set',
    slug: 'non-stick-cookware-set',
    description: htmlParagraphs(
      'This 10-piece non-stick cookware set gives home cooks an easy, coordinated foundation for everyday meal prep. The collection covers the essentials for frying, sauteing, simmering, boiling, and one-pan cooking, making it a practical upgrade for new kitchens and family households alike.',
      'Each piece features a smooth non-stick interior that helps reduce sticking and simplifies cleanup, while the aluminum body promotes fast, even heating. Tempered glass lids let you monitor progress without lifting the cover, helping retain heat and moisture while cooking.',
      'From quick breakfasts to weeknight dinners, this set is built to make daily cooking more convenient, less messy, and far more enjoyable.'
    ),
    shortDescription:
      'A versatile 10-piece cookware set with fast-heating aluminum construction, easy-release non-stick interiors, and everyday kitchen coverage.',
    price: 8999,
    discountedPrice: 6999,
    target_category: 'home-kitchen',
    sku: 'HOME-COOKWARE-001',
    stock: 45,
    tags: ['cookware', 'kitchen', 'non-stick', 'ceramic-coating', 'cookware-set', 'home-cooking', 'easy-clean'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Set Size', value: '10 pieces including pans, pots, lids, and utensils' },
      { key: 'Body Material', value: 'Aluminum construction for even heat distribution' },
      { key: 'Interior', value: 'Ceramic-inspired non-stick coating' },
      { key: 'Lids', value: 'Tempered glass lids with steam vents' },
      { key: 'Handles', value: 'Stay-cool ergonomic handles for secure grip' },
      { key: 'Cooktop Use', value: 'Compatible with gas and electric stovetops' },
      { key: 'Oven Safe', value: 'Safe up to 260 C' },
      { key: 'Cleaning', value: 'Easy-clean interior and dishwasher safe components' },
    ],
  },
  {
    name: 'Robot Vacuum Cleaner',
    slug: 'robot-vacuum-cleaner',
    description: htmlParagraphs(
      'This robot vacuum cleaner brings hands-free floor care to busy homes with intelligent navigation, app controls, and powerful everyday cleaning performance. It maps rooms efficiently to avoid random bump-and-go behavior, helping it cover more area in less time.',
      'Strong suction lifts dust, crumbs, pet hair, and fine debris from hard floors and low-pile rugs, while the slim body slips under sofas and beds where upright vacuums struggle. Scheduling and remote start through the companion app make it easy to keep floors maintained even when you are away.',
      'For households that want a cleaner home with less daily effort, this robot vacuum is a practical smart-home upgrade that saves both time and energy.'
    ),
    shortDescription:
      'A smart robot vacuum with mapped navigation, app scheduling, strong suction, and effortless daily cleaning for modern homes.',
    price: 29999,
    discountedPrice: 24999,
    target_category: 'home-kitchen',
    sku: 'HOME-VACUUM-001',
    stock: 25,
    tags: ['cleaning', 'smart-home', 'robot-vacuum', 'app-control', 'lidar', 'pet-hair', 'home-appliance'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Navigation', value: 'LIDAR-based smart mapping and route planning' },
      { key: 'Suction Power', value: 'High-suction cleaning for dust, crumbs, and pet hair' },
      { key: 'Battery Life', value: 'Up to 150 minutes per charge' },
      { key: 'Dustbin Capacity', value: '0.5 L dustbin' },
      { key: 'Control', value: 'Mobile app with scheduling, zone cleaning, and status monitoring' },
      { key: 'Voice Assistant', value: 'Compatible with major voice assistants' },
      { key: 'Surface Support', value: 'Hard floors and low-pile carpets' },
      { key: 'Auto Recharge', value: 'Returns to dock automatically when battery is low' },
    ],
  },
  // Sports
  {
    name: 'Bosch Power Drill',
    slug: 'bosch-power-drill',
    description: htmlParagraphs(
      'The Bosch Power Drill is a versatile cordless tool built for home improvement, workshop tasks, and demanding everyday repairs. Its compact body and balanced grip make it easy to handle for extended periods, whether you are drilling pilot holes, assembling furniture, or fastening into wood and metal.',
      'A high-torque motor and variable speed trigger give you better control across delicate and heavy-duty jobs, while the keyless chuck makes bit changes fast and convenient. The included lithium-ion battery platform is designed for dependable runtime and consistent power delivery.',
      'For users who want a practical drill that feels reliable right out of the case, this Bosch kit offers solid performance, portability, and the durability expected from a trusted tools brand.'
    ),
    shortDescription:
      'A dependable cordless drill kit with strong torque, variable speed control, and a compact design for repairs and DIY projects.',
    price: 8999,
    discountedPrice: 7499,
    target_category: 'sports',
    sku: 'SPRT-BOSCH-001',
    stock: 45,
    tags: ['bosch', 'power-tools', 'drill', 'cordless', 'diy', 'home-improvement', 'tool-kit'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Voltage', value: '20V cordless platform' },
      { key: 'Chuck Size', value: '13 mm keyless chuck' },
      { key: 'Torque', value: 'Up to 45 Nm torque output' },
      { key: 'Battery', value: '2.0Ah lithium-ion battery pack' },
      { key: 'Speed Control', value: 'Variable speed trigger with forward and reverse modes' },
      { key: 'Applications', value: 'Drilling and fastening in wood, plastic, and metal' },
      { key: 'Design', value: 'Compact ergonomic grip with balanced weight distribution' },
      { key: 'Included', value: 'Battery, charger, carry case, and starter drill bits' },
    ],
  },
  {
    name: 'Yoga Mat Premium',
    slug: 'yoga-mat-premium',
    description: htmlParagraphs(
      'The Yoga Mat Premium is designed for stable footing, joint-friendly cushioning, and reliable grip across yoga, Pilates, stretching, and bodyweight workouts. Its extra-thick profile helps reduce pressure on knees, wrists, and elbows, making floor sessions more comfortable for beginners and experienced users alike.',
      'The textured non-slip surface improves traction during sweaty flows and balance poses, while the lightweight construction keeps it easy to roll, carry, and store. Made from eco-conscious TPE material, it offers a cleaner feel than traditional PVC mats and resists flaking with regular use.',
      'Whether you practice at home, in the studio, or outdoors, this mat gives you the comfort and confidence to move with better stability and focus.'
    ),
    shortDescription:
      'An extra-thick, eco-friendly yoga mat with cushioned support, reliable non-slip grip, and easy portability for daily workouts.',
    price: 1999,
    discountedPrice: 1499,
    target_category: 'sports',
    sku: 'SPRT-YOGA-001',
    stock: 200,
    tags: ['yoga', 'fitness', 'exercise', 'pilates', 'non-slip', 'eco-friendly', 'home-workout'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Thickness', value: '8 mm extra-cushioned support' },
      { key: 'Material', value: 'TPE eco-friendly foam construction' },
      { key: 'Size', value: '183 x 61 cm standard practice area' },
      { key: 'Surface', value: 'Textured anti-slip top and bottom layers' },
      { key: 'Use Case', value: 'Yoga, Pilates, stretching, and bodyweight training' },
      { key: 'Portability', value: 'Lightweight roll-up design' },
      { key: 'Included', value: 'Carrying strap included' },
      { key: 'Care', value: 'Wipe-clean moisture-resistant surface' },
    ],
  },
  {
    name: 'Adjustable Dumbbell Set',
    slug: 'adjustable-dumbbell-set',
    description: htmlParagraphs(
      'This adjustable dumbbell set is a smart space-saving solution for strength training at home. Instead of storing multiple pairs of dumbbells, you can quickly switch resistance levels on a single base, making workouts faster, cleaner, and more efficient.',
      'The secure dial-based adjustment system lets you move through warm-ups, hypertrophy sets, and heavier lifts with less clutter around your training area. A contoured handle and balanced weight distribution help the dumbbells feel stable in presses, rows, curls, lunges, and other core strength movements.',
      'Ideal for home gyms, apartments, and progressive training plans, this set gives you versatile resistance without demanding a dedicated rack or large workout footprint.'
    ),
    shortDescription:
      'A compact adjustable dumbbell system with quick weight changes, stable handling, and versatile resistance for home strength training.',
    price: 15999,
    discountedPrice: 13499,
    target_category: 'sports',
    sku: 'SPRT-DUMBBELL-001',
    stock: 35,
    tags: ['weights', 'strength', 'home-gym', 'adjustable', 'dumbbells', 'fitness-equipment', 'resistance-training'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Weight Range', value: 'Adjustable from 5 to 25 kg' },
      { key: 'Increment', value: '2.5 kg weight adjustment steps' },
      { key: 'Adjustment System', value: 'Quick-select dial system' },
      { key: 'Handle', value: 'Contoured grip for secure lifting' },
      { key: 'Construction', value: 'Steel core with durable outer coating' },
      { key: 'Footprint', value: 'Space-saving base replaces multiple dumbbell pairs' },
      { key: 'Best For', value: 'Home gyms, progressive overload, and full-body strength sessions' },
      { key: 'Included', value: 'Dumbbell pair with storage trays' },
    ],
  },
  {
    name: 'Treadmill with Incline',
    slug: 'treadmill-with-incline',
    description: htmlParagraphs(
      'This treadmill with incline is built for home users who want reliable cardio training without dedicating an entire room to gym equipment. Its compact frame fits well in apartments and spare rooms, while the foldable design makes post-workout storage far easier.',
      'A continuous-duty motor supports walking, jogging, and light-to-moderate running, and the adjustable incline helps increase intensity for better endurance and calorie burn. The running deck is cushioned to reduce joint impact, making it a more comfortable option for regular indoor training.',
      'From quick morning walks to structured interval sessions, this treadmill offers a practical at-home cardio solution for users looking to stay consistent regardless of weather or schedule.'
    ),
    shortDescription:
      'A foldable home treadmill with cushioned deck, adjustable incline, and dependable cardio performance for walking, jogging, and runs.',
    price: 44999,
    discountedPrice: 37999,
    target_category: 'sports',
    sku: 'SPRT-TREADMILL-001',
    stock: 15,
    tags: ['cardio', 'running', 'home-gym', 'treadmill', 'incline', 'foldable', 'indoor-training'],
    isFeatured: false,
    isActive: true,
    specifications: [
      { key: 'Motor', value: '2.5 HP continuous-duty motor' },
      { key: 'Speed Range', value: '1-12 km/h speed adjustment' },
      { key: 'Incline', value: 'Manual or powered incline up to 12%' },
      { key: 'Running Surface', value: 'Cushioned deck for reduced impact' },
      { key: 'Display', value: 'Console with time, speed, distance, calories, and heart rate metrics' },
      { key: 'Storage', value: 'Foldable frame with transport wheels' },
      { key: 'Max User Weight', value: 'Supports users up to 100 kg' },
      { key: 'Best For', value: 'Walking, jogging, intervals, and home cardio routines' },
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
      categoryMap.set(normalizeCategoryKey(cat.name), cat._id)
      categoryMap.set(normalizeCategoryKey(cat.slug), cat._id)
    })
    console.log(`📂 Created ${createdCategories.length} categories`)
    
    // Debug map
    console.log('Category map:', Object.fromEntries(categoryMap))

    // Insert products
    const productsWithCategory = products.map((product) => {
      const categoryId = categoryMap.get(normalizeCategoryKey(product.target_category))
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

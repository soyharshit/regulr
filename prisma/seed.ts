import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { tierForPoints } from "../src/lib/loyalty";

const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";

function createAdapter() {
  if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
    return new PrismaPg({ connectionString: databaseUrl });
  }

  if (databaseUrl.startsWith("file:")) {
    return new PrismaBetterSqlite3({ url: databaseUrl });
  }

  throw new Error("DATABASE_URL must be a file:, postgres:, or postgresql: URL");
}

const db = new PrismaClient({
  adapter: createAdapter(),
  log: ["error"],
});

// ─── Deterministic pseudo-random number generator ───────────────────────────
// Using a seeded PRNG so the seed produces consistent data each run.
// (Not used for idempotency — that is handled by upserts — but for consistency.)
let _seed = 42;
function rand(): number {
  _seed = (_seed * 1664525 + 1013904223) >>> 0;
  return _seed / 0xffffffff;
}
function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(randInt(7, 22), randInt(0, 59), randInt(0, 59), 0);
  return d;
}
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function lastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(isoDate(d));
  }
  return days;
}

// ─── Data definitions ─────────────────────────────────────────────────────────

const CAFES = [
  { slug: "brew-haven", name: "Brew Haven", city: "Bengaluru", brandColor: "#D4451A" },
  { slug: "chai-point", name: "Chai Point", city: "Mumbai", brandColor: "#2E7D32" },
  { slug: "espresso-lab", name: "Espresso Lab", city: "Pune", brandColor: "#1565C0" },
];

const BREW_HAVEN_MENU = [
  { name: "Cappuccino", price: 25000, zomatoPrice: 29000, description: "Classic Italian espresso with steamed milk foam", category: "beverages" },
  { name: "Cold Brew", price: 18000, zomatoPrice: 22000, description: "Slow-steeped cold brew coffee, smooth and rich", category: "beverages" },
  { name: "Matcha Latte", price: 22000, zomatoPrice: 26000, description: "Premium Japanese matcha with steamed oat milk", category: "beverages" },
  { name: "Espresso", price: 12000, zomatoPrice: 15000, description: "Double shot of our house blend espresso", category: "beverages" },
  { name: "Flat White", price: 20000, zomatoPrice: 24000, description: "Ristretto shots with velvety microfoam milk", category: "beverages" },
  { name: "Oat Milk Latte", price: 26000, zomatoPrice: 30000, description: "Smooth espresso with creamy oat milk", category: "beverages" },
  { name: "Hazelnut Mocha", price: 28000, zomatoPrice: 33000, description: "Espresso with hazelnut syrup, chocolate, and milk", category: "beverages" },
  { name: "Avocado Toast", price: 30000, zomatoPrice: 36000, description: "Smashed avocado on sourdough with chilli flakes", category: "food" },
  { name: "Croissant", price: 18000, zomatoPrice: 22000, description: "Buttery French pastry, baked fresh daily", category: "food" },
  { name: "Chicken Sandwich", price: 32000, zomatoPrice: 38000, description: "Grilled chicken with lettuce and aioli on brioche", category: "food" },
  { name: "Banana Bread", price: 15000, zomatoPrice: 18000, description: "Moist banana bread with walnut chunks", category: "food" },
  { name: "Granola Bowl", price: 24000, zomatoPrice: 28000, description: "House granola with Greek yoghurt and fresh berries", category: "food" },
  { name: "Chocolate Brownie", price: 15000, zomatoPrice: 18000, description: "Fudgy dark chocolate brownie with sea salt", category: "desserts" },
  { name: "Cheesecake", price: 22000, zomatoPrice: 26000, description: "New York style baked cheesecake with berry coulis", category: "desserts" },
  { name: "Tiramisu", price: 25000, zomatoPrice: 30000, description: "Classic Italian tiramisu with espresso-soaked ladyfingers", category: "desserts" },
  { name: "Almond Cookie", price: 10000, zomatoPrice: 12000, description: "Crunchy almond biscotti with white chocolate drizzle", category: "desserts" },
];

const CHAI_POINT_MENU = [
  { name: "Masala Chai", price: 8000, zomatoPrice: 10000, description: "Traditional spiced tea with ginger and cardamom", category: "beverages" },
  { name: "Cutting Chai", price: 6000, zomatoPrice: 8000, description: "Strong Mumbai-style half-cup tea", category: "beverages" },
  { name: "Ginger Lemon Tea", price: 10000, zomatoPrice: 12000, description: "Fresh ginger infused with lemon and honey", category: "beverages" },
  { name: "Kashmiri Kahwa", price: 16000, zomatoPrice: 19000, description: "Saffron and dry fruit infused Kashmiri green tea", category: "beverages" },
  { name: "Rose Milk", price: 12000, zomatoPrice: 15000, description: "Chilled rose-flavoured milk with basil seeds", category: "beverages" },
  { name: "Cold Coffee", price: 15000, zomatoPrice: 18000, description: "Blended cold coffee with ice cream", category: "beverages" },
  { name: "Turmeric Latte", price: 18000, zomatoPrice: 21000, description: "Golden milk with turmeric, pepper and cinnamon", category: "beverages" },
  { name: "Vada Pav", price: 8000, zomatoPrice: 10000, description: "Mumbai's iconic spiced potato fritter in a pav bun", category: "food" },
  { name: "Samosa", price: 6000, zomatoPrice: 8000, description: "Crispy triangles stuffed with spiced potato and peas", category: "food" },
  { name: "Pav Bhaji", price: 20000, zomatoPrice: 24000, description: "Spiced mashed vegetable curry served with buttered pav", category: "food" },
  { name: "Poha", price: 12000, zomatoPrice: 15000, description: "Flattened rice with mustard seeds, curry leaves and lemon", category: "food" },
  { name: "Bread Omelette", price: 15000, zomatoPrice: 18000, description: "Fluffy masala omelette served with buttered toast", category: "food" },
  { name: "Gulab Jamun", price: 10000, zomatoPrice: 12000, description: "Soft milk-solid dumplings soaked in rose-flavoured syrup", category: "desserts" },
  { name: "Rasgulla", price: 12000, zomatoPrice: 14000, description: "Spongy cottage cheese balls in light sugar syrup", category: "desserts" },
  { name: "Kulfi", price: 15000, zomatoPrice: 18000, description: "Traditional Indian ice cream with saffron and pistachio", category: "desserts" },
  { name: "Jalebi", price: 8000, zomatoPrice: 10000, description: "Crispy spiral sweets soaked in saffron sugar syrup", category: "desserts" },
];

const ESPRESSO_LAB_MENU = [
  { name: "Pour Over", price: 30000, zomatoPrice: 35000, description: "Hand-poured single origin, Chemex extraction", category: "beverages" },
  { name: "AeroPress", price: 25000, zomatoPrice: 30000, description: "Full-immersion brew with clean, bold flavours", category: "beverages" },
  { name: "Nitro Cold Brew", price: 32000, zomatoPrice: 38000, description: "Cold brew infused with nitrogen on tap", category: "beverages" },
  { name: "Single Origin Espresso", price: 20000, zomatoPrice: 24000, description: "Seasonal single-farm espresso, black", category: "beverages" },
  { name: "Gibraltar", price: 22000, zomatoPrice: 26000, description: "Double ristretto with a small amount of steamed milk", category: "beverages" },
  { name: "Cortado", price: 24000, zomatoPrice: 28000, description: "Equal parts espresso and warm milk", category: "beverages" },
  { name: "Cold Brew Tonic", price: 28000, zomatoPrice: 33000, description: "Cold brew over tonic water with citrus peel", category: "beverages" },
  { name: "Sourdough Toast", price: 22000, zomatoPrice: 26000, description: "Thick-cut sourdough with cultured butter and Marmite", category: "food" },
  { name: "Shakshuka", price: 35000, zomatoPrice: 42000, description: "Eggs poached in spiced tomato and bell pepper sauce", category: "food" },
  { name: "Eggs Benedict", price: 40000, zomatoPrice: 48000, description: "Poached eggs on English muffin with hollandaise sauce", category: "food" },
  { name: "Acai Bowl", price: 30000, zomatoPrice: 36000, description: "Frozen acai blended with banana, topped with granola", category: "food" },
  { name: "Smashed Avo", price: 28000, zomatoPrice: 33000, description: "Avocado on sourdough with poached egg and dukkah", category: "food" },
  { name: "Chocolate Fondant", price: 28000, zomatoPrice: 33000, description: "Warm dark chocolate lava cake with vanilla bean ice cream", category: "desserts" },
  { name: "Panna Cotta", price: 24000, zomatoPrice: 28000, description: "Silky Italian cream dessert with seasonal fruit compote", category: "desserts" },
  { name: "Affogato", price: 20000, zomatoPrice: 24000, description: "Vanilla ice cream drowned in hot espresso", category: "desserts" },
  { name: "Brownie Sundae", price: 22000, zomatoPrice: 26000, description: "Warm brownie with vanilla ice cream and chocolate sauce", category: "desserts" },
];

const CAFE_MENUS = [BREW_HAVEN_MENU, CHAI_POINT_MENU, ESPRESSO_LAB_MENU];

// Customer templates per cafe
const CUSTOMER_TIERS = [
  { tier: "PLATINUM", streakCount: 50, points: 5200 },
  { tier: "GOLD", streakCount: 30, points: 2150 },
  { tier: "SILVER", streakCount: 15, points: 850 },
  { tier: "BRONZE", streakCount: 5, points: 220 },
  { tier: "BRONZE", streakCount: 1, points: 60 },
];

// Customer names per cafe
const CUSTOMER_NAMES: Record<string, string[][]> = {
  "brew-haven": [
    ["Arjun Sharma", "arjun.sharma"],
    ["Priya Nair", "priya.nair"],
    ["Rahul Gupta", "rahul.gupta"],
    ["Sneha Reddy", "sneha.reddy"],
    ["Vikram Patel", "vikram.patel"],
  ],
  "chai-point": [
    ["Amit Joshi", "amit.joshi"],
    ["Kavya Singh", "kavya.singh"],
    ["Rohit Desai", "rohit.desai"],
    ["Pooja Mehta", "pooja.mehta"],
    ["Sanjay Kumar", "sanjay.kumar"],
  ],
  "espresso-lab": [
    ["Aditya Rao", "aditya.rao"],
    ["Meera Iyer", "meera.iyer"],
    ["Karan Malhotra", "karan.malhotra"],
    ["Divya Pillai", "divya.pillai"],
    ["Nikhil Verma", "nikhil.verma"],
  ],
};

const STATUSES = ["COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "READY", "PREPARING"];
const PAYMENT_METHODS = ["CASH", "CASH", "CASH", "CASH", "CASH", "CASH", "UPI", "UPI", "UPI", "RAZORPAY"];

async function main() {
  console.log("🌱 Starting idempotent demo seed...");
  console.log(`   Database: ${databaseUrl}`);

  const hashedPassword = await bcrypt.hash("password123", 12);

  // ─── 1. Superadmin ──────────────────────────────────────────────────────────
  const superadmin = await db.user.upsert({
    where: { email: "superadmin@regulr.in" },
    update: { name: "Super Admin", role: "SUPERADMIN" },
    create: {
      email: "superadmin@regulr.in",
      name: "Super Admin",
      role: "SUPERADMIN",
      password: hashedPassword,
    },
  });
  console.log(`✓ Superadmin: ${superadmin.email}`);

  // ─── 2. Cafe Owners ─────────────────────────────────────────────────────────
  const ownerEmails = [
    { email: "owner1@brewhaven.com", name: "Ravi Krishnamurthy", cafeSlug: "brew-haven" },
    { email: "owner2@chaipoint.com", name: "Sunita Agarwal", cafeSlug: "chai-point" },
    { email: "owner3@espressolab.com", name: "Anand Venkataraman", cafeSlug: "espresso-lab" },
  ];

  const ownerUsers: Record<string, typeof superadmin> = {};
  for (const ownerDef of ownerEmails) {
    const owner = await db.user.upsert({
      where: { email: ownerDef.email },
      update: { name: ownerDef.name, role: "OWNER" },
      create: {
        email: ownerDef.email,
        name: ownerDef.name,
        role: "OWNER",
        password: hashedPassword,
      },
    });
    ownerUsers[ownerDef.cafeSlug] = owner;
    console.log(`✓ Owner: ${owner.email}`);
  }

  // ─── 3. Cafes ────────────────────────────────────────────────────────────────
  const cafeRecords: Record<string, { id: string; slug: string; name: string }> = {};
  for (const cafeDef of CAFES) {
    const cafe = await db.cafe.upsert({
      where: { slug: cafeDef.slug },
      update: { name: cafeDef.name, brandColor: cafeDef.brandColor },
      create: { slug: cafeDef.slug, name: cafeDef.name, brandColor: cafeDef.brandColor },
    });
    cafeRecords[cafeDef.slug] = cafe;
    console.log(`✓ Cafe: ${cafe.name} (${cafe.slug})`);

    const settingsData = {
      loyaltyEnabled: true,
      pointsPerRupee: 1,
      streakMilestones: JSON.stringify([3, 7, 14, 30]),
      coupons: JSON.stringify([
        { code: "WELCOME10", discountPercent: 10, maxUses: 500 },
        { code: "FLAT50", discountPaise: 5000, maxUses: 200 },
      ]),
      rewards: JSON.stringify([
        { id: "rw_coffee", title: "Free coffee", cost: 200, description: "Any regular hot coffee, on the house" },
        { id: "rw_pastry", title: "Free pastry", cost: 150, description: "Pick any pastry" },
        { id: "rw_off50", title: "₹50 off your next order", cost: 100 },
        { id: "rw_combo", title: "Coffee + croissant combo", cost: 350 },
      ]),
    };
    await db.cafeSettings.upsert({
      where: { cafeId: cafe.id },
      update: settingsData,
      create: { cafeId: cafe.id, ...settingsData },
    });
  }

  // ─── 3b. Link demo owners to their cafes ────────────────────────────────────
  for (const ownerDef of ownerEmails) {
    const cafe = cafeRecords[ownerDef.cafeSlug];
    if (cafe) {
      await db.user.update({
        where: { email: ownerDef.email },
        data: { cafeId: cafe.id },
      });
    }
  }

  // ─── 4. Menu Items ───────────────────────────────────────────────────────────
  const menuItemMap: Record<string, { id: string; price: number; name: string }[]> = {};
  for (let i = 0; i < CAFES.length; i++) {
    const cafeDef = CAFES[i];
    const cafe = cafeRecords[cafeDef.slug];
    const menuDef = CAFE_MENUS[i];
    const cafeItems: { id: string; price: number; name: string }[] = [];

    for (const itemDef of menuDef) {
      // Upsert by (cafeId, name): findFirst then create-or-skip
      let item = await db.menuItem.findFirst({
        where: { cafeId: cafe.id, name: itemDef.name },
      });
      if (!item) {
        item = await db.menuItem.create({
          data: {
            cafeId: cafe.id,
            name: itemDef.name,
            description: itemDef.description,
            price: itemDef.price,
            zomatoPrice: itemDef.zomatoPrice,
            category: itemDef.category,
          },
        });
      } else {
        item = await db.menuItem.update({
          where: { id: item.id },
          data: {
            description: itemDef.description,
            price: itemDef.price,
            zomatoPrice: itemDef.zomatoPrice,
            category: itemDef.category,
            isAvailable: true,
          },
        });
      }
      cafeItems.push({ id: item.id, price: item.price, name: item.name });
    }
    menuItemMap[cafeDef.slug] = cafeItems;
    console.log(`✓ Menu items for ${cafeDef.name}: ${cafeItems.length} items`);
  }

  // ─── 5. Customers ────────────────────────────────────────────────────────────
  const customerMap: Record<string, { id: string }[]> = {};

  for (const cafeDef of CAFES) {
    const cafe = cafeRecords[cafeDef.slug];
    const names = CUSTOMER_NAMES[cafeDef.slug];
    const cafeCustomers: { id: string }[] = [];

    for (let i = 0; i < names.length; i++) {
      const [fullName, handle] = names[i];
      const tierDef = CUSTOMER_TIERS[i];
      const email = `${handle}@${cafeDef.slug}.demo`;

      // Upsert user
      const user = await db.user.upsert({
        where: { email },
        update: { name: fullName },
        create: {
          email,
          name: fullName,
          role: "CUSTOMER",
          password: hashedPassword,
        },
      });

      // Upsert customer profile (by cafeId + userId)
      const existing = await db.customer.findFirst({
        where: { cafeId: cafe.id, userId: user.id },
      });

      let customer;
      if (existing) {
        customer = await db.customer.update({
          where: { id: existing.id },
          data: {
            points: tierDef.points,
            tier: tierForPoints(tierDef.points),
            streakCount: tierDef.streakCount,
            streakCalendar: JSON.stringify(lastNDays(tierDef.streakCount)),
          },
        });
      } else {
        customer = await db.customer.create({
          data: {
            cafeId: cafe.id,
            userId: user.id,
            points: tierDef.points,
            tier: tierForPoints(tierDef.points),
            streakCount: tierDef.streakCount,
            streakCalendar: JSON.stringify(lastNDays(tierDef.streakCount)),
          },
        });
      }
      cafeCustomers.push({ id: customer.id });
    }
    customerMap[cafeDef.slug] = cafeCustomers;
    console.log(`✓ Customers for ${cafeDef.name}: ${cafeCustomers.length}`);
  }

  // ─── 6. Orders (90-day history) ───────────────────────────────────────────
  for (const cafeDef of CAFES) {
    const cafe = cafeRecords[cafeDef.slug];
    const cafeMenuItems = menuItemMap[cafeDef.slug];
    const cafeCustomers = customerMap[cafeDef.slug];

    // Idempotency check: if cafe already has >200 orders, skip
    const existingOrderCount = await db.order.count({
      where: { cafeId: cafe.id },
    });

    if (existingOrderCount > 200) {
      console.log(`⏭  Orders for ${cafeDef.name}: already seeded (${existingOrderCount} orders), skipping`);
      continue;
    }

    let totalOrders = 0;

    // Generate ~300 orders over 90 days (avg ~3.3/day, varied 2-8/day)
    for (let dayOffset = 89; dayOffset >= 0; dayOffset--) {
      const numOrdersToday = randInt(2, 8);

      for (let o = 0; o < numOrdersToday; o++) {
        const orderDate = daysAgo(dayOffset);
        const status = pick(STATUSES);
        const paymentMethod = pick(PAYMENT_METHODS);

        // 60% orders associated with a customer, 40% walk-in
        const isCustomerOrder = rand() < 0.6;
        const customerId = isCustomerOrder
          ? pick(cafeCustomers).id
          : null;

        // Pick 1-4 items for this order
        const numItems = randInt(1, 4);
        const selectedItems: { menuItemId: string; quantity: number; price: number }[] = [];
        let totalAmount = 0;

        for (let itemIdx = 0; itemIdx < numItems; itemIdx++) {
          const menuItem = pick(cafeMenuItems);
          const quantity = randInt(1, 3);
          const linePrice = menuItem.price * quantity;
          totalAmount += linePrice;
          selectedItems.push({
            menuItemId: menuItem.id,
            quantity,
            price: menuItem.price,
          });
        }

        // Ensure total is within ₹150-₹800 range (15000-80000 paise)
        // If out of range, clamp by adjusting quantities isn't straightforward,
        // so we just accept the natural variance (real data would be similar)
        if (totalAmount < 5000) totalAmount = 5000;
        if (totalAmount > 120000) totalAmount = 120000;

        const pointsEarned = status === "COMPLETED" ? Math.floor(totalAmount / 100) : 0;

        await db.order.create({
          data: {
            cafeId: cafe.id,
            customerId,
            subtotalAmount: totalAmount,
            discountAmount: 0,
            totalAmount,
            pointsEarned,
            status,
            paymentMethod,
            createdAt: orderDate,
            updatedAt: orderDate,
            orderItems: {
              create: selectedItems,
            },
          },
        });
        totalOrders++;
      }
    }
    console.log(`✓ Orders for ${cafeDef.name}: ${totalOrders} orders created`);
  }

  // ─── 7. Summary ───────────────────────────────────────────────────────────────
  const [
    totalUsers,
    totalCafes,
    totalMenuItems,
    totalCustomers,
    totalOrders,
    totalOrderItems,
  ] = await Promise.all([
    db.user.count(),
    db.cafe.count(),
    db.menuItem.count(),
    db.customer.count(),
    db.order.count(),
    db.orderItem.count(),
  ]);

  console.log("\n📊 Seed Summary:");
  console.log(`   Users:       ${totalUsers}`);
  console.log(`   Cafes:       ${totalCafes}`);
  console.log(`   Menu Items:  ${totalMenuItems}`);
  console.log(`   Customers:   ${totalCustomers}`);
  console.log(`   Orders:      ${totalOrders}`);
  console.log(`   Order Items: ${totalOrderItems}`);
  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error during database seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

// Mock/demo data used as fallback when the database is empty

export const MOCK_AGENTS = [
  { id: "mock-1", name: "Amara Kamau", phone: "0712 345 678", tier: "Gold" as const, sales: 58, earned: 42650, pending: 4572, status: "active", joined: "Jan 2024", avatar: "AK", commission_rate: 12, mpesa_phone: "0712 345 678" },
  { id: "mock-2", name: "Brian Ochieng", phone: "0723 456 789", tier: "Silver" as const, sales: 34, earned: 21300, pending: 2100, status: "active", joined: "Mar 2024", avatar: "BO", commission_rate: 10, mpesa_phone: "0723 456 789" },
  { id: "mock-3", name: "Cynthia Mwangi", phone: "0734 567 890", tier: "Gold" as const, sales: 71, earned: 56800, pending: 7840, status: "active", joined: "Nov 2023", avatar: "CM", commission_rate: 12, mpesa_phone: "0734 567 890" },
  { id: "mock-4", name: "David Njoroge", phone: "0745 678 901", tier: "Bronze" as const, sales: 12, earned: 8400, pending: 960, status: "inactive", joined: "Jun 2024", avatar: "DN", commission_rate: 8, mpesa_phone: "0745 678 901" },
  { id: "mock-5", name: "Fatima Abubakar", phone: "0756 789 012", tier: "Platinum" as const, sales: 134, earned: 98200, pending: 12400, status: "active", joined: "Aug 2023", avatar: "FA", commission_rate: 18, mpesa_phone: "0756 789 012" },
  { id: "mock-6", name: "George Waweru", phone: "0767 890 123", tier: "Silver" as const, sales: 27, earned: 18900, pending: 1800, status: "active", joined: "Apr 2024", avatar: "GW", commission_rate: 10, mpesa_phone: "0767 890 123" },
];

export const MOCK_TRANSACTIONS = [
  { id: "mock-tx-1", transaction_ref: "PLI-8821", agent_name: "Amara Kamau", customer: "John M.", product: "Samsung Galaxy A15", amount: 18500, commission: 2220, type: "C2B", status: "completed", time: "2h ago", mpesa_ref: "QHJ7823KL" },
  { id: "mock-tx-2", transaction_ref: "PLI-8820", agent_name: "Cynthia Mwangi", customer: "Aisha O.", product: "Ankara Maxi Dress", amount: 3200, commission: 384, type: "C2B", status: "completed", time: "4h ago", mpesa_ref: "MNP3391ZX" },
  { id: "mock-tx-3", transaction_ref: "PLI-8819", agent_name: "Fatima Abubakar", customer: "Kevin N.", product: "JBL Clip 4 Speaker", amount: 5800, commission: 696, type: "C2B", status: "completed", time: "5h ago", mpesa_ref: "RTY9912QW" },
  { id: "mock-tx-4", transaction_ref: "PLI-8818", agent_name: "Brian Ochieng", customer: "Grace W.", product: "Nike Air Force 1", amount: 7200, commission: 864, type: "C2B", status: "failed", time: "Yesterday", mpesa_ref: "—" },
  { id: "mock-tx-5", transaction_ref: "PLI-8817", agent_name: "Amara Kamau", customer: "Samuel K.", product: "Blender Pro 800W", amount: 3400, commission: 408, type: "C2B", status: "completed", time: "Yesterday", mpesa_ref: "BVC4421PL" },
  { id: "mock-tx-6", transaction_ref: "PLI-8816", agent_name: "George Waweru", customer: "Mercy A.", product: "Laptop Bag 15.6\"", amount: 1900, commission: 228, type: "C2B", status: "completed", time: "2 days ago", mpesa_ref: "XZP7712QR" },
  { id: "mock-tx-7", transaction_ref: "PO-441", agent_name: "Fatima Abubakar", customer: "—", product: "—", amount: 12400, commission: 0, type: "B2C", status: "paid", time: "Mar 01, 2026", mpesa_ref: "QHJ7823KL" },
  { id: "mock-tx-8", transaction_ref: "PO-440", agent_name: "Cynthia Mwangi", customer: "—", product: "—", amount: 8750, commission: 0, type: "B2C", status: "paid", time: "Feb 22, 2026", mpesa_ref: "MNP3391ZX" },
];

export const MOCK_PRODUCTS_SHOP = [
  { id: "mock-p-1", name: "Samsung Galaxy A15", category_name: "Electronics", price: 18500, original_price: 22000, emoji: "📱", badge: "Hot", rating: 4.8, total_sold: 142, stock: 14, is_active: true, description: null, category_id: null, image_url: null, created_by: null },
  { id: "mock-p-2", name: "Nike Air Force 1", category_name: "Fashion", price: 7200, original_price: 9500, emoji: "👟", badge: "Sale", rating: 4.6, total_sold: 89, stock: 8, is_active: true, description: null, category_id: null, image_url: null, created_by: null },
  { id: "mock-p-3", name: "Blender Pro 800W", category_name: "Home", price: 3400, original_price: 4200, emoji: "🥤", badge: "New", rating: 4.7, total_sold: 203, stock: 0, is_active: true, description: null, category_id: null, image_url: null, created_by: null },
  { id: "mock-p-4", name: "JBL Clip 4 Speaker", category_name: "Electronics", price: 5800, original_price: 7000, emoji: "🔊", badge: "Hot", rating: 4.9, total_sold: 317, stock: 22, is_active: true, description: null, category_id: null, image_url: null, created_by: null },
  { id: "mock-p-5", name: "Men's Slim Fit Suit", category_name: "Fashion", price: 8900, original_price: 12000, emoji: "👔", badge: null, rating: 4.5, total_sold: 56, stock: 10, is_active: true, description: null, category_id: null, image_url: null, created_by: null },
  { id: "mock-p-6", name: "Pressure Cooker 5L", category_name: "Home", price: 2800, original_price: 3500, emoji: "🍲", badge: "Sale", rating: 4.4, total_sold: 178, stock: 15, is_active: true, description: null, category_id: null, image_url: null, created_by: null },
  { id: "mock-p-7", name: "Laptop Bag 15.6\"", category_name: "Electronics", price: 1900, original_price: 2500, emoji: "💼", badge: null, rating: 4.3, total_sold: 94, stock: 20, is_active: true, description: null, category_id: null, image_url: null, created_by: null },
  { id: "mock-p-8", name: "Ankara Maxi Dress", category_name: "Fashion", price: 3200, original_price: 4000, emoji: "👗", badge: "Hot", rating: 4.9, total_sold: 265, stock: 5, is_active: true, description: null, category_id: null, image_url: null, created_by: null },
];

export const MOCK_CATEGORIES = [
  { id: "mock-cat-1", name: "Electronics", created_at: "" },
  { id: "mock-cat-2", name: "Fashion", created_at: "" },
  { id: "mock-cat-3", name: "Home", created_at: "" },
];

export const MOCK_ORDERS_AGENT = [
  { id: "mock-o-1", order_number: "PLI-8821", customer_name: "John M.", product: "Samsung Galaxy A15", total_amount: 18500, commission_amount: 2220, status: "delivered", created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: "mock-o-2", order_number: "PLI-8820", customer_name: "Aisha O.", product: "Ankara Maxi Dress", total_amount: 3200, commission_amount: 384, status: "processing", created_at: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: "mock-o-3", order_number: "PLI-8819", customer_name: "Kevin N.", product: "JBL Clip 4 Speaker", total_amount: 5800, commission_amount: 696, status: "delivered", created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "mock-o-4", order_number: "PLI-8818", customer_name: "Grace W.", product: "Nike Air Force 1", total_amount: 7200, commission_amount: 864, status: "cancelled", created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "mock-o-5", order_number: "PLI-8817", customer_name: "Samuel K.", product: "Blender Pro 800W", total_amount: 3400, commission_amount: 408, status: "delivered", created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
];

export const MOCK_PAYOUTS_AGENT = [
  { id: "mock-po-1", amount: 12400, status: "paid", created_at: "2026-03-01T00:00:00Z", payout_ref: "QHJ7823KL" },
  { id: "mock-po-2", amount: 8750, status: "paid", created_at: "2026-02-22T00:00:00Z", payout_ref: "MNP3391ZX" },
  { id: "mock-po-3", amount: 15200, status: "paid", created_at: "2026-02-15T00:00:00Z", payout_ref: "RTY9912QW" },
  { id: "mock-po-4", amount: 6300, status: "paid", created_at: "2026-02-08T00:00:00Z", payout_ref: "BVC4421PL" },
];

export const MOCK_WEEKLY = [
  { day: "Mon", sales: 3, earnings: 4200 },
  { day: "Tue", sales: 7, earnings: 9800 },
  { day: "Wed", sales: 5, earnings: 6500 },
  { day: "Thu", sales: 9, earnings: 14200 },
  { day: "Fri", sales: 12, earnings: 18500 },
  { day: "Sat", sales: 8, earnings: 11200 },
  { day: "Sun", sales: 4, earnings: 5800 },
];

export const MOCK_MONTHLY = [
  { month: "Sep", revenue: 142000, payouts: 18000 },
  { month: "Oct", revenue: 198000, payouts: 24000 },
  { month: "Nov", revenue: 231000, payouts: 29000 },
  { month: "Dec", revenue: 312000, payouts: 38000 },
  { month: "Jan", revenue: 278000, payouts: 34000 },
  { month: "Feb", revenue: 356000, payouts: 44000 },
  { month: "Mar", revenue: 189000, payouts: 22000 },
];

export const MOCK_PRODUCTS_ADMIN = [
  { id: "mock-pa-1", name: "Samsung Galaxy A15", emoji: "📱", categories: { name: "Electronics" }, price: 18500, stock: 14, total_sold: 142, revenue: 2627000 },
  { id: "mock-pa-2", name: "Nike Air Force 1", emoji: "👟", categories: { name: "Fashion" }, price: 7200, stock: 8, total_sold: 89, revenue: 640800 },
  { id: "mock-pa-3", name: "Blender Pro 800W", emoji: "🥤", categories: { name: "Home" }, price: 3400, stock: 0, total_sold: 203, revenue: 690200 },
  { id: "mock-pa-4", name: "JBL Clip 4 Speaker", emoji: "🔊", categories: { name: "Electronics" }, price: 5800, stock: 22, total_sold: 317, revenue: 1838600 },
  { id: "mock-pa-5", name: "Ankara Maxi Dress", emoji: "👗", categories: { name: "Fashion" }, price: 3200, stock: 5, total_sold: 265, revenue: 848000 },
];

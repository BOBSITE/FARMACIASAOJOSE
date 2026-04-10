import { createClient } from '@supabase/supabase-js';
import { MOCK_PRODUCTS } from './mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Error handling helper (replaces handleFirestoreError)
export function handleSupabaseError(error: any, operation: string, path: string): void {
  console.error(`[Supabase ${operation}] ${path}:`, error?.message || error);
}

// Seed products function (replaces Firebase seedProducts)
export async function seedProducts(): Promise<void> {
  console.log('Seeding products into Supabase...');
  
  // Delete all existing products
  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows
  
  if (deleteError) {
    console.error('Error deleting existing products:', deleteError);
    throw deleteError;
  }

  // Map mock products to Supabase schema (camelCase → snake_case)
  const productsToInsert = MOCK_PRODUCTS.map(p => ({
    name: p.name,
    ean: p.ean,
    sku: p.sku || null,
    manufacturer: p.manufacturer,
    category: p.category,
    subcategory: p.subcategory || null,
    badge: p.badge || null,
    price: p.price,
    promo_price: p.promoPrice || null,
    cost_price: p.costPrice || null,
    stock: p.stock,
    min_stock: p.minStock || 0,
    images: p.images,
    requires_prescription: p.requiresPrescription,
    stripe_type: p.stripeType || 'None',
    is_weekly_offer: p.isWeeklyOffer || false,
    description: p.description,
    variations: p.variations || [],
  }));

  const { error: insertError } = await supabase
    .from('products')
    .insert(productsToInsert);

  if (insertError) {
    console.error('Error seeding products:', insertError);
    throw insertError;
  }

  console.log(`Successfully seeded ${productsToInsert.length} products.`);
}

// Helper to convert Supabase row (snake_case) to app types (camelCase)
export function mapProductFromDb(row: any) {
  return {
    id: row.id,
    name: row.name,
    ean: row.ean || '',
    sku: row.sku || '',
    activeIngredient: row.active_ingredient || '',
    manufacturer: row.manufacturer,
    category: row.category,
    subcategory: row.subcategory || '',
    badge: row.badge || '',
    price: Number(row.price),
    promoPrice: row.promo_price ? Number(row.promo_price) : undefined,
    costPrice: row.cost_price ? Number(row.cost_price) : undefined,
    stock: row.stock,
    minStock: row.min_stock || 0,
    images: row.images || ['https://picsum.photos/seed/product/400/400'],
    requiresPrescription: row.requires_prescription,
    stripeType: row.stripe_type || 'None',
    isWeeklyOffer: row.is_weekly_offer || false,
    description: row.description || '',
    variations: row.variations || [],
  };
}

export function mapUserFromDb(row: any) {
  return {
    uid: row.id,
    email: row.email,
    displayName: row.display_name,
    cpf: row.cpf || '',
    phone: row.phone || '',
    address: row.address || undefined,
    role: row.role,
    loyaltyPoints: row.loyalty_points || 0,
    createdAt: row.created_at,
  };
}

export function mapOrderFromDb(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    total: Number(row.total),
    items: row.items || [],
    paymentMethod: row.payment_method,
    amountPaid: row.amount_paid ? Number(row.amount_paid) : undefined,
    change: row.change ? Number(row.change) : undefined,
    customerCpf: row.customer_cpf || null,
    isPdv: row.is_pdv || false,
    operatorId: row.operator_id || '',
    operatorName: row.operator_name || '',
    createdAt: row.created_at,
  };
}

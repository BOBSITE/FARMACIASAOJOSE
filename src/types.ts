export type UserRole = 'CLIENT' | 'ADMIN' | 'FARMACEUTICO' | 'ATENDENTE';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  cpf?: string;
  phone?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  role: UserRole;
  loyaltyPoints: number;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  ean: string;
  sku?: string;
  activeIngredient?: string;
  manufacturer: string;
  category: string;
  subcategory?: string;
  badge?: string;
  price: number;
  promoPrice?: number;
  costPrice?: number;
  stock: number;
  minStock?: number;
  images: string[];
  requiresPrescription: boolean;
  stripeType: 'None' | 'Red' | 'Black';
  description: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: number;
  items: any[]; // Using any[] for simplicity in items mapping
  paymentMethod: 'CASH' | 'CREDIT' | 'DEBIT' | 'PIX';
  amountPaid?: number;
  change?: number;
  customerCpf?: string | null;
  isPdv?: boolean;
  operatorId?: string;
  operatorName?: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  isActive: boolean;
  locked: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  purchasePrice: number;
  sellingPrice: number;
  wholesalePrice: number;
  category: string;
  gstPercent: number;
  unit: 'piece' | 'box' | 'pack';
  stock: number;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
  priceType: 'retail' | 'wholesale';
  discount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  items: CartItem[];
  subtotal: number;
  totalGst: number;
  totalDiscount: number;
  grandTotal: number;
  customerName?: string;
  customerPhone?: string;
  type: 'retail' | 'wholesale';
  createdAt: Date;
  createdBy: string;
}

export interface PurchaseEntry {
  id: string;
  productId: string;
  productName: string;
  supplierName: string;
  quantity: number;
  costPrice: number;
  invoiceNo: string;
  date: Date;
  notes?: string;
  createdAt: Date;
}

export interface DashboardStats {
  todaySales: number;
  monthSales: number;
  totalProducts: number;
  lowStockCount: number;
}

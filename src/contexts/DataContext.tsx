import React, { createContext, useContext, useState, useCallback } from 'react';
import { Product, Invoice, PurchaseEntry, CartItem } from '@/types';

interface DataContextType {
  products: Product[];
  invoices: Invoice[];
  purchases: PurchaseEntry[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => Invoice;
  addPurchase: (purchase: Omit<PurchaseEntry, 'id' | 'createdAt'>) => void;
  updateStock: (productId: string, quantity: number) => void;
  getLowStockProducts: () => Product[];
  getTopSellingProducts: (limit?: number) => { product: Product; soldCount: number }[];
  getTodaySales: () => number;
  getMonthSales: () => number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial mock products
const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Classmate Notebook 200 Pages',
    sku: 'NB-CL-200',
    purchasePrice: 45,
    sellingPrice: 60,
    wholesalePrice: 52,
    category: 'Notebooks',
    gstPercent: 12,
    unit: 'piece',
    stock: 150,
    lowStockThreshold: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Reynolds Ball Pen (Box of 20)',
    sku: 'PEN-REY-20',
    purchasePrice: 120,
    sellingPrice: 160,
    wholesalePrice: 140,
    category: 'Pens',
    gstPercent: 18,
    unit: 'box',
    stock: 45,
    lowStockThreshold: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'Apsara Pencils (Pack of 10)',
    sku: 'PEN-APS-10',
    purchasePrice: 35,
    sellingPrice: 50,
    wholesalePrice: 42,
    category: 'Pencils',
    gstPercent: 12,
    unit: 'pack',
    stock: 8,
    lowStockThreshold: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    name: 'Camlin Geometry Box',
    sku: 'GEO-CAM-01',
    purchasePrice: 85,
    sellingPrice: 120,
    wholesalePrice: 100,
    category: 'Geometry',
    gstPercent: 18,
    unit: 'piece',
    stock: 35,
    lowStockThreshold: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    name: 'A4 Paper Ream (500 sheets)',
    sku: 'PAP-A4-500',
    purchasePrice: 280,
    sellingPrice: 350,
    wholesalePrice: 310,
    category: 'Paper',
    gstPercent: 5,
    unit: 'pack',
    stock: 5,
    lowStockThreshold: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const INITIAL_INVOICES: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-001',
    items: [],
    subtotal: 520,
    totalGst: 62.4,
    totalDiscount: 0,
    grandTotal: 582.4,
    customerName: 'Walk-in Customer',
    type: 'retail',
    createdAt: new Date(),
    createdBy: 'admin',
  },
];

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('smartbill_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('smartbill_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [purchases, setPurchases] = useState<PurchaseEntry[]>(() => {
    const saved = localStorage.getItem('smartbill_purchases');
    return saved ? JSON.parse(saved) : [];
  });

  const saveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem('smartbill_products', JSON.stringify(newProducts));
  };

  const saveInvoices = (newInvoices: Invoice[]) => {
    setInvoices(newInvoices);
    localStorage.setItem('smartbill_invoices', JSON.stringify(newInvoices));
  };

  const savePurchases = (newPurchases: PurchaseEntry[]) => {
    setPurchases(newPurchases);
    localStorage.setItem('smartbill_purchases', JSON.stringify(newPurchases));
  };

  const addProduct = useCallback((product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    saveProducts([...products, newProduct]);
  }, [products]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    const updated = products.map(p =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
    );
    saveProducts(updated);
  }, [products]);

  const deleteProduct = useCallback((id: string) => {
    saveProducts(products.filter(p => p.id !== id));
  }, [products]);

  const updateStock = useCallback((productId: string, quantity: number) => {
    const updated = products.map(p =>
      p.id === productId ? { ...p, stock: p.stock + quantity, updatedAt: new Date() } : p
    );
    saveProducts(updated);
  }, [products]);

  const addInvoice = useCallback((invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => {
    const invoiceNumber = `INV-${String(invoices.length + 1).padStart(4, '0')}`;
    const newInvoice: Invoice = {
      ...invoice,
      id: Date.now().toString(),
      invoiceNumber,
      createdAt: new Date(),
    };
    
    // Update stock for each item
    invoice.items.forEach(item => {
      updateStock(item.product.id, -item.quantity);
    });
    
    saveInvoices([...invoices, newInvoice]);
    return newInvoice;
  }, [invoices, updateStock]);

  const addPurchase = useCallback((purchase: Omit<PurchaseEntry, 'id' | 'createdAt'>) => {
    const newPurchase: PurchaseEntry = {
      ...purchase,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    savePurchases([...purchases, newPurchase]);
    updateStock(purchase.productId, purchase.quantity);
  }, [purchases, updateStock]);

  const getLowStockProducts = useCallback(() => {
    return products.filter(p => p.stock <= p.lowStockThreshold);
  }, [products]);

  const getTopSellingProducts = useCallback((limit = 5) => {
    const salesCount: Record<string, number> = {};
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        salesCount[item.product.id] = (salesCount[item.product.id] || 0) + item.quantity;
      });
    });
    
    return products
      .map(p => ({ product: p, soldCount: salesCount[p.id] || 0 }))
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, limit);
  }, [products, invoices]);

  const getTodaySales = useCallback(() => {
    const today = new Date().toDateString();
    return invoices
      .filter(inv => new Date(inv.createdAt).toDateString() === today)
      .reduce((sum, inv) => sum + inv.grandTotal, 0);
  }, [invoices]);

  const getMonthSales = useCallback(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return invoices
      .filter(inv => {
        const d = new Date(inv.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, inv) => sum + inv.grandTotal, 0);
  }, [invoices]);

  return (
    <DataContext.Provider value={{
      products,
      invoices,
      purchases,
      addProduct,
      updateProduct,
      deleteProduct,
      addInvoice,
      addPurchase,
      updateStock,
      getLowStockProducts,
      getTopSellingProducts,
      getTodaySales,
      getMonthSales,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

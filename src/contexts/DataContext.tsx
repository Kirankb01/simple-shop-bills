import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Product, Invoice, PurchaseEntry } from '@/types';

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
  refreshData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  products: 'smartbill_products',
  invoices: 'smartbill_invoices',
  purchases: 'smartbill_purchases',
};

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

const INITIAL_INVOICES: Invoice[] = [];

// Helper to load from localStorage with proper date parsing
const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved, (k, v) => {
        if (k === 'createdAt' || k === 'updatedAt') {
          return new Date(v);
        }
        return v;
      });
    }
  } catch (e) {
    console.error(`Error loading ${key} from storage:`, e);
  }
  return fallback;
};

// Helper to save to localStorage
const saveToStorage = <T,>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    // Dispatch custom event for cross-tab sync
    window.dispatchEvent(new CustomEvent('smartbill-storage-update', { detail: { key } }));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => 
    loadFromStorage(STORAGE_KEYS.products, INITIAL_PRODUCTS)
  );

  const [invoices, setInvoices] = useState<Invoice[]>(() => 
    loadFromStorage(STORAGE_KEYS.invoices, INITIAL_INVOICES)
  );

  const [purchases, setPurchases] = useState<PurchaseEntry[]>(() => 
    loadFromStorage(STORAGE_KEYS.purchases, [])
  );

  // Refresh data from localStorage (useful for cross-tab sync)
  const refreshData = useCallback(() => {
    setProducts(loadFromStorage(STORAGE_KEYS.products, INITIAL_PRODUCTS));
    setInvoices(loadFromStorage(STORAGE_KEYS.invoices, INITIAL_INVOICES));
    setPurchases(loadFromStorage(STORAGE_KEYS.purchases, []));
  }, []);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.products) {
        setProducts(loadFromStorage(STORAGE_KEYS.products, INITIAL_PRODUCTS));
      } else if (e.key === STORAGE_KEYS.invoices) {
        setInvoices(loadFromStorage(STORAGE_KEYS.invoices, INITIAL_INVOICES));
      } else if (e.key === STORAGE_KEYS.purchases) {
        setPurchases(loadFromStorage(STORAGE_KEYS.purchases, []));
      }
    };

    // Listen for custom events (same tab updates from other components)
    const handleCustomUpdate = (e: CustomEvent<{ key: string }>) => {
      if (e.detail.key === STORAGE_KEYS.products) {
        setProducts(loadFromStorage(STORAGE_KEYS.products, INITIAL_PRODUCTS));
      } else if (e.detail.key === STORAGE_KEYS.invoices) {
        setInvoices(loadFromStorage(STORAGE_KEYS.invoices, INITIAL_INVOICES));
      } else if (e.detail.key === STORAGE_KEYS.purchases) {
        setPurchases(loadFromStorage(STORAGE_KEYS.purchases, []));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('smartbill-storage-update', handleCustomUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('smartbill-storage-update', handleCustomUpdate as EventListener);
    };
  }, []);

  // Save products and update state atomically
  const saveProducts = useCallback((newProducts: Product[]) => {
    setProducts(newProducts);
    saveToStorage(STORAGE_KEYS.products, newProducts);
  }, []);

  // Save invoices and update state atomically
  const saveInvoices = useCallback((newInvoices: Invoice[]) => {
    setInvoices(newInvoices);
    saveToStorage(STORAGE_KEYS.invoices, newInvoices);
  }, []);

  // Save purchases and update state atomically
  const savePurchases = useCallback((newPurchases: PurchaseEntry[]) => {
    setPurchases(newPurchases);
    saveToStorage(STORAGE_KEYS.purchases, newPurchases);
  }, []);

  const addProduct = useCallback((product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // Use functional update to ensure we have latest state
    setProducts(prev => {
      const updated = [...prev, newProduct];
      saveToStorage(STORAGE_KEYS.products, updated);
      return updated;
    });
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts(prev => {
      const updated = prev.map(p =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      );
      saveToStorage(STORAGE_KEYS.products, updated);
      return updated;
    });
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== id);
      saveToStorage(STORAGE_KEYS.products, updated);
      return updated;
    });
  }, []);

  const updateStock = useCallback((productId: string, quantity: number) => {
    setProducts(prev => {
      const updated = prev.map(p =>
        p.id === productId ? { ...p, stock: p.stock + quantity, updatedAt: new Date() } : p
      );
      saveToStorage(STORAGE_KEYS.products, updated);
      return updated;
    });
  }, []);

  const addInvoice = useCallback((invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => {
    let newInvoice: Invoice;
    
    setInvoices(prev => {
      const invoiceNumber = `INV-${String(prev.length + 1).padStart(4, '0')}`;
      newInvoice = {
        ...invoice,
        id: Date.now().toString(),
        invoiceNumber,
        createdAt: new Date(),
      };
      const updated = [...prev, newInvoice];
      saveToStorage(STORAGE_KEYS.invoices, updated);
      return updated;
    });
    
    // Update stock for each item
    invoice.items.forEach(item => {
      updateStock(item.product.id, -item.quantity);
    });
    
    return newInvoice!;
  }, [updateStock]);

  const addPurchase = useCallback((purchase: Omit<PurchaseEntry, 'id' | 'createdAt'>) => {
    const newPurchase: PurchaseEntry = {
      ...purchase,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    
    setPurchases(prev => {
      const updated = [...prev, newPurchase];
      saveToStorage(STORAGE_KEYS.purchases, updated);
      return updated;
    });
    
    updateStock(purchase.productId, purchase.quantity);
  }, [updateStock]);

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
      refreshData,
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

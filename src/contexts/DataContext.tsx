import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Product, Invoice, PurchaseEntry, CartItem } from '@/types';
import { productService } from '@/services/productService';
import { invoiceService } from '@/services/invoiceService';
import { purchaseService } from '@/services/purchaseService';
import { useAuth } from './AuthContext';
import { startOfMonth, startOfToday } from 'date-fns';

interface DataContextType {
  products: Product[];
  invoices: Invoice[];
  purchases: PurchaseEntry[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>, items: CartItem[]) => Promise<Invoice>;
  addPurchase: (purchase: Omit<PurchaseEntry, 'id' | 'createdAt'>) => Promise<void>;
  updateStock: (productId: string, quantity: number) => Promise<void>;
  getLowStockProducts: () => Product[];
  getTopSellingProducts: (limit?: number) => Array<{ product: Product; soldCount: number }>;
  getTodaySales: () => number;
  getMonthSales: () => number;
  refreshData: () => Promise<void>;
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [purchases, setPurchases] = useState<PurchaseEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from Cloud
  const loadData = useCallback(async () => {
    if (!user || authLoading) return;

    try {
      setLoading(true);
      const [productsData, invoicesData, purchasesData] = await Promise.all([
        productService.getAll(),
        invoiceService.getAll(),
        purchaseService.getAll(),
      ]);

      setProducts(productsData);
      setInvoices(invoicesData);
      setPurchases(purchasesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!user) return;

    const unsubscribeProducts = productService.subscribeToChanges(() => {
      productService.getAll().then(setProducts);
    });

    const unsubscribeInvoices = invoiceService.subscribeToChanges(() => {
      invoiceService.getAll().then(setInvoices);
    });

    const unsubscribePurchases = purchaseService.subscribeToChanges(() => {
      purchaseService.getAll().then(setPurchases);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeInvoices();
      unsubscribePurchases();
    };
  }, [user]);

  const addProduct = useCallback(
    async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newProduct = await productService.create(product);
      setProducts(prev => [...prev, newProduct]);
    },
    []
  );

  const updateProduct = useCallback(async (id: string, product: Partial<Product>) => {
    const updated = await productService.update(id, product);
    setProducts(prev => prev.map(p => (p.id === id ? updated : p)));
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    await productService.delete(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  const addInvoice = useCallback(
    async (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>, items: CartItem[]): Promise<Invoice> => {
      const invoiceNumber = `INV-${String(invoices.length + 1).padStart(4, '0')}`;
      const invoiceWithNumber = { ...invoice, invoiceNumber };
      const newInvoice = await invoiceService.create(invoiceWithNumber, items);
      setInvoices(prev => [newInvoice, ...prev]);
      
      // Refresh products to get updated stock
      const updatedProducts = await productService.getAll();
      setProducts(updatedProducts);
      
      return newInvoice;
    },
    [invoices]
  );

  const addPurchase = useCallback(
    async (purchase: Omit<PurchaseEntry, 'id' | 'createdAt'>) => {
      const newPurchase = await purchaseService.create(purchase);
      setPurchases(prev => [newPurchase, ...prev]);
      
      // Refresh products to get updated stock
      const updatedProducts = await productService.getAll();
      setProducts(updatedProducts);
    },
    []
  );

  const updateStock = useCallback(async (productId: string, quantity: number) => {
    await productService.updateStock(productId, quantity);
    const updatedProducts = await productService.getAll();
    setProducts(updatedProducts);
  }, []);

  const getLowStockProducts = useCallback(() => {
    return products.filter(p => p.stock <= p.lowStockThreshold);
  }, [products]);

  const getTopSellingProducts = useCallback(
    (limit = 5) => {
      const productSales = new Map<string, number>();

      invoices.forEach(invoice => {
        invoice.items.forEach(item => {
          const current = productSales.get(item.product.id) || 0;
          productSales.set(item.product.id, current + item.quantity);
        });
      });

      const topProducts = Array.from(productSales.entries())
        .map(([productId, soldCount]) => {
          const product = products.find(p => p.id === productId);
          return product ? { product, soldCount } : null;
        })
        .filter((item): item is { product: Product; soldCount: number } => item !== null)
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, limit);

      return topProducts;
    },
    [products, invoices]
  );

  const getTodaySales = useCallback(() => {
    const today = startOfToday();
    return invoices
      .filter(inv => inv.createdAt >= today)
      .reduce((sum, inv) => sum + inv.grandTotal, 0);
  }, [invoices]);

  const getMonthSales = useCallback(() => {
    const monthStart = startOfMonth(new Date());
    return invoices
      .filter(inv => inv.createdAt >= monthStart)
      .reduce((sum, inv) => sum + inv.grandTotal, 0);
  }, [invoices]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return (
    <DataContext.Provider
      value={{
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
        loading,
      }}
    >
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

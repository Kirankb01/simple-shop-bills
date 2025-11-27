import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';

export const productService = {
  async getAll(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) throw error;

    return (data || []).map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      purchasePrice: Number(p.purchase_price),
      sellingPrice: Number(p.selling_price),
      wholesalePrice: Number(p.wholesale_price),
      category: p.category,
      gstPercent: Number(p.gst_percent),
      unit: p.unit as 'piece' | 'box' | 'pack',
      stock: p.stock,
      lowStockThreshold: p.low_stock_threshold,
      createdAt: new Date(p.created_at),
      updatedAt: new Date(p.updated_at),
    }));
  },

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      sku: data.sku,
      purchasePrice: Number(data.purchase_price),
      sellingPrice: Number(data.selling_price),
      wholesalePrice: Number(data.wholesale_price),
      category: data.category,
      gstPercent: Number(data.gst_percent),
      unit: data.unit as 'piece' | 'box' | 'pack',
      stock: data.stock,
      lowStockThreshold: data.low_stock_threshold,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },

  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        sku: product.sku,
        purchase_price: product.purchasePrice,
        selling_price: product.sellingPrice,
        wholesale_price: product.wholesalePrice,
        category: product.category,
        gst_percent: product.gstPercent,
        unit: product.unit,
        stock: product.stock,
        low_stock_threshold: product.lowStockThreshold,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      sku: data.sku,
      purchasePrice: Number(data.purchase_price),
      sellingPrice: Number(data.selling_price),
      wholesalePrice: Number(data.wholesale_price),
      category: data.category,
      gstPercent: Number(data.gst_percent),
      unit: data.unit as 'piece' | 'box' | 'pack',
      stock: data.stock,
      lowStockThreshold: data.low_stock_threshold,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },

  async update(id: string, product: Partial<Product>): Promise<Product> {
    const updateData: any = {};
    if (product.name !== undefined) updateData.name = product.name;
    if (product.sku !== undefined) updateData.sku = product.sku;
    if (product.purchasePrice !== undefined) updateData.purchase_price = product.purchasePrice;
    if (product.sellingPrice !== undefined) updateData.selling_price = product.sellingPrice;
    if (product.wholesalePrice !== undefined) updateData.wholesale_price = product.wholesalePrice;
    if (product.category !== undefined) updateData.category = product.category;
    if (product.gstPercent !== undefined) updateData.gst_percent = product.gstPercent;
    if (product.unit !== undefined) updateData.unit = product.unit;
    if (product.stock !== undefined) updateData.stock = product.stock;
    if (product.lowStockThreshold !== undefined) updateData.low_stock_threshold = product.lowStockThreshold;

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      sku: data.sku,
      purchasePrice: Number(data.purchase_price),
      sellingPrice: Number(data.selling_price),
      wholesalePrice: Number(data.wholesale_price),
      category: data.category,
      gstPercent: Number(data.gst_percent),
      unit: data.unit as 'piece' | 'box' | 'pack',
      stock: data.stock,
      lowStockThreshold: data.low_stock_threshold,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateStock(id: string, quantity: number): Promise<void> {
    const product = await this.getById(id);
    if (!product) throw new Error('Product not found');
    
    await this.update(id, { stock: product.stock + quantity });
  },

  subscribeToChanges(callback: () => void) {
    const channel = supabase
      .channel('product-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        () => callback()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};

import { supabase } from '@/integrations/supabase/client';
import { PurchaseEntry } from '@/types';

export const purchaseService = {
  async getAll(): Promise<PurchaseEntry[]> {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(p => ({
      id: p.id,
      productId: p.product_id,
      productName: p.product_name,
      supplierName: p.supplier_name,
      quantity: p.quantity,
      costPrice: Number(p.cost_price),
      invoiceNo: p.invoice_no,
      date: new Date(p.date),
      notes: p.notes || undefined,
      createdAt: new Date(p.created_at),
    }));
  },

  async create(purchase: Omit<PurchaseEntry, 'id' | 'createdAt'>): Promise<PurchaseEntry> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('purchases')
      .insert({
        product_id: purchase.productId,
        product_name: purchase.productName,
        supplier_name: purchase.supplierName,
        quantity: purchase.quantity,
        cost_price: purchase.costPrice,
        invoice_no: purchase.invoiceNo,
        date: purchase.date.toISOString(),
        notes: purchase.notes,
        created_by: user.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Update product stock and purchase price
    const { data: product } = await supabase
      .from('products')
      .select('stock')
      .eq('id', purchase.productId)
      .single();

    if (product) {
      await supabase
        .from('products')
        .update({
          stock: product.stock + purchase.quantity,
          purchase_price: purchase.costPrice,
        })
        .eq('id', purchase.productId);
    }

    return {
      id: data.id,
      productId: data.product_id,
      productName: data.product_name,
      supplierName: data.supplier_name,
      quantity: data.quantity,
      costPrice: Number(data.cost_price),
      invoiceNo: data.invoice_no,
      date: new Date(data.date),
      notes: data.notes || undefined,
      createdAt: new Date(data.created_at),
    };
  },

  subscribeToChanges(callback: () => void) {
    const channel = supabase
      .channel('purchase-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'purchases',
        },
        () => callback()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};

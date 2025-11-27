import { supabase } from '@/integrations/supabase/client';
import { Invoice, CartItem } from '@/types';

export const invoiceService = {
  async getAll(): Promise<Invoice[]> {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (invoices || []).map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      customerName: inv.customer_name || undefined,
      customerPhone: inv.customer_phone || undefined,
      type: inv.type as 'retail' | 'wholesale',
      subtotal: Number(inv.subtotal),
      totalGst: Number(inv.total_gst),
      totalDiscount: Number(inv.total_discount),
      grandTotal: Number(inv.grand_total),
      createdBy: inv.created_by,
      createdAt: new Date(inv.created_at),
      items: (inv.invoice_items || []).map((item: any) => ({
        product: {
          id: item.product_id,
          name: item.product_name,
        } as any,
        quantity: item.quantity,
        priceType: item.price_type as 'retail' | 'wholesale',
        discount: Number(item.discount),
      })),
    }));
  },

  async create(
    invoice: Omit<Invoice, 'id' | 'createdAt'>,
    items: CartItem[]
  ): Promise<Invoice> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    // Create invoice
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoice.invoiceNumber,
        customer_name: invoice.customerName,
        customer_phone: invoice.customerPhone,
        type: invoice.type,
        subtotal: invoice.subtotal,
        total_gst: invoice.totalGst,
        total_discount: invoice.totalDiscount,
        grand_total: invoice.grandTotal,
        created_by: user.user.id,
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Create invoice items
    const itemsData = items.map(item => ({
      invoice_id: invoiceData.id,
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      price_type: item.priceType,
      unit_price: item.priceType === 'retail' 
        ? item.product.sellingPrice 
        : item.product.wholesalePrice,
      discount: item.discount,
      line_total: item.quantity * 
        (item.priceType === 'retail' ? item.product.sellingPrice : item.product.wholesalePrice) * 
        (1 - item.discount / 100),
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsData);

    if (itemsError) throw itemsError;

    // Update product stock
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product.id)
        .single();

      if (product) {
        await supabase
          .from('products')
          .update({ stock: product.stock - item.quantity })
          .eq('id', item.product.id);
      }
    }

    return {
      id: invoiceData.id,
      invoiceNumber: invoiceData.invoice_number,
      customerName: invoiceData.customer_name || undefined,
      customerPhone: invoiceData.customer_phone || undefined,
      type: invoiceData.type as 'retail' | 'wholesale',
      subtotal: Number(invoiceData.subtotal),
      totalGst: Number(invoiceData.total_gst),
      totalDiscount: Number(invoiceData.total_discount),
      grandTotal: Number(invoiceData.grand_total),
      createdBy: invoiceData.created_by,
      createdAt: new Date(invoiceData.created_at),
      items,
    };
  },

  subscribeToChanges(callback: () => void) {
    const channel = supabase
      .channel('invoice-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'invoices',
        },
        () => callback()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};

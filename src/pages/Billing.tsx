import { useState, useMemo, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { CartItem, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart,
  Printer,
  Receipt,
  User,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Billing() {
  const { products, addInvoice } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [billType, setBillType] = useState<'retail' | 'wholesale'>('retail');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products.slice(0, 8);
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const addToCart = (product: Product) => {
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { product, quantity: 1, priceType: billType, discount: 0 }]);
    }
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantity = Math.max(1, newCart[index].quantity + delta);
    setCart(newCart);
  };

  const setQuantity = (index: number, qty: number) => {
    const newCart = [...cart];
    newCart[index].quantity = Math.max(1, qty);
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const getItemPrice = (item: CartItem) => {
    return billType === 'wholesale' ? item.product.wholesalePrice : item.product.sellingPrice;
  };

  const getItemTotal = (item: CartItem) => {
    const price = getItemPrice(item);
    const subtotal = price * item.quantity;
    const discount = (subtotal * item.discount) / 100;
    return subtotal - discount;
  };

  const updateDiscount = (index: number, discount: number) => {
    const newCart = [...cart];
    newCart[index].discount = Math.max(0, Math.min(100, discount));
    setCart(newCart);
  };

  const totals = useMemo(() => {
    const totalBeforeDiscount = cart.reduce((sum, item) => {
      const price = getItemPrice(item);
      return sum + (price * item.quantity);
    }, 0);
    const totalDiscount = cart.reduce((sum, item) => {
      const price = getItemPrice(item);
      return sum + (price * item.quantity * item.discount) / 100;
    }, 0);
    const grandTotal = totalBeforeDiscount - totalDiscount;
    return {
      subtotal: totalBeforeDiscount,
      totalGst: 0,
      totalDiscount,
      grandTotal,
    };
  }, [cart, billType]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleSaveBill = () => {
    if (cart.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add items to the cart before saving.',
        variant: 'destructive',
      });
      return;
    }

    const invoice = addInvoice({
      items: cart,
      subtotal: totals.subtotal,
      totalGst: totals.totalGst,
      totalDiscount: totals.totalDiscount,
      grandTotal: totals.grandTotal,
      customerName: customerName || 'Walk-in Customer',
      customerPhone,
      type: billType,
      createdBy: user?.id || '',
    });

    setLastInvoice(invoice);
    setShowInvoice(true);
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');

    toast({
      title: 'Invoice saved!',
      description: `Invoice ${invoice.invoiceNumber} has been created.`,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
            Billing
          </h1>
          <p className="text-sm text-muted-foreground">Create invoices for customers</p>
        </div>
        <Select value={billType} onValueChange={(v: 'retail' | 'wholesale') => setBillType(v)}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="retail">Retail</SelectItem>
            <SelectItem value="wholesale">Wholesale</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Product Search & Selection */}
        <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
          {/* Search */}
          <Card>
            <CardContent className="pt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base sm:text-lg search-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Grid */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base">
                {searchQuery ? `Results for "${searchQuery}"` : 'Quick Add'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold price-display text-sm sm:text-base">
                        {formatCurrency(billType === 'wholesale' ? product.wholesalePrice : product.sellingPrice)}
                      </p>
                      <Badge 
                        variant={product.stock <= product.lowStockThreshold ? 'destructive' : 'secondary'} 
                        className="text-xs"
                      >
                        {product.stock}
                      </Badge>
                    </div>
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </button>
                ))}
              </div>
              {filteredProducts.length === 0 && (
                <p className="text-center py-6 text-muted-foreground text-sm">No products found</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart Section */}
        <div className="space-y-4 order-1 lg:order-2">
          {/* Customer Details */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <Input
                placeholder="Name (Optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <Input
                placeholder="Phone (Optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Cart Items */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2 sm:pb-3 flex-shrink-0">
              <CardTitle className="text-sm sm:text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Cart ({cart.length})
                </span>
                <Badge variant={billType === 'wholesale' ? 'default' : 'secondary'} className="text-xs">
                  {billType}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto max-h-[300px] lg:max-h-[400px]">
              {cart.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground text-sm">Cart is empty</p>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {cart.map((item, index) => (
                    <div key={item.product.id} className="p-2 sm:p-3 rounded-lg bg-muted/50 animate-scale-in">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm truncate">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(getItemPrice(item))} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold price-display text-xs sm:text-sm shrink-0">
                          {formatCurrency(getItemTotal(item))}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => updateQuantity(index, -1)}
                        >
                          <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => setQuantity(index, parseInt(e.target.value) || 1)}
                          className="h-7 sm:h-8 w-12 sm:w-14 text-center text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => updateQuantity(index, 1)}
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={item.discount}
                            onChange={(e) => updateDiscount(index, parseFloat(e.target.value) || 0)}
                            className="h-7 sm:h-8 w-12 sm:w-14 text-center text-sm"
                            placeholder="0"
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive ml-auto"
                          onClick={() => removeFromCart(index)}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent className="pt-4 space-y-2 sm:space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="price-display">{formatCurrency(totals.subtotal)}</span>
              </div>
              {totals.totalDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(totals.totalDiscount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold text-sm sm:text-base">Grand Total</span>
                <span className="price-large text-lg sm:text-xl">{formatCurrency(totals.grandTotal)}</span>
              </div>
              <Button 
                className="w-full h-10 sm:h-12 text-sm sm:text-lg btn-billing"
                onClick={handleSaveBill}
                disabled={cart.length === 0}
              >
                <Receipt className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Save & Print Bill
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invoice Preview Dialog */}
      <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
              Invoice {lastInvoice?.invoiceNumber}
            </DialogTitle>
          </DialogHeader>
          {lastInvoice && (
            <div className="space-y-3 sm:space-y-4">
              <div className="text-center border-b pb-3 sm:pb-4">
                <h2 className="text-lg sm:text-xl font-bold">SmartBill Store</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Your Stationery Partner</p>
              </div>
              <div className="text-xs sm:text-sm space-y-1">
                <p><span className="text-muted-foreground">Customer:</span> {lastInvoice.customerName}</p>
                <p><span className="text-muted-foreground">Date:</span> {new Date(lastInvoice.createdAt).toLocaleString()}</p>
                <p><span className="text-muted-foreground">Type:</span> {lastInvoice.type}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                {lastInvoice.items.map((item: CartItem, i: number) => (
                  <div key={i} className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="truncate flex-1">{item.product.name} × {item.quantity}</span>
                    <span className="shrink-0">{formatCurrency(getItemTotal(item))}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(lastInvoice.subtotal)}</span>
                </div>
                {lastInvoice.totalDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(lastInvoice.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base sm:text-lg pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(lastInvoice.grandTotal)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowInvoice(false)} className="w-full sm:w-auto">
              Close
            </Button>
            <Button onClick={handlePrint} className="w-full sm:w-auto">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
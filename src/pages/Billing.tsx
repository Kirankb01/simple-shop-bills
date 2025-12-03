import { useState, useMemo, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { CartItem, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Package,
  X
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
    if (!searchQuery) return products.slice(0, 12);
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

  const handleSaveBill = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add items to the cart before saving.',
        variant: 'destructive',
      });
      return;
    }

    const invoice = await addInvoice({
      items: cart,
      subtotal: totals.subtotal,
      totalGst: totals.totalGst,
      totalDiscount: totals.totalDiscount,
      grandTotal: totals.grandTotal,
      customerName: customerName || 'Walk-in Customer',
      customerPhone,
      type: billType,
      createdBy: user?.id || '',
    }, cart);

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
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            Point of Sale
          </h1>
          <p className="text-muted-foreground mt-1">Create invoices quickly and efficiently</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={billType} onValueChange={(v: 'retail' | 'wholesale') => setBillType(v)}>
            <SelectTrigger className="w-36 h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="wholesale">Wholesale</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Product Search & Selection - Left Side */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search Bar */}
          <Card className="border-0 shadow-soft">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search products by name, SKU, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 search-input-lg"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Grid */}
          <Card className="border-0 shadow-soft">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  {searchQuery ? `Results for "${searchQuery}"` : 'Products'}
                </CardTitle>
                <Badge variant="secondary" className="font-medium">
                  {filteredProducts.length} items
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="product-card text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{product.sku}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-bold text-primary">
                          {formatCurrency(billType === 'wholesale' ? product.wholesalePrice : product.sellingPrice)}
                        </span>
                        <Badge 
                          variant={product.stock <= product.lowStockThreshold ? 'destructive' : 'secondary'} 
                          className="text-[10px] h-5"
                        >
                          {product.stock} in stock
                        </Badge>
                      </div>
                    </div>
                    <div className="ml-2 p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <Plus className="h-4 w-4" />
                    </div>
                  </button>
                ))}
              </div>
              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No products found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart Section - Right Side */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Details */}
          <Card className="border-0 shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Customer name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-11"
              />
              <Input
                placeholder="Phone number (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="h-11"
              />
            </CardContent>
          </Card>

          {/* Cart Items */}
          <Card className="border-0 shadow-soft flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  Cart
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={billType === 'wholesale' ? 'default' : 'secondary'} className="font-medium">
                    {billType}
                  </Badge>
                  <Badge variant="outline" className="font-semibold">
                    {cart.length} items
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto max-h-[350px] scrollbar-thin">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Your cart is empty</p>
                  <p className="text-sm text-muted-foreground/70">Add products to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, index) => (
                    <div key={item.product.id} className="cart-item">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(getItemPrice(item))} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-primary">
                            {formatCurrency(getItemTotal(item))}
                          </p>
                          {item.discount > 0 && (
                            <p className="text-xs text-success">-{item.discount}%</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-muted rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-r-none"
                            onClick={() => updateQuantity(index, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => setQuantity(index, parseInt(e.target.value) || 1)}
                            className="h-8 w-12 text-center border-0 bg-transparent text-sm font-medium"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-l-none"
                            onClick={() => updateQuantity(index, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-1 flex-1">
                          <Input
                            type="number"
                            value={item.discount}
                            onChange={(e) => updateDiscount(index, parseFloat(e.target.value) || 0)}
                            className="h-8 w-14 text-center text-sm"
                            placeholder="0"
                          />
                          <span className="text-xs text-muted-foreground">% off</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeFromCart(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bill Summary */}
          <Card className="border-0 shadow-medium bg-gradient-to-br from-card to-muted/30">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Discount</span>
                    <span className="font-medium">-{formatCurrency(totals.totalDiscount)}</span>
                  </div>
                )}
              </div>
              <Separator />
              <div className="flex justify-between items-end">
                <span className="text-lg font-semibold">Grand Total</span>
                <span className="price-xl text-primary">{formatCurrency(totals.grandTotal)}</span>
              </div>
              <Button 
                className="w-full h-14 text-lg font-semibold btn-billing rounded-xl"
                onClick={handleSaveBill}
                disabled={cart.length === 0}
              >
                <Receipt className="mr-2 h-5 w-5" />
                Save & Print Invoice
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invoice Preview Dialog */}
      <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-5 w-5 text-primary" />
              Invoice {lastInvoice?.invoiceNumber}
            </DialogTitle>
          </DialogHeader>
          {lastInvoice && (
            <div className="space-y-4">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold">SmartBill Store</h2>
                <p className="text-sm text-muted-foreground">Your Stationery Partner</p>
              </div>
              <div className="text-sm space-y-1 bg-muted/50 p-3 rounded-lg">
                <p><span className="text-muted-foreground">Customer:</span> <span className="font-medium">{lastInvoice.customerName}</span></p>
                <p><span className="text-muted-foreground">Date:</span> <span className="font-medium">{new Date(lastInvoice.createdAt).toLocaleString()}</span></p>
                <p><span className="text-muted-foreground">Type:</span> <Badge variant="outline" className="ml-1">{lastInvoice.type}</Badge></p>
              </div>
              <Separator />
              <div className="space-y-2">
                {lastInvoice.items.map((item: CartItem, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="truncate flex-1">{item.product.name} × {item.quantity}</span>
                    <span className="font-medium ml-2">{formatCurrency(getItemTotal(item))}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(lastInvoice.subtotal)}</span>
                </div>
                {lastInvoice.totalDiscount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount</span>
                    <span>-{formatCurrency(lastInvoice.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(lastInvoice.grandTotal)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowInvoice(false)}>
              Close
            </Button>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductAutocomplete } from '@/components/ProductAutocomplete';
import { 
  PackagePlus,
  Calendar,
  FileText,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';

export default function PurchaseEntry() {
  const { products, purchases, addPurchase } = useData();
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    productId: '',
    supplierName: '',
    quantity: 0,
    costPrice: 0,
    invoiceNo: '',
    notes: '',
  });

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      ...formData,
      productId: product.id,
      costPrice: product.purchasePrice,
    });
  };

  const clearSelectedProduct = () => {
    setSelectedProduct(null);
    setFormData({
      ...formData,
      productId: '',
      costPrice: 0,
    });
  };

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId || !formData.supplierName || !formData.quantity) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const product = products.find(p => p.id === formData.productId);
    
    addPurchase({
      productId: formData.productId,
      productName: product?.name || '',
      supplierName: formData.supplierName,
      quantity: formData.quantity,
      costPrice: formData.costPrice,
      invoiceNo: formData.invoiceNo,
      date: new Date(),
      notes: formData.notes,
    });

    toast({
      title: 'Purchase recorded',
      description: `Added ${formData.quantity} units of ${product?.name} to inventory.`,
    });

    setSelectedProduct(null);
    setFormData({
      productId: '',
      supplierName: '',
      quantity: 0,
      costPrice: 0,
      invoiceNo: '',
      notes: '',
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <PackagePlus className="h-5 w-5 sm:h-6 sm:w-6" />
          Purchase Entry
        </h1>
        <p className="text-sm text-muted-foreground">Record stock purchases</p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader className="py-3 sm:py-4">
            <CardTitle className="text-base sm:text-lg">New Purchase</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <Label className="text-sm">Product *</Label>
                {selectedProduct ? (
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{selectedProduct.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedProduct.sku} • Stock: {selectedProduct.stock}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={clearSelectedProduct}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <ProductAutocomplete
                    products={products}
                    onSelect={handleProductSelect}
                    placeholder="Search products..."
                  />
                )}
              </div>

              <div>
                <Label className="text-sm">Supplier Name *</Label>
                <Input
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  placeholder="Enter supplier name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-sm">Quantity *</Label>
                  <Input
                    type="number"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-sm">Cost Price (₹)</Label>
                  <Input
                    type="number"
                    value={formData.costPrice || ''}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">Supplier Invoice No.</Label>
                <Input
                  value={formData.invoiceNo}
                  onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                  placeholder="e.g., INV-12345"
                />
              </div>

              <div>
                <Label className="text-sm">Notes (Optional)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={3}
                />
              </div>

              {formData.productId && formData.quantity > 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-3 sm:pt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Total Cost</span>
                      <span className="font-semibold">
                        {formatCurrency(formData.costPrice * formData.quantity)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Stock will increase by {formData.quantity} units
                    </p>
                  </CardContent>
                </Card>
              )}

              <Button type="submit" className="w-full">
                <PackagePlus className="mr-2 h-4 w-4" />
                Record Purchase
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Purchases */}
        <Card>
          <CardHeader className="py-3 sm:py-4">
            <CardTitle className="text-base sm:text-lg">Recent Purchases</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {purchases.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground text-sm">No purchases recorded yet</p>
            ) : (
              <div className="space-y-3 sm:space-y-4 max-h-[500px] overflow-y-auto">
                {purchases.slice(-10).reverse().map(purchase => (
                  <div key={purchase.id} className="p-2 sm:p-3 rounded-lg border border-border">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{purchase.productName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          From: {purchase.supplierName}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">+{purchase.quantity}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(purchase.date).toLocaleDateString()}
                      </span>
                      {purchase.invoiceNo && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {purchase.invoiceNo}
                        </span>
                      )}
                      <span>{formatCurrency(purchase.costPrice * purchase.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  PackagePlus,
  Calendar,
  FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Navigate } from 'react-router-dom';

export default function PurchaseEntry() {
  const { products, purchases, addPurchase } = useData();
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    productId: '',
    supplierName: '',
    quantity: 0,
    costPrice: 0,
    invoiceNo: '',
    notes: '',
  });

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <PackagePlus className="h-6 w-6" />
          Purchase Entry
        </h1>
        <p className="text-muted-foreground">Record new stock purchases from suppliers</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New Purchase</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Product *</Label>
                <Select 
                  value={formData.productId} 
                  onValueChange={(v) => {
                    const product = products.find(p => p.id === v);
                    setFormData({ 
                      ...formData, 
                      productId: v,
                      costPrice: product?.purchasePrice || 0,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center justify-between gap-4">
                          <span>{product.name}</span>
                          <Badge variant="secondary" className="ml-2">{product.stock} in stock</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Supplier Name *</Label>
                <Input
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  placeholder="Enter supplier name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Cost Price (₹)</Label>
                  <Input
                    type="number"
                    value={formData.costPrice || ''}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label>Supplier Invoice No.</Label>
                <Input
                  value={formData.invoiceNo}
                  onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                  placeholder="e.g., INV-12345"
                />
              </div>

              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={3}
                />
              </div>

              {formData.productId && formData.quantity > 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Total Cost</span>
                      <span className="font-semibold price-display">
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
          <CardHeader>
            <CardTitle className="text-lg">Recent Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            {purchases.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No purchases recorded yet</p>
            ) : (
              <div className="space-y-4">
                {purchases.slice(-10).reverse().map(purchase => (
                  <div key={purchase.id} className="p-3 rounded-lg border border-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{purchase.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          From: {purchase.supplierName}
                        </p>
                      </div>
                      <Badge variant="secondary">+{purchase.quantity}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
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

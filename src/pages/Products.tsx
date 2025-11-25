import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Package,
  Edit,
  Trash2,
  X,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Navigate } from 'react-router-dom';

const CATEGORIES = ['Notebooks', 'Pens', 'Pencils', 'Paper', 'Geometry', 'Art Supplies', 'Files', 'Other'];
const UNITS = ['piece', 'box', 'pack'] as const;

const emptyProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  sku: '',
  purchasePrice: 0,
  sellingPrice: 0,
  wholesalePrice: 0,
  category: 'Other',
  gstPercent: 18,
  unit: 'piece' as const,
  stock: 0,
  lowStockThreshold: 10,
};

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct } = useData();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>(emptyProduct);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData(emptyProduct);
    setShowDialog(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      wholesalePrice: product.wholesalePrice,
      category: product.category,
      gstPercent: product.gstPercent,
      unit: product.unit,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.sku) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
      toast({ title: 'Product updated', description: `${formData.name} has been updated.` });
    } else {
      addProduct(formData);
      toast({ title: 'Product added', description: `${formData.name} has been added to inventory.` });
    }
    setShowDialog(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      const product = products.find(p => p.id === deleteId);
      deleteProduct(deleteId);
      toast({ title: 'Product deleted', description: `${product?.name} has been removed.` });
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6" />
            Products
          </h1>
          <p className="text-muted-foreground">Manage your inventory items</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{filteredProducts.length} Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Product</th>
                  <th className="pb-3 font-medium text-muted-foreground">SKU</th>
                  <th className="pb-3 font-medium text-muted-foreground">Category</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Purchase</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Retail</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Wholesale</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Stock</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id} className="invoice-row">
                    <td className="py-3">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.unit} • {product.gstPercent}% GST</p>
                    </td>
                    <td className="py-3 text-sm">{product.sku}</td>
                    <td className="py-3">
                      <Badge variant="secondary">{product.category}</Badge>
                    </td>
                    <td className="py-3 text-right price-display">{formatCurrency(product.purchasePrice)}</td>
                    <td className="py-3 text-right price-display">{formatCurrency(product.sellingPrice)}</td>
                    <td className="py-3 text-right price-display">{formatCurrency(product.wholesalePrice)}</td>
                    <td className="py-3 text-right">
                      <Badge 
                        variant={product.stock <= product.lowStockThreshold ? 'destructive' : 'secondary'}
                      >
                        {product.stock}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">No products found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Product Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <Label>SKU *</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g., NB-001"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Purchase Price (₹)</Label>
                <Input
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Selling Price (₹)</Label>
                <Input
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Wholesale Price (₹)</Label>
                <Input
                  type="number"
                  value={formData.wholesalePrice}
                  onChange={(e) => setFormData({ ...formData, wholesalePrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>GST %</Label>
                <Input
                  type="number"
                  value={formData.gstPercent}
                  onChange={(e) => setFormData({ ...formData, gstPercent: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={formData.unit} onValueChange={(v: 'piece' | 'box' | 'pack') => setFormData({ ...formData, unit: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Opening Stock</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Low Stock Alert</Label>
                <Input
                  type="number"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave}>
              {editingProduct ? 'Update' : 'Add'} Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>(emptyProduct);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Autocomplete suggestions
  const searchSuggestions = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 1) return [];
    const q = debouncedQuery.toLowerCase();
    return products
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [products, debouncedQuery]);

  useEffect(() => {
    setShowDropdown(searchSuggestions.length > 0 && searchQuery.length > 0);
    setHighlightedIndex(0);
  }, [searchSuggestions, searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted into view
  useEffect(() => {
    if (dropdownRef.current && showDropdown) {
      const highlighted = dropdownRef.current.children[highlightedIndex] as HTMLElement;
      if (highlighted) highlighted.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, showDropdown]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => prev < searchSuggestions.length - 1 ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (searchSuggestions[highlightedIndex]) {
          handleEdit(searchSuggestions[highlightedIndex]);
          setShowDropdown(false);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

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

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-5 w-5 sm:h-6 sm:w-6" />
            Products
          </h1>
          <p className="text-sm text-muted-foreground">Manage your inventory</p>
        </div>
        <Button onClick={handleAdd} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Filters with Autocomplete */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => {
                    if (searchSuggestions.length > 0 && searchQuery.length > 0) {
                      setShowDropdown(true);
                    }
                  }}
                  className="pl-9 pr-9"
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setShowDropdown(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {showDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95"
                >
                  <div className="max-h-72 overflow-y-auto">
                    {searchSuggestions.map((product, index) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          handleEdit(product);
                          setShowDropdown(false);
                        }}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={cn(
                          "w-full px-4 py-3 text-left flex items-center gap-3 transition-colors",
                          highlightedIndex === index
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sku} • {product.category}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="font-bold text-sm text-primary">
                            {formatCurrency(product.sellingPrice)}
                          </span>
                          <Badge 
                            variant={product.stock <= product.lowStockThreshold ? 'destructive' : 'secondary'} 
                            className="text-[10px] h-5"
                          >
                            {product.stock} in stock
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-border bg-muted/50 text-xs text-muted-foreground flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] border">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] border">↓</kbd>
                    <span>navigate</span>
                    <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] border ml-2">Enter</kbd>
                    <span>edit</span>
                    <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] border ml-2">Esc</kbd>
                    <span>close</span>
                  </div>
                </div>
              )}
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
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

      {/* Products - Mobile Cards / Desktop Table */}
      <Card>
        <CardHeader className="py-3 sm:py-4">
          <CardTitle className="text-sm sm:text-base">{filteredProducts.length} Products</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile View - Cards */}
          <div className="space-y-3 sm:hidden">
            {filteredProducts.map(product => (
              <div key={product.id} className="p-3 rounded-lg border bg-card">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                  </div>
                  <Badge 
                    variant={product.stock <= product.lowStockThreshold ? 'destructive' : 'secondary'}
                    className="text-xs shrink-0"
                  >
                    {product.stock} in stock
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex gap-3">
                    <span className="text-muted-foreground">Retail: <span className="text-foreground font-medium">{formatCurrency(product.sellingPrice)}</span></span>
                    <span className="text-muted-foreground">Wholesale: <span className="text-foreground font-medium">{formatCurrency(product.wholesalePrice)}</span></span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(product)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(product.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground text-sm">Product</th>
                  <th className="pb-3 font-medium text-muted-foreground text-sm">SKU</th>
                  <th className="pb-3 font-medium text-muted-foreground text-sm">Category</th>
                  <th className="pb-3 font-medium text-muted-foreground text-sm text-right">Retail</th>
                  <th className="pb-3 font-medium text-muted-foreground text-sm text-right">Wholesale</th>
                  <th className="pb-3 font-medium text-muted-foreground text-sm text-right">Stock</th>
                  <th className="pb-3 font-medium text-muted-foreground text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-3">
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.unit} • {product.gstPercent}% GST</p>
                    </td>
                    <td className="py-3 text-sm">{product.sku}</td>
                    <td className="py-3">
                      <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                    </td>
                    <td className="py-3 text-right text-sm">{formatCurrency(product.sellingPrice)}</td>
                    <td className="py-3 text-right text-sm">{formatCurrency(product.wholesalePrice)}</td>
                    <td className="py-3 text-right">
                      <Badge 
                        variant={product.stock <= product.lowStockThreshold ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {product.stock}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
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
          </div>
          {filteredProducts.length === 0 && (
            <p className="text-center py-6 text-muted-foreground text-sm">No products found</p>
          )}
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

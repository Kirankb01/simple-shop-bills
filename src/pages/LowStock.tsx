import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle,
  Package,
  ArrowRight,
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

export default function LowStock() {
  const { getLowStockProducts } = useData();
  const { isAdmin } = useAuth();
  const lowStockProducts = getLowStockProducts();

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

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
            Low Stock
          </h1>
          <p className="text-sm text-muted-foreground">Products that need restocking</p>
        </div>
        <Link to="/purchase" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            Add Purchase
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <Card className="border-warning/30">
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-warning/10 p-3">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{lowStockProducts.length}</p>
              <p className="text-muted-foreground">items below threshold</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Items */}
      {lowStockProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-lg font-medium mb-2">All Stocked Up!</h3>
              <p className="text-muted-foreground">All your products are above their minimum stock levels.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {lowStockProducts.map(product => (
            <Card key={product.id} className="border-warning/30">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{product.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{product.sku}</p>
                  </div>
                  <Badge variant="destructive">{product.stock} left</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span>{product.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unit</span>
                    <span className="capitalize">{product.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchase Price</span>
                    <span className="price-display">{formatCurrency(product.purchasePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Alert Threshold</span>
                    <span>{product.lowStockThreshold} units</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full bg-warning rounded-full"
                        style={{ width: `${Math.min(100, (product.stock / product.lowStockThreshold) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round((product.stock / product.lowStockThreshold) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

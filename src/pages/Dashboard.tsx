import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  IndianRupee, 
  TrendingUp, 
  Package, 
  AlertTriangle,
  ShoppingCart,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { products, getTodaySales, getMonthSales, getLowStockProducts, getTopSellingProducts } = useData();
  const { user } = useAuth();

  const todaySales = getTodaySales();
  const monthSales = getMonthSales();
  const lowStockProducts = getLowStockProducts();
  const topProducts = getTopSellingProducts(5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name}
          </h1>
          <p className="text-muted-foreground">Here's what's happening with your store today.</p>
        </div>
        <Link to="/billing">
          <Button size="lg" className="gap-2">
            <ShoppingCart className="h-5 w-5" />
            New Bill
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Sales</CardTitle>
            <div className="rounded-full bg-success/10 p-2">
              <IndianRupee className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="price-large text-foreground">{formatCurrency(todaySales)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-success">↑ 12%</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="price-large text-foreground">{formatCurrency(monthSales)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-success">↑ 8%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            <div className="rounded-full bg-accent/10 p-2">
              <Package className="h-4 w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="price-large text-foreground">{products.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active items in inventory</p>
          </CardContent>
        </Card>

        <Card className="stat-card border-warning/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
            <div className="rounded-full bg-warning/10 p-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="price-large text-warning">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Items need restocking</p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Selling Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Top Selling Products</CardTitle>
            <Link to="/products" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((item, index) => (
                <div key={item.product.id} className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">{item.product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium price-display">{formatCurrency(item.product.sellingPrice)}</p>
                    <p className="text-xs text-muted-foreground">{item.soldCount} sold</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className={lowStockProducts.length > 0 ? 'border-warning/30' : ''}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Low Stock Alerts
            </CardTitle>
            <Link to="/low-stock" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
                  <Package className="h-6 w-6 text-success" />
                </div>
                <p className="text-muted-foreground">All products are well stocked!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.sku}</p>
                    </div>
                    <Badge variant="outline" className="badge-low-stock">
                      {product.stock} left
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/billing">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Create Bill</span>
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <Package className="h-5 w-5" />
                <span>Manage Products</span>
              </Button>
            </Link>
            <Link to="/purchase">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <ArrowRight className="h-5 w-5" />
                <span>Add Purchase</span>
              </Button>
            </Link>
            <Link to="/sales">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <TrendingUp className="h-5 w-5" />
                <span>View Sales</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

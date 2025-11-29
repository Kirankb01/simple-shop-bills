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
  ArrowRight,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
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
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <Link to="/admin/billing">
          <Button size="default" className="gap-2 w-full sm:w-auto">
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
            New Bill
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Today</CardTitle>
            <div className="rounded-full bg-success/10 p-1.5 sm:p-2">
              <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold text-foreground">{formatCurrency(todaySales)}</div>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
              <span className="text-success">↑ 12%</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Month</CardTitle>
            <div className="rounded-full bg-primary/10 p-1.5 sm:p-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold text-foreground">{formatCurrency(monthSales)}</div>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
              <span className="text-success">↑ 8%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Products</CardTitle>
            <div className="rounded-full bg-accent/10 p-1.5 sm:p-2">
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold text-foreground">{products.length}</div>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Active in inventory</p>
          </CardContent>
        </Card>

        <Card className="stat-card border-warning/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
            <div className="rounded-full bg-warning/10 p-1.5 sm:p-2">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold text-warning">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Need restocking</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/admin/users">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <Users className="h-5 w-5" />
                <span>Manage Users</span>
              </Button>
            </Link>
            <Link to="/admin/products">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <Package className="h-5 w-5" />
                <span>Manage Products</span>
              </Button>
            </Link>
            <Link to="/admin/purchase">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <ArrowRight className="h-5 w-5" />
                <span>Add Purchase</span>
              </Button>
            </Link>
            <Link to="/admin/sales">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <TrendingUp className="h-5 w-5" />
                <span>View Sales</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Top Selling Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3 sm:py-4">
            <CardTitle className="text-base sm:text-lg">Top Selling</CardTitle>
            <Link to="/admin/products" className="text-xs sm:text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 sm:space-y-4">
              {topProducts.map((item, index) => (
                <div key={item.product.id} className="flex items-center gap-3 sm:gap-4">
                  <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-muted text-xs sm:text-sm font-medium shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-medium text-sm sm:text-base">{formatCurrency(item.product.sellingPrice)}</p>
                    <p className="text-xs text-muted-foreground">{item.soldCount} sold</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className={lowStockProducts.length > 0 ? 'border-warning/30' : ''}>
          <CardHeader className="flex flex-row items-center justify-between py-3 sm:py-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
              Low Stock
            </CardTitle>
            <Link to="/admin/low-stock" className="text-xs sm:text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
                </div>
                <p className="text-sm text-muted-foreground">All products well stocked!</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-warning/5 border border-warning/20 gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                    <Badge variant="outline" className="badge-low-stock shrink-0 text-xs">
                      {product.stock} left
                    </Badge>
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

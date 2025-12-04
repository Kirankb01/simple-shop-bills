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
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Mock chart data - in production this would come from your data context
const salesChartData = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 5000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 1890 },
  { name: 'Sat', sales: 6390 },
  { name: 'Sun', sales: 3490 },
];

const monthlyData = [
  { name: 'Jan', value: 45000 },
  { name: 'Feb', value: 52000 },
  { name: 'Mar', value: 48000 },
  { name: 'Apr', value: 61000 },
  { name: 'May', value: 55000 },
  { name: 'Jun', value: 67000 },
];

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            {getGreeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your store today.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/billing">
            <Button size="lg" className="gap-2 shadow-sm hover:shadow-lg hover:shadow-primary/25 transition-all">
              <ShoppingCart className="h-5 w-5" />
              New Bill
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
        {/* Today's Sales */}
        <Card className="stat-card-gradient">
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-white/20">
                <IndianRupee className="h-5 w-5" />
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-0 gap-1">
                <ArrowUpRight className="h-3 w-3" />
                12%
              </Badge>
            </div>
            <p className="text-white/80 text-sm font-medium">Today's Sales</p>
            <p className="text-2xl lg:text-3xl font-bold mt-1">{formatCurrency(todaySales)}</p>
          </CardContent>
        </Card>

        {/* Monthly Sales */}
        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <Badge variant="outline" className="badge-success gap-1">
                <ArrowUpRight className="h-3 w-3" />
                8%
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm font-medium">This Month</p>
            <p className="text-2xl lg:text-3xl font-bold text-foreground mt-1">{formatCurrency(monthSales)}</p>
          </CardContent>
        </Card>

        {/* Total Products */}
        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-muted-foreground text-sm font-medium">Total Products</p>
            <p className="text-2xl lg:text-3xl font-bold text-foreground mt-1">{products.length}</p>
            <p className="text-xs text-muted-foreground mt-2">Active in inventory</p>
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card className={`stat-card ${lowStockProducts.length > 0 ? 'border-warning/50' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              {lowStockProducts.length > 0 && (
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-warning opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-warning"></span>
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm font-medium">Low Stock Items</p>
            <p className="text-2xl lg:text-3xl font-bold text-warning mt-1">{lowStockProducts.length}</p>
            <p className="text-xs text-muted-foreground mt-2">Need restocking</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Sales Chart */}
        <Link to="/admin/sales" className="lg:col-span-2 group">
          <Card className="h-full cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">Sales Overview</CardTitle>
                <p className="text-sm text-muted-foreground">Daily sales for this week</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2 group-hover:border-primary/50 group-hover:bg-primary/5">
                <BarChart3 className="h-4 w-4" />
                View Report
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesChartData}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Sales']}
                    />
                    <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#salesGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Monthly Comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Monthly Trend</CardTitle>
            <p className="text-sm text-muted-foreground">Last 6 months</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Sales']}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Lists */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/admin/billing">
              <Button variant="outline" className="w-full justify-between h-12 hover:border-primary/50 hover:bg-primary/5">
                <span className="flex items-center gap-3">
                  <Receipt className="h-4 w-4 text-primary" />
                  Create New Bill
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/admin/products">
              <Button variant="outline" className="w-full justify-between h-12 hover:border-primary/50 hover:bg-primary/5">
                <span className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-primary" />
                  Add Product
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/admin/purchase">
              <Button variant="outline" className="w-full justify-between h-12 hover:border-primary/50 hover:bg-primary/5">
                <span className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Record Purchase
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/admin/users">
              <Button variant="outline" className="w-full justify-between h-12 hover:border-primary/50 hover:bg-primary/5">
                <span className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-primary" />
                  Manage Users
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Top Selling</CardTitle>
            <Link to="/admin/products" className="text-sm text-primary hover:underline font-medium">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">No sales data yet</p>
              ) : (
                topProducts.map((item, index) => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-semibold shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{item.soldCount} sold</p>
                    </div>
                    <p className="font-semibold text-sm">{formatCurrency(item.product.sellingPrice)}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className={lowStockProducts.length > 0 ? 'border-warning/30' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Low Stock Alerts
            </CardTitle>
            <Link to="/admin/low-stock" className="text-sm text-primary hover:underline font-medium">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
                  <Package className="h-6 w-6 text-success" />
                </div>
                <p className="font-medium text-foreground">All Stocked Up!</p>
                <p className="text-sm text-muted-foreground">No items below threshold</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                    <Badge variant="outline" className="badge-low-stock ml-2">
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

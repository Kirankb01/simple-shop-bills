import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Receipt,
  Calendar,
  Search,
  Eye,
  Printer,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { CartItem } from '@/types';

export default function SalesHistory() {
  const { invoices } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(inv => 
        !searchQuery ||
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices, searchQuery]);

  const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <Receipt className="h-5 w-5 sm:h-6 sm:w-6" />
          Sales History
        </h1>
        <p className="text-sm text-muted-foreground">View past invoices</p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-3">
        <Card className="stat-card">
          <CardContent className="pt-3 sm:pt-4">
            <p className="text-xs sm:text-sm text-muted-foreground">Invoices</p>
            <p className="text-lg sm:text-2xl font-bold">{filteredInvoices.length}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="pt-3 sm:pt-4">
            <p className="text-xs sm:text-sm text-muted-foreground">Total Sales</p>
            <p className="text-lg sm:text-2xl font-bold">{formatCurrency(totalSales)}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="pt-3 sm:pt-4">
            <p className="text-xs sm:text-sm text-muted-foreground">Avg. Order</p>
            <p className="text-lg sm:text-2xl font-bold">
              {formatCurrency(filteredInvoices.length ? totalSales / filteredInvoices.length : 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader className="py-3 sm:py-4">
          <CardTitle className="text-sm sm:text-base">Invoices</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {filteredInvoices.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground text-sm">No invoices found</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {filteredInvoices.map(invoice => (
                <div 
                  key={invoice.id} 
                  className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base">{invoice.invoiceNumber}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{invoice.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <div className="text-right">
                      <p className="font-semibold text-sm sm:text-base">{formatCurrency(invoice.grandTotal)}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 hidden sm:block" />
                        <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Badge variant={invoice.type === 'wholesale' ? 'default' : 'secondary'} className="hidden sm:inline-flex text-xs">
                      {invoice.type}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
              {selectedInvoice?.invoiceNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-3 sm:space-y-4">
              <div className="text-center border-b pb-3 sm:pb-4">
                <h2 className="text-lg sm:text-xl font-bold">SmartBill Store</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Your Stationery Partner</p>
              </div>
              <div className="text-xs sm:text-sm space-y-1">
                <p><span className="text-muted-foreground">Customer:</span> {selectedInvoice.customerName}</p>
                <p><span className="text-muted-foreground">Date:</span> {new Date(selectedInvoice.createdAt).toLocaleString()}</p>
                <p><span className="text-muted-foreground">Type:</span> {selectedInvoice.type}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                {selectedInvoice.items.map((item: CartItem, i: number) => (
                  <div key={i} className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="truncate flex-1">{item.product.name} × {item.quantity}</span>
                    <span className="shrink-0">{formatCurrency(
                      (selectedInvoice.type === 'wholesale' ? item.product.wholesalePrice : item.product.sellingPrice) * item.quantity
                    )}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.totalDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedInvoice.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base sm:text-lg pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(selectedInvoice.grandTotal)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setSelectedInvoice(null)} className="w-full sm:w-auto">
              Close
            </Button>
            <Button onClick={() => window.print()} className="w-full sm:w-auto">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
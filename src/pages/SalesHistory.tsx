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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Receipt className="h-6 w-6" />
          Sales History
        </h1>
        <p className="text-muted-foreground">View and manage past invoices</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="stat-card">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Invoices</p>
            <p className="text-2xl font-bold">{filteredInvoices.length}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Sales</p>
            <p className="text-2xl font-bold price-display">{formatCurrency(totalSales)}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Average Order Value</p>
            <p className="text-2xl font-bold price-display">
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
              placeholder="Search by invoice number or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No invoices found</p>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map(invoice => (
                <div 
                  key={invoice.id} 
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">{invoice.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold price-display">{formatCurrency(invoice.grandTotal)}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant={invoice.type === 'wholesale' ? 'default' : 'secondary'}>
                      {invoice.type}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon"
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {selectedInvoice?.invoiceNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold">SmartBill Store</h2>
                <p className="text-sm text-muted-foreground">Your Stationery Partner</p>
              </div>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Customer:</span> {selectedInvoice.customerName}</p>
                <p><span className="text-muted-foreground">Date:</span> {new Date(selectedInvoice.createdAt).toLocaleString()}</p>
                <p><span className="text-muted-foreground">Type:</span> {selectedInvoice.type}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                {selectedInvoice.items.map((item: CartItem, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.product.name} × {item.quantity}</span>
                    <span>{formatCurrency(
                      (selectedInvoice.type === 'wholesale' ? item.product.wholesalePrice : item.product.sellingPrice) * item.quantity
                    )}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST</span>
                  <span>{formatCurrency(selectedInvoice.totalGst)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(selectedInvoice.grandTotal)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedInvoice(null)}>Close</Button>
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

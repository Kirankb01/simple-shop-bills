import { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, TrendingUp, Package, X, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'low-stock' | 'sale' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  adminOnly?: boolean;
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { getLowStockProducts, invoices } = useData();
  const { isAdmin } = useAuth();

  const lowStockProducts = getLowStockProducts();
  const recentInvoices = invoices.slice(0, 3);

  // Generate notifications based on real data
  const notifications: Notification[] = [
    ...lowStockProducts.slice(0, 3).map((product) => ({
      id: `low-stock-${product.id}`,
      type: 'low-stock' as const,
      title: 'Low Stock Alert',
      message: `${product.name} has only ${product.stock} units left`,
      time: 'Just now',
      read: false,
      adminOnly: false,
    })),
    ...recentInvoices.map((invoice) => ({
      id: `sale-${invoice.id}`,
      type: 'sale' as const,
      title: 'New Sale',
      message: `Invoice #${invoice.invoiceNumber} - ₹${invoice.grandTotal.toLocaleString('en-IN')}`,
      time: new Date(invoice.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      read: true,
      adminOnly: false,
    })),
  ];

  // Filter notifications based on role
  const filteredNotifications = notifications.filter(
    (n) => !n.adminOnly || isAdmin
  );

  const unreadCount = filteredNotifications.filter((n) => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'low-stock':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'sale':
        return <ShoppingCart className="h-4 w-4 text-success" />;
      default:
        return <Package className="h-4 w-4 text-primary" />;
    }
  };

  const basePath = isAdmin ? '/admin' : '/staff';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 relative cursor-pointer hover:bg-accent transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive text-[9px] text-destructive-foreground font-bold items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </Button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border bg-card shadow-lg z-50",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Bell className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer",
                      !notification.read && "bg-primary/5"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-3">
            <div className="flex gap-2">
              {lowStockProducts.length > 0 && (
                <Link to={`${basePath}/low-stock`} className="flex-1" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    View Low Stock ({lowStockProducts.length})
                  </Button>
                </Link>
              )}
              <Link to={`${basePath}/sales`} className="flex-1" onClick={() => setIsOpen(false)}>
                <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                  <TrendingUp className="h-3 w-3" />
                  Sales History
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
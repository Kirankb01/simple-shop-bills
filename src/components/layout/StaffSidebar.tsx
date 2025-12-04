import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { NavLink } from '@/components/NavLink';
import { 
  LayoutDashboard, 
  ShoppingCart,
  TrendingUp,
  LogOut,
  Receipt,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StaffSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
  { name: 'Billing', href: '/staff/billing', icon: Receipt },
  { name: 'Sales History', href: '/staff/sales', icon: TrendingUp },
];

export function StaffSidebar({ isOpen, onClose }: StaffSidebarProps) {
  const { user, logout } = useAuth();

  const handleNavClick = () => {
    onClose();
  };

  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 transform bg-sidebar transition-transform duration-300 ease-in-out lg:translate-x-0",
        "flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary shadow-glow">
            <ShoppingCart className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold text-sidebar-foreground">SmartBill</span>
            <span className="block text-[10px] uppercase tracking-wider text-sidebar-foreground/50 font-medium">Staff Panel</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/50">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary/20 ring-2 ring-sidebar-primary/30">
            <span className="text-sm font-bold text-sidebar-primary">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/50 capitalize flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              {user?.role}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
        <p className="px-3 mb-2 text-[10px] uppercase tracking-wider text-sidebar-foreground/40 font-semibold">
          Menu
        </p>
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={handleNavClick}
            className="sidebar-nav-item"
            activeClassName="active"
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-11 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </Button>
      </div>
    </aside>
  );
}
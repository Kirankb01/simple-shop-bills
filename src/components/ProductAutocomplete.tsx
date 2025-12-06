import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Product } from '@/types';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductAutocompleteProps {
  products: Product[];
  onSelect: (product: Product) => void;
  placeholder?: string;
  billType?: 'retail' | 'wholesale';
  className?: string;
  autoFocus?: boolean;
}

export function ProductAutocomplete({
  products,
  onSelect,
  placeholder = "Search products by name, SKU, or category...",
  billType = 'retail',
  className,
  autoFocus = false,
}: ProductAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced search results
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const filteredProducts = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 1) return [];
    const q = debouncedQuery.toLowerCase();
    return products
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [products, debouncedQuery]);

  useEffect(() => {
    setIsOpen(filteredProducts.length > 0 && query.length > 0);
    setHighlightedIndex(0);
  }, [filteredProducts, query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const highlighted = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlighted) {
        highlighted.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = useCallback((product: Product) => {
    onSelect(product);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  }, [onSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredProducts.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredProducts[highlightedIndex]) {
          handleSelect(filteredProducts[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPrice = (product: Product) => {
    return billType === 'wholesale' ? product.wholesalePrice : product.sellingPrice;
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (filteredProducts.length > 0 && query.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="pl-12 pr-10 h-12 text-base"
          autoFocus={autoFocus}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95"
        >
          <div className="max-h-80 overflow-y-auto">
            {filteredProducts.map((product, index) => (
              <button
                key={product.id}
                type="button"
                onClick={() => handleSelect(product)}
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
                  <p className="text-xs text-muted-foreground">{product.sku}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="font-bold text-sm text-primary">
                    {formatCurrency(getPrice(product))}
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
            <span>select</span>
            <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] border ml-2">Esc</kbd>
            <span>close</span>
          </div>
        </div>
      )}
    </div>
  );
}
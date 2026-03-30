import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { products } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import CategoryFilter from '@/components/CategoryFilter';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

const Catalog = () => {
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get('cat') || 'todos';
  const [category, setCategory] = useState(initialCat);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchCat = category === 'todos' || p.category === category;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [category, search]);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />

      <div className="max-w-6xl mx-auto">
        {/* Search */}
        <div className="px-4 mt-4 animate-fade-in">
          <div className="flex items-center gap-3 bg-card rounded-2xl px-4 py-3.5 border border-border/60 shadow-card focus-within:shadow-elevated focus-within:border-primary/30 transition-all duration-300 md:max-w-md">
            <Search size={18} className="text-primary flex-shrink-0" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full font-medium"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mt-5">
          <CategoryFilter selected={category} onSelect={setCategory} />
        </div>

        {/* Results */}
        <div className="px-4 mt-5">
          <p className="text-xs text-muted-foreground mb-4 font-medium uppercase tracking-wider">
            {filtered.length} produto(s) encontrado(s)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16 animate-fade-in">
              <p className="text-4xl mb-3">😕</p>
              <p className="text-muted-foreground font-medium">Nenhum produto encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">Tente buscar por outro termo</p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Catalog;

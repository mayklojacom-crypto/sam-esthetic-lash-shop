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
    <div className="min-h-screen bg-background pb-20">
      <Header />

      {/* Search */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-3 bg-secondary rounded-xl px-4 py-3">
          <Search size={18} className="text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="mt-4">
        <CategoryFilter selected={category} onSelect={setCategory} />
      </div>

      {/* Results */}
      <div className="px-4 mt-4">
        <p className="text-sm text-muted-foreground mb-3">{filtered.length} produto(s)</p>
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum produto encontrado 😕</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Catalog;

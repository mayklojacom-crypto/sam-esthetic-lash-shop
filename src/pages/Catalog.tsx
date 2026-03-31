import { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { products, categories } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import CategoryFilter from '@/components/CategoryFilter';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

const categoryMeta: Record<string, { title: string; description: string }> = {
  cilios: { title: 'Cílios Profissionais', description: 'Cílios volume russo, YY, clássico e mais para lash designers.' },
  colas: { title: 'Colas para Extensão', description: 'Colas profissionais de alta fixação para extensão de cílios.' },
  liquidos: { title: 'Líquidos e Primers', description: 'Primers, removedores e líquidos essenciais para lash design.' },
  ferramentas: { title: 'Ferramentas', description: 'Ferramentas profissionais para extensão de cílios e design.' },
  descartaveis: { title: 'Descartáveis', description: 'Microbrush, eye pads, fitas e descartáveis para procedimentos.' },
  pincas: { title: 'Pinças Profissionais', description: 'Pinças de precisão para extensão de cílios volume e clássico.' },
  sobrancelhas: { title: 'Sobrancelhas', description: 'Produtos para design de sobrancelhas e henna profissional.' },
  'lash-lift': { title: 'Lash Lift', description: 'Kits e produtos para lash lift e lash lamination.' },
  treino: { title: 'Material de Treino', description: 'Materiais para treino e prática de extensão de cílios.' },
};

const Catalog = () => {
  const { categoria } = useParams();
  const [searchParams] = useSearchParams();
  const initialCat = categoria || searchParams.get('cat') || 'todos';
  const [category, setCategory] = useState(initialCat);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (categoria) {
      const valid = categories.find(c => c.id === categoria);
      if (valid) setCategory(categoria);
    }
  }, [categoria]);

  // SEO meta
  useEffect(() => {
    const meta = category !== 'todos' ? categoryMeta[category] : null;
    const title = meta ? `${meta.title} | Sam Esthetic Lash` : 'Catálogo | Sam Esthetic Lash';
    const desc = meta ? meta.description : 'Catálogo completo de produtos profissionais para extensão de cílios e lash design.';
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
  }, [category]);

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
        {/* Category heading */}
        {category !== 'todos' && categoryMeta[category] && (
          <div className="px-4 mt-4">
            <h1 className="text-xl font-extrabold text-foreground">{categoryMeta[category].title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{categoryMeta[category].description}</p>
          </div>
        )}

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
          <CategoryFilter selected={category} onSelect={setCategory} linkMode />
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

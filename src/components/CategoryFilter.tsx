import { useNavigate } from 'react-router-dom';
import { categories } from '@/data/products';

interface Props {
  selected: string;
  onSelect: (id: string) => void;
  linkMode?: boolean;
}

const CategoryFilter = ({ selected, onSelect, linkMode }: Props) => {
  const navigate = useNavigate();

  const handleClick = (id: string) => {
    onSelect(id);
    if (linkMode) {
      navigate(id === 'todos' ? '/catalogo' : `/catalogo/${id}`, { replace: true });
    }
  };

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide px-4 md:flex-wrap">
      {categories.map((cat, i) => (
        <button
          key={cat.id}
          onClick={() => handleClick(cat.id)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 opacity-0 animate-fade-in ${
            selected === cat.id
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-card text-secondary-foreground border border-border/60 shadow-card hover:shadow-elevated hover:border-primary/30'
          }`}
          style={{ animationDelay: `${i * 0.06}s` }}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;

import { categories } from '@/data/products';

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

const CategoryFilter = ({ selected, onSelect }: Props) => {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide px-4">
      {categories.map((cat, i) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 opacity-0 animate-fade-in ${
            selected === cat.id
              ? 'gradient-primary text-primary-foreground shadow-glow'
              : 'bg-card text-secondary-foreground border border-border/60 shadow-card hover:shadow-elevated'
          }`}
          style={{ animationDelay: `${i * 0.06}s` }}
        >
          <span className="text-base">{cat.icon}</span>
          {cat.label}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;

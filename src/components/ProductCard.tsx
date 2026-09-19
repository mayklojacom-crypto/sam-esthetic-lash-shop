import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface Props {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: Props) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const outOfStock = (product.stock ?? 999) <= 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (outOfStock) {
      toast.error('Produto esgotado no momento 💔', { duration: 1500 });
      return;
    }
    if (product.sizes && product.sizes.length > 0) {
      // produtos com tamanho exigem ir à página
      navigate(`/produto/${product.slug}`);
      return;
    }
    for (let i = 0; i < qty; i += 1) addItem(product);
    toast.success(`${qty}x adicionado ao carrinho! 🛍️`, { duration: 1500 });
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div
      onClick={() => navigate(`/produto/${product.slug}`)}
      className="group bg-card rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-card transition-all duration-300 cursor-pointer opacity-0 animate-fade-in-up flex flex-col"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="relative aspect-square bg-card overflow-hidden p-2">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
        {discount && !outOfStock && (
          <span className="absolute top-2 left-2 bg-accent text-accent-foreground text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
            -{discount}%
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-foreground/35 flex items-center justify-center">
            <span className="bg-card/95 text-foreground text-[11px] font-extrabold px-3 py-1.5 rounded-lg uppercase shadow">
              Esgotado
            </span>
          </div>
        )}
      </div>
      <div className="px-2.5 pb-2.5 pt-1 flex flex-col flex-1 text-center">
        <h3 className="text-[12px] sm:text-[13px] font-medium text-foreground line-clamp-2 leading-snug min-h-[2.5rem]">
          {product.name}
        </h3>
        <div className="mt-1.5 min-h-[4.6rem]">
          <div className="flex items-baseline justify-center gap-1 text-accent">
            <span className="text-xl font-extrabold">R$ {product.price.toFixed(2).replace('.', ',')}</span>
            <span className="text-[10px]">no pix</span>
          </div>
          {discount && product.originalPrice ? (
            <p className="text-[10px] text-muted-foreground">
              <span className="line-through">R$ {product.originalPrice.toFixed(2).replace('.', ',')}</span> · {discount}% de desconto
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground">pagamento rápido e seguro</p>
          )}
          <p className="mt-1 text-[10px] text-foreground">
            até <strong>3x de R$ {(product.price / 3).toFixed(2).replace('.', ',')}</strong>
          </p>
        </div>
        <div className="mt-auto grid grid-cols-[68px_1fr] gap-1.5" onClick={event => event.stopPropagation()}>
          <div className="grid grid-cols-3 h-9 border border-border rounded-md overflow-hidden bg-background">
            <Button type="button" variant="ghost" size="icon" className="w-full h-full rounded-none p-0" aria-label="Diminuir quantidade" onClick={() => setQty(value => Math.max(1, value - 1))} disabled={outOfStock}>
              <Minus size={12} />
            </Button>
            <span className="flex items-center justify-center text-xs font-semibold border-x border-border">{qty}</span>
            <Button type="button" variant="ghost" size="icon" className="w-full h-full rounded-none p-0" aria-label="Aumentar quantidade" onClick={() => setQty(value => value + 1)} disabled={outOfStock}>
              <Plus size={12} />
            </Button>
          </div>
          <Button onClick={handleAdd} disabled={outOfStock} className="h-9 rounded-md bg-satin text-primary-foreground text-xs font-semibold hover:brightness-105">
            {outOfStock ? 'Esgotado' : product.sizes?.length ? 'Escolher' : 'Adicionar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

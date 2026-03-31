import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Pencil, Trash2, Upload, Package } from 'lucide-react';
import { categories } from '@/data/products';

interface DBProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  original_price?: number;
  image: string;
  category: string;
  description: string;
  featured: boolean;
  sizes: string[] | null;
  weight: number;
  active: boolean;
  sort_order: number;
}

const emptyProduct: Omit<DBProduct, 'id'> = {
  slug: '',
  name: '',
  price: 0,
  image: '/placeholder.svg',
  category: 'cilios',
  description: '',
  featured: false,
  sizes: null,
  weight: 50,
  active: true,
  sort_order: 0,
};

const AdminProducts = () => {
  const { token } = useAdminAuth();
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [editProduct, setEditProduct] = useState<Partial<DBProduct> | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ action: 'list' });
      if (categoryFilter !== 'todos') params.set('category', categoryFilter);
      if (search) params.set('search', search);

      const { data, error } = await supabase.functions.invoke(`admin-products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      setProducts(data || []);
    } catch {
      toast({ title: 'Erro ao carregar produtos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [token, search, categoryFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSave = async () => {
    if (!editProduct?.name || !editProduct?.slug) {
      toast({ title: 'Nome e slug são obrigatórios', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const action = editProduct.id ? 'update' : 'create';
      const { error } = await supabase.functions.invoke(`admin-products?action=${action}`, {
        headers: { Authorization: `Bearer ${token}` },
        body: editProduct,
      });
      if (error) throw error;
      toast({ title: editProduct.id ? 'Produto atualizado!' : 'Produto criado!' });
      setEditProduct(null);
      fetchProducts();
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Desativar este produto?')) return;
    try {
      const { error } = await supabase.functions.invoke(`admin-products?action=delete&id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      toast({ title: 'Produto desativado' });
      fetchProducts();
    } catch {
      toast({ title: 'Erro ao desativar', variant: 'destructive' });
    }
  };

  const handleSeedFromStatic = async () => {
    if (!confirm('Importar todos os produtos do catálogo estático para o banco de dados? Produtos existentes (mesmo slug) serão atualizados.')) return;
    setSeeding(true);
    try {
      const { products: staticProducts } = await import('@/data/products');
      const mapped = staticProducts.map((p, i) => ({
        slug: p.slug,
        name: p.name,
        price: p.price,
        original_price: p.originalPrice || null,
        image: p.image,
        category: p.category,
        description: p.description,
        featured: p.featured || false,
        sizes: p.sizes || null,
        weight: p.weight || 50,
        active: true,
        sort_order: i,
      }));

      const { data, error } = await supabase.functions.invoke('admin-products?action=seed', {
        headers: { Authorization: `Bearer ${token}` },
        body: { products: mapped },
      });
      if (error) throw error;
      toast({ title: `${data.imported} produtos importados!` });
      fetchProducts();
    } catch (err: any) {
      toast({ title: 'Erro na importação', description: err.message, variant: 'destructive' });
    } finally {
      setSeeding(false);
    }
  };

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const catOptions = categories.filter(c => c.id !== 'todos');

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Produtos</h1>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={handleSeedFromStatic} disabled={seeding}>
            <Upload size={16} className="mr-1" />
            {seeding ? 'Importando...' : 'Importar Catálogo'}
          </Button>
          <Button size="sm" onClick={() => setEditProduct({ ...emptyProduct })}>
            <Plus size={16} className="mr-1" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            {catOptions.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="text-slate-500 py-8 text-center">Carregando...</div>
      ) : products.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-12 text-center">
            <Package size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">Nenhum produto encontrado.</p>
            <p className="text-sm text-slate-400 mt-1">
              Clique em "Importar Catálogo" para importar os produtos do site.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {products.map(p => (
            <Card key={p.id} className="border-slate-200 overflow-hidden">
              <div className="aspect-square bg-slate-100 relative">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-contain p-2"
                  onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                />
                {p.featured && (
                  <Badge className="absolute top-2 left-2 bg-primary text-xs">Destaque</Badge>
                )}
                {!p.active && (
                  <Badge variant="secondary" className="absolute top-2 right-2 text-xs">Inativo</Badge>
                )}
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium text-sm text-slate-900 line-clamp-2 mb-1">{p.name}</h3>
                <p className="text-xs text-slate-500 mb-2">{p.category}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">R$ {Number(p.price).toFixed(2)}</span>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setEditProduct({ ...p })}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editProduct} onOpenChange={open => !open && setEditProduct(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct?.id ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          {editProduct && (
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={editProduct.name || ''}
                  onChange={e => {
                    const name = e.target.value;
                    setEditProduct(prev => ({
                      ...prev,
                      name,
                      slug: prev?.id ? prev.slug : generateSlug(name),
                    }));
                  }}
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={editProduct.slug || ''}
                  onChange={e => setEditProduct(prev => ({ ...prev, slug: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Preço (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editProduct.price || 0}
                    onChange={e => setEditProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Preço Original (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editProduct.original_price || ''}
                    onChange={e => setEditProduct(prev => ({ ...prev, original_price: parseFloat(e.target.value) || undefined }))}
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select
                  value={editProduct.category || 'cilios'}
                  onValueChange={v => setEditProduct(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {catOptions.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>URL da Imagem</Label>
                <Input
                  value={editProduct.image || ''}
                  onChange={e => setEditProduct(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="/products/nome-produto.jpg"
                />
                {editProduct.image && editProduct.image !== '/placeholder.svg' && (
                  <img
                    src={editProduct.image}
                    alt="Preview"
                    className="mt-2 h-24 w-24 object-contain rounded border"
                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                )}
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={editProduct.description || ''}
                  onChange={e => setEditProduct(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Peso (g)</Label>
                  <Input
                    type="number"
                    value={editProduct.weight || 50}
                    onChange={e => setEditProduct(prev => ({ ...prev, weight: parseInt(e.target.value) || 50 }))}
                  />
                </div>
                <div>
                  <Label>Ordem</Label>
                  <Input
                    type="number"
                    value={editProduct.sort_order || 0}
                    onChange={e => setEditProduct(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div>
                <Label>Tamanhos (separados por vírgula)</Label>
                <Input
                  value={editProduct.sizes?.join(', ') || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setEditProduct(prev => ({
                      ...prev,
                      sizes: val ? val.split(',').map(s => s.trim()).filter(Boolean) : null,
                    }));
                  }}
                  placeholder="8mm, 9mm, 10mm..."
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={editProduct.featured || false}
                  onCheckedChange={v => setEditProduct(prev => ({ ...prev, featured: v }))}
                />
                <Label>Produto em Destaque</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={editProduct.active !== false}
                  onCheckedChange={v => setEditProduct(prev => ({ ...prev, active: v }))}
                />
                <Label>Ativo</Label>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;

import { useEffect, useState, useCallback, useRef } from 'react';
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
import { Plus, Search, Pencil, Trash2, Upload, Package, ImagePlus, X, GripVertical } from 'lucide-react';
import { categories } from '@/data/products';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  _priceRaw?: string;
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

interface SortableRowProps {
  product: DBProduct;
  catLabel: (id: string) => string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: (active: boolean) => void;
}

const SortableProductRow = ({ product: p, catLabel, onEdit, onDelete, onToggleActive }: SortableRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.85 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col md:grid md:grid-cols-[32px_48px_1fr_120px_100px_140px_100px] gap-2 items-center px-3 py-2 rounded-lg border bg-white hover:bg-slate-50 transition-colors ${!p.active ? 'opacity-60 bg-slate-50' : ''} ${isDragging ? 'shadow-lg border-primary' : 'border-slate-100'}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-200 text-slate-400 self-start md:self-center"
        aria-label="Arrastar"
      >
        <GripVertical size={18} />
      </button>

      {/* Image */}
      <img
        src={p.image}
        alt={p.name}
        className="w-10 h-10 object-contain rounded border border-slate-200 bg-slate-50 flex-shrink-0"
        onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
      />

      {/* Name + mobile info */}
      <div className="flex-1 min-w-0 w-full">
        <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
        <div className="flex items-center gap-2 md:hidden mt-0.5">
          <span className="text-xs text-slate-500">{catLabel(p.category)}</span>
          <span className="text-xs font-semibold text-slate-800">R$ {Number(p.price).toFixed(2)}</span>
          {p.featured && <Badge className="bg-primary text-[10px] px-1 py-0 h-4">Destaque</Badge>}
        </div>
      </div>

      {/* Category - desktop */}
      <span className="hidden md:block text-xs text-slate-600 truncate">{catLabel(p.category)}</span>

      {/* Price - desktop */}
      <span className="hidden md:block text-sm font-semibold text-slate-900">R$ {Number(p.price).toFixed(2)}</span>

      {/* Active toggle (sempre visível) */}
      <div className="flex items-center gap-2 self-start md:self-center w-full md:w-auto">
        <Switch
          checked={p.active}
          onCheckedChange={onToggleActive}
        />
        <span className={`text-xs font-medium ${p.active ? 'text-emerald-600' : 'text-slate-400'}`}>
          {p.active ? 'Ativo' : 'Inativo'}
        </span>
        {p.featured && <Badge className="bg-primary text-[10px] px-1.5 py-0 h-5 hidden md:inline-flex ml-1">Destaque</Badge>}
      </div>

      {/* Actions */}
      <div className="flex gap-1 justify-end self-start md:self-center">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit}>
          <Pencil size={14} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-red-500 hover:text-red-700"
          onClick={onDelete}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  const handleToggleActive = async (product: DBProduct, active: boolean) => {
    // Optimistic
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, active } : p));
    try {
      const { error } = await supabase.functions.invoke(`admin-products?action=update`, {
        headers: { Authorization: `Bearer ${token}` },
        body: { id: product.id, active },
      });
      if (error) throw error;
      toast({ title: active ? 'Produto ativado' : 'Produto desativado' });
    } catch {
      // Revert
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, active: !active } : p));
      toast({ title: 'Erro ao alterar status', variant: 'destructive' });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = products.findIndex(p => p.id === active.id);
    const newIdx = products.findIndex(p => p.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;

    const reordered = arrayMove(products, oldIdx, newIdx);
    // Reassign sort_order sequentially
    const updates = reordered.map((p, i) => ({ ...p, sort_order: i }));
    setProducts(updates);

    try {
      await Promise.all(
        updates.map(p =>
          supabase.functions.invoke(`admin-products?action=update`, {
            headers: { Authorization: `Bearer ${token}` },
            body: { id: p.id, sort_order: p.sort_order },
          })
        )
      );
    } catch {
      toast({ title: 'Erro ao reordenar', variant: 'destructive' });
      fetchProducts();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const slug = editProduct?.slug || 'produto';
      const fileName = `${slug}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      setEditProduct(prev => ({ ...prev, image: urlData.publicUrl }));
      toast({ title: 'Imagem enviada!' });
    } catch (err: any) {
      toast({ title: 'Erro ao enviar imagem', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setEditProduct(prev => ({ ...prev, image: '/placeholder.svg' }));
  };

  const handleSeedFromStatic = async () => {
    if (!confirm('Importar todos os produtos do catálogo estático para o banco de dados?')) return;
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
  const catLabel = (id: string) => categories.find(c => c.id === id)?.label || id;

  return (
    <div className="p-3 md:p-6 lg:p-8 space-y-4">
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

      {/* Product List */}
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={products.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {/* Header - hidden on mobile */}
              <div className="hidden md:grid md:grid-cols-[32px_48px_1fr_120px_100px_140px_100px] gap-2 px-3 py-2 text-xs font-medium text-slate-500 uppercase">
                <span></span>
                <span>Foto</span>
                <span>Nome</span>
                <span>Categoria</span>
                <span>Preço</span>
                <span>Ativo</span>
                <span className="text-right">Ações</span>
              </div>

              {products.map((p) => (
                <SortableProductRow
                  key={p.id}
                  product={p}
                  catLabel={catLabel}
                  onEdit={() => setEditProduct({ ...p })}
                  onDelete={() => handleDelete(p.id)}
                  onToggleActive={(v) => handleToggleActive(p, v)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editProduct} onOpenChange={open => !open && setEditProduct(null)}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg">{editProduct?.id ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          {editProduct && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold text-slate-600">Nome</Label>
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
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600">Slug</Label>
                <Input
                  value={editProduct.slug || ''}
                  onChange={e => setEditProduct(prev => ({ ...prev, slug: e.target.value }))}
                  className="mt-1 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-600">Preço (R$)</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={editProduct.price === 0 && editProduct._priceRaw === '' ? '' : (editProduct._priceRaw ?? String(editProduct.price))}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                      const parsed = parseFloat(raw);
                      setEditProduct(prev => ({ ...prev, price: isNaN(parsed) ? 0 : parsed, _priceRaw: raw }));
                    }}
                    onBlur={() => setEditProduct(prev => ({ ...prev, _priceRaw: undefined }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600">Preço Original (R$)</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={editProduct.original_price || ''}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                      setEditProduct(prev => ({ ...prev, original_price: parseFloat(raw) || undefined }));
                    }}
                    placeholder="Opcional"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600">Categoria</Label>
                <Select
                  value={editProduct.category || 'cilios'}
                  onValueChange={v => setEditProduct(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {catOptions.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Image section */}
              <div>
                <Label className="text-xs font-semibold text-slate-600">Imagem do Produto</Label>
                <div className="mt-1 flex items-start gap-3">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex-shrink-0">
                    <img
                      src={editProduct.image || '/placeholder.svg'}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                    />
                    {editProduct.image && editProduct.image !== '/placeholder.svg' && (
                      <button
                        onClick={handleRemoveImage}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full"
                    >
                      <ImagePlus size={14} className="mr-1" />
                      {uploading ? 'Enviando...' : 'Enviar Imagem'}
                    </Button>
                    <Input
                      value={editProduct.image || ''}
                      onChange={e => setEditProduct(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="Ou cole a URL"
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <Label className="text-xs font-semibold text-slate-600">Descrição</Label>
                <Textarea
                  value={editProduct.description || ''}
                  onChange={e => setEditProduct(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="mt-1 text-sm"
                  placeholder="Descreva o produto..."
                />
              </div>

              {/* Tamanhos / Medidas - chip system */}
              <div>
                <Label className="text-xs font-semibold text-slate-600">Tamanhos / Medidas</Label>
                <p className="text-[11px] text-slate-400 mb-1.5">Ex: 8mm, 10mm, 0.07, Mix, 50ml</p>
                <div className="flex flex-wrap gap-1.5 mb-2 min-h-[32px] p-2 rounded-md border border-slate-200 bg-slate-50">
                  {(editProduct.sizes || []).map((size, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full"
                    >
                      {size}
                      <button
                        type="button"
                        onClick={() => {
                          setEditProduct(prev => ({
                            ...prev,
                            sizes: prev?.sizes?.filter((_, idx) => idx !== i) || null,
                          }));
                        }}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {(!editProduct.sizes || editProduct.sizes.length === 0) && (
                    <span className="text-xs text-slate-400 py-1">Nenhum tamanho adicionado</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="size-input"
                    placeholder="Digite e pressione Enter"
                    className="flex-1 text-sm"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const val = input.value.trim();
                        if (!val) return;
                        const newSizes = val.split(',').map(s => s.trim()).filter(Boolean);
                        setEditProduct(prev => ({
                          ...prev,
                          sizes: [...(prev?.sizes || []), ...newSizes],
                        }));
                        input.value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById('size-input') as HTMLInputElement;
                      const val = input?.value.trim();
                      if (!val) return;
                      const newSizes = val.split(',').map(s => s.trim()).filter(Boolean);
                      setEditProduct(prev => ({
                        ...prev,
                        sizes: [...(prev?.sizes || []), ...newSizes],
                      }));
                      if (input) input.value = '';
                    }}
                  >
                    <Plus size={14} />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-600">Peso (g)</Label>
                  <Input
                    type="number"
                    value={editProduct.weight || 50}
                    onChange={e => setEditProduct(prev => ({ ...prev, weight: parseInt(e.target.value) || 50 }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600">Ordem</Label>
                  <Input
                    type="number"
                    value={editProduct.sort_order || 0}
                    onChange={e => setEditProduct(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50">
                <Label className="text-sm">Produto em Destaque</Label>
                <Switch
                  checked={editProduct.featured || false}
                  onCheckedChange={v => setEditProduct(prev => ({ ...prev, featured: v }))}
                />
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50">
                <Label className="text-sm">Ativo</Label>
                <Switch
                  checked={editProduct.active !== false}
                  onCheckedChange={v => setEditProduct(prev => ({ ...prev, active: v }))}
                />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full mt-2">
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

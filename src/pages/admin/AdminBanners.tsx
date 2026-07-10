import { useEffect, useState, useCallback, useRef } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Upload, ImageIcon, ArrowUp, ArrowDown, X } from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link: string;
  alt: string;
  sort_order: number;
  active: boolean;
}

const empty: Omit<Banner, 'id'> = {
  title: '',
  image_url: '',
  link: '/catalogo',
  alt: '',
  sort_order: 0,
  active: true,
};

const AdminBanners = () => {
  const { token } = useAdminAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Partial<Banner> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchBanners = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-banners?action=list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      setBanners(data || []);
    } catch {
      toast({ title: 'Erro ao carregar banners', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const save = async () => {
    if (!edit?.image_url) {
      toast({ title: 'Imagem obrigatória', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const action = edit.id ? 'update' : 'create';
      const body = edit.id ? edit : { ...edit, sort_order: banners.length };
      const { error } = await supabase.functions.invoke(`admin-banners?action=${action}`, {
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (error) throw error;
      toast({ title: edit.id ? 'Banner atualizado!' : 'Banner criado!' });
      setEdit(null);
      fetchBanners();
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este banner?')) return;
    try {
      const { error } = await supabase.functions.invoke(`admin-banners?action=delete&id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      toast({ title: 'Banner excluído' });
      fetchBanners();
    } catch {
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
    }
  };

  const toggleActive = async (b: Banner, active: boolean) => {
    setBanners(prev => prev.map(x => x.id === b.id ? { ...x, active } : x));
    try {
      await supabase.functions.invoke('admin-banners?action=update', {
        headers: { Authorization: `Bearer ${token}` },
        body: { id: b.id, active },
      });
    } catch {
      setBanners(prev => prev.map(x => x.id === b.id ? { ...x, active: !active } : x));
      toast({ title: 'Erro ao alterar', variant: 'destructive' });
    }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= banners.length) return;
    const arr = [...banners];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    const updates = arr.map((b, i) => ({ ...b, sort_order: i }));
    setBanners(updates);
    try {
      await Promise.all(updates.map(b =>
        supabase.functions.invoke('admin-banners?action=update', {
          headers: { Authorization: `Bearer ${token}` },
          body: { id: b.id, sort_order: b.sort_order },
        })
      ));
    } catch {
      toast({ title: 'Erro ao reordenar', variant: 'destructive' });
      fetchBanners();
    }
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `banner-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
      setEdit(prev => ({ ...prev, image_url: data.publicUrl }));
      toast({ title: 'Imagem enviada!' });
    } catch (err: any) {
      toast({ title: 'Erro no upload', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="p-3 md:p-6 lg:p-8 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Banners do Site</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gerencie o carrossel da página inicial</p>
        </div>
        <Button size="sm" onClick={() => setEdit({ ...empty })}>
          <Plus size={16} className="mr-1" /> Novo Banner
        </Button>
      </div>

      {loading ? (
        <div className="text-slate-500 py-8 text-center">Carregando...</div>
      ) : banners.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-12 text-center">
            <ImageIcon size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">Nenhum banner cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {banners.map((b, i) => (
            <Card key={b.id} className={`border-slate-200 ${!b.active ? 'opacity-60' : ''}`}>
              <CardContent className="p-3 flex flex-col md:flex-row gap-3 items-start md:items-center">
                <img
                  src={b.image_url}
                  alt={b.alt}
                  className="w-full md:w-40 h-24 object-cover rounded-lg border border-slate-200 bg-slate-50"
                  onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                />
                <div className="flex-1 min-w-0 w-full">
                  <p className="text-sm font-semibold text-slate-900 truncate">{b.title || '(sem título)'}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">→ {b.link}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5 italic">{b.alt}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Switch checked={b.active} onCheckedChange={v => toggleActive(b, v)} />
                    <span className={`text-xs font-medium ${b.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {b.active ? 'Visível no site' : 'Oculto'}
                    </span>
                  </div>
                </div>
                <div className="flex md:flex-col gap-1 self-end md:self-center">
                  <Button size="icon" variant="ghost" className="h-8 w-8" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp size={14} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" disabled={i === banners.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDown size={14} />
                  </Button>
                </div>
                <div className="flex gap-1 self-end md:self-center">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEdit({ ...b })}>
                    <Pencil size={14} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => remove(b.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!edit} onOpenChange={o => !o && setEdit(null)}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{edit?.id ? 'Editar Banner' : 'Novo Banner'}</DialogTitle>
          </DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold text-slate-600">Imagem</Label>
                {edit.image_url ? (
                  <div className="mt-1 relative">
                    <img src={edit.image_url} alt="" className="w-full h-40 object-cover rounded-lg border border-slate-200" />
                    <button
                      onClick={() => setEdit(prev => ({ ...prev, image_url: '' }))}
                      className="absolute top-2 right-2 bg-white/90 rounded-full p-1 shadow"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="mt-1 w-full h-40 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-colors"
                  >
                    <Upload size={24} />
                    <span className="text-sm mt-2">{uploading ? 'Enviando...' : 'Clique para enviar imagem'}</span>
                    <span className="text-xs mt-1">Recomendado: 1200x600px</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={upload} />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-600">Título (interno)</Label>
                <Input
                  value={edit.title || ''}
                  onChange={e => setEdit(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Promoção de julho"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-600">Link de destino</Label>
                <Input
                  value={edit.link || ''}
                  onChange={e => setEdit(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="/catalogo"
                  className="mt-1"
                />
                <p className="text-[10px] text-slate-400 mt-1">Ex: /catalogo, /catalogo?cat=colas, /produto/slug</p>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-600">Texto alternativo (SEO)</Label>
                <Input
                  value={edit.alt || ''}
                  onChange={e => setEdit(prev => ({ ...prev, alt: e.target.value }))}
                  placeholder="Descreva a imagem"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Switch checked={!!edit.active} onCheckedChange={v => setEdit(prev => ({ ...prev, active: v }))} />
                <Label className="text-sm">Ativo no site</Label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button>
                <Button onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBanners;

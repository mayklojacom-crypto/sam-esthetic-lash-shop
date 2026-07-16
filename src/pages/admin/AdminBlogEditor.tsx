import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, X, Save } from 'lucide-react';
import RichEditor from '@/components/RichEditor';
import { useProducts } from '@/hooks/useProducts';

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80);

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string;
  content: string;
  status: string;
  published_at: string;
  meta_title: string;
  meta_description: string;
  related_product_ids: string[];
}

const empty: FormState = {
  title: '', slug: '', excerpt: '', cover_image: '', content: '',
  status: 'draft', published_at: '', meta_title: '', meta_description: '',
  related_product_ids: [],
};

const AdminBlogEditor = () => {
  const { id } = useParams();
  const isNew = id === 'novo';
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  const { products } = useProducts();
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const slugTouched = useRef(false);

  useEffect(() => {
    if (isNew) return;
    supabase.functions.invoke(`admin-blog-posts?action=get&id=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(({ data, error }) => {
      if (error || !data) { toast({ title: 'Erro ao carregar post', variant: 'destructive' }); navigate('/admin/blog'); return; }
      setForm({
        title: data.title || '',
        slug: data.slug || '',
        excerpt: data.excerpt || '',
        cover_image: data.cover_image || '',
        content: data.content || '',
        status: data.status || 'draft',
        published_at: data.published_at ? new Date(data.published_at).toISOString().slice(0, 16) : '',
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || '',
        related_product_ids: data.related_product_ids || [],
      });
      slugTouched.current = true;
      setLoading(false);
    });
  }, [id, isNew, token, navigate]);

  const setTitle = (title: string) => {
    setForm(f => ({ ...f, title, slug: slugTouched.current ? f.slug : slugify(title) }));
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const name = `blog-cover-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(name, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('product-images').getPublicUrl(name);
      setForm(f => ({ ...f, cover_image: data.publicUrl }));
    } catch (err: any) {
      toast({ title: 'Erro no upload', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const save = async (publishNow = false) => {
    if (!form.title.trim()) return toast({ title: 'Título obrigatório', variant: 'destructive' });
    if (!form.slug.trim()) return toast({ title: 'Slug obrigatório', variant: 'destructive' });

    setSaving(true);
    try {
      const payload: any = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt,
        cover_image: form.cover_image,
        content: form.content,
        meta_title: form.meta_title,
        meta_description: form.meta_description,
        related_product_ids: form.related_product_ids,
      };

      if (publishNow) {
        payload.status = 'published';
        payload.published_at = form.published_at ? new Date(form.published_at).toISOString() : new Date().toISOString();
      } else {
        payload.status = form.status;
        payload.published_at = form.published_at ? new Date(form.published_at).toISOString() : null;
      }

      const action = isNew ? 'create' : 'update';
      const body = isNew ? payload : { id, ...payload };
      const { error } = await supabase.functions.invoke(`admin-blog-posts?action=${action}`, {
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (error) throw error;
      toast({ title: isNew ? 'Post criado!' : 'Post atualizado!' });
      navigate('/admin/blog');
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleProduct = (pid: string) => {
    setForm(f => ({
      ...f,
      related_product_ids: f.related_product_ids.includes(pid)
        ? f.related_product_ids.filter(x => x !== pid)
        : [...f.related_product_ids, pid],
    }));
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando...</div>;

  return (
    <div className="p-3 md:p-6 lg:p-8 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/blog')}>
          <ArrowLeft size={16} className="mr-1" /> Voltar
        </Button>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">{isNew ? 'Novo Post' : 'Editar Post'}</h1>
      </div>

      <Card><CardContent className="p-4 space-y-4">
        <div>
          <Label>Título</Label>
          <Input value={form.title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Como cuidar da extensão de cílios em 5 passos" />
        </div>

        <div>
          <Label>Slug (URL)</Label>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-slate-400">/blog/</span>
            <Input
              value={form.slug}
              onChange={e => { slugTouched.current = true; setForm(f => ({ ...f, slug: slugify(e.target.value) })); }}
              placeholder="como-cuidar-da-extensao"
            />
          </div>
        </div>

        <div>
          <Label>Resumo (aparece na lista e SEO)</Label>
          <Textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} rows={2} maxLength={200} placeholder="Uma frase curta explicando o post..." />
        </div>

        <div>
          <Label>Imagem de capa</Label>
          {form.cover_image ? (
            <div className="mt-1 relative">
              <img src={form.cover_image} alt="" className="w-full h-48 object-cover rounded-lg border border-slate-200" />
              <button type="button" onClick={() => setForm(f => ({ ...f, cover_image: '' }))} className="absolute top-2 right-2 bg-white/90 rounded-full p-1 shadow">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="mt-1 w-full h-48 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition">
              <Upload size={24} />
              <span className="text-sm mt-2">{uploading ? 'Enviando...' : 'Clique para enviar capa'}</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={upload} />
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-2">
        <Label>Conteúdo</Label>
        <RichEditor value={form.content} onChange={content => setForm(f => ({ ...f, content }))} />
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-3">
        <Label className="text-sm font-semibold">Produtos indicados no post</Label>
        <p className="text-xs text-slate-500 -mt-1">Selecione os produtos que aparecerão como sugestão no final do post.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
          {products.map(p => {
            const selected = form.related_product_ids.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleProduct(p.id)}
                className={`text-left p-2 rounded-lg border transition ${selected ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex gap-2 items-center">
                  <img src={p.image} alt="" className="w-10 h-10 rounded object-cover bg-slate-100" />
                  <span className="text-xs font-medium text-slate-700 line-clamp-2">{p.name}</span>
                </div>
              </button>
            );
          })}
        </div>
        {form.related_product_ids.length > 0 && (
          <p className="text-xs text-primary font-medium">{form.related_product_ids.length} selecionado(s)</p>
        )}
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-3">
        <Label className="text-sm font-semibold">SEO</Label>
        <div>
          <Label className="text-xs text-slate-500">Meta título (opcional)</Label>
          <Input value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} maxLength={60} placeholder="Deixe vazio para usar o título do post" />
        </div>
        <div>
          <Label className="text-xs text-slate-500">Meta descrição (opcional)</Label>
          <Textarea value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} rows={2} maxLength={160} placeholder="Deixe vazio para usar o resumo" />
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-3">
        <Label className="text-sm font-semibold">Publicação</Label>
        <div>
          <Label className="text-xs text-slate-500">Status</Label>
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={() => setForm(f => ({ ...f, status: 'draft' }))}
              className={`px-3 py-1.5 rounded-lg text-sm border ${form.status === 'draft' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200'}`}>Rascunho</button>
            <button type="button" onClick={() => setForm(f => ({ ...f, status: 'published' }))}
              className={`px-3 py-1.5 rounded-lg text-sm border ${form.status === 'published' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200'}`}>Publicado</button>
          </div>
        </div>
        <div>
          <Label className="text-xs text-slate-500">Data de publicação (agendar para o futuro)</Label>
          <Input type="datetime-local" value={form.published_at} onChange={e => setForm(f => ({ ...f, published_at: e.target.value }))} />
          <p className="text-[11px] text-slate-400 mt-1">Se agendar uma data futura + status "Publicado", o post aparece automaticamente no dia.</p>
        </div>
      </CardContent></Card>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pb-8">
        <Button variant="outline" onClick={() => save(false)} disabled={saving}>
          <Save size={16} className="mr-1" /> Salvar
        </Button>
        <Button onClick={() => save(true)} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar e Publicar Agora'}
        </Button>
      </div>
    </div>
  );
};

export default AdminBlogEditor;

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, FileText, Eye, EyeOff, Clock } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
  status: string;
  published_at: string | null;
  cover_image: string;
  created_at: string;
}

const AdminBlogPosts = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-blog-posts?action=list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      setPosts(data || []);
    } catch {
      toast({ title: 'Erro ao carregar posts', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: string) => {
    if (!confirm('Excluir este post? Todos os comentários também serão removidos.')) return;
    try {
      const { error } = await supabase.functions.invoke(`admin-blog-posts?action=delete&id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      toast({ title: 'Post excluído' });
      load();
    } catch {
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
    }
  };

  const getStatus = (p: Post) => {
    if (p.status === 'draft') return { label: 'Rascunho', color: 'bg-slate-100 text-slate-600', icon: <EyeOff size={12} /> };
    if (!p.published_at || new Date(p.published_at) > new Date()) return { label: 'Agendado', color: 'bg-amber-100 text-amber-700', icon: <Clock size={12} /> };
    return { label: 'Publicado', color: 'bg-emerald-100 text-emerald-700', icon: <Eye size={12} /> };
  };

  return (
    <div className="p-3 md:p-6 lg:p-8 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Blog</h1>
          <p className="text-sm text-slate-500 mt-0.5">Posts, tutoriais e dicas</p>
        </div>
        <Button size="sm" onClick={() => navigate('/admin/blog/novo')}>
          <Plus size={16} className="mr-1" /> Novo Post
        </Button>
      </div>

      {loading ? (
        <div className="text-slate-500 py-8 text-center">Carregando...</div>
      ) : posts.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-12 text-center">
            <FileText size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">Nenhum post cadastrado.</p>
            <Button size="sm" className="mt-4" onClick={() => navigate('/admin/blog/novo')}>
              Criar primeiro post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {posts.map(p => {
            const s = getStatus(p);
            return (
              <Card key={p.id} className="border-slate-200">
                <CardContent className="p-3 flex gap-3 items-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                    {p.cover_image ? (
                      <img src={p.cover_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText size={24} className="text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{p.title}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">/{p.slug}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.color}`}>
                        {s.icon} {s.label}
                      </span>
                      {p.published_at && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(p.published_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => navigate(`/admin/blog/${p.id}`)}>
                      <Pencil size={14} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => remove(p.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminBlogPosts;

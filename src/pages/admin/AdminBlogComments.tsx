import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, Check, X, Trash2 } from 'lucide-react';

interface Comment {
  id: string;
  post_id: string;
  author_name: string;
  content: string;
  approved: boolean;
  created_at: string;
  blog_posts?: { title: string; slug: string } | null;
}

const AdminBlogComments = () => {
  const { token } = useAdminAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-blog-comments?action=list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      setComments(data || []);
    } catch {
      toast({ title: 'Erro ao carregar comentários', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const setApproved = async (id: string, approved: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('admin-blog-comments?action=approve', {
        headers: { Authorization: `Bearer ${token}` },
        body: { id, approved },
      });
      if (error) throw error;
      setComments(prev => prev.map(c => c.id === id ? { ...c, approved } : c));
      toast({ title: approved ? 'Comentário aprovado' : 'Comentário oculto' });
    } catch {
      toast({ title: 'Erro', variant: 'destructive' });
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este comentário?')) return;
    try {
      const { error } = await supabase.functions.invoke(`admin-blog-comments?action=delete&id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Comentário excluído' });
    } catch {
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
    }
  };

  const filtered = comments.filter(c =>
    filter === 'all' ? true : filter === 'pending' ? !c.approved : c.approved
  );
  const pendingCount = comments.filter(c => !c.approved).length;

  return (
    <div className="p-3 md:p-6 lg:p-8 space-y-4 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Comentários do Blog</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {pendingCount > 0 ? `${pendingCount} aguardando aprovação` : 'Tudo em dia 💗'}
        </p>
      </div>

      <div className="flex gap-2">
        {[
          { key: 'pending', label: `Pendentes (${pendingCount})` },
          { key: 'approved', label: 'Aprovados' },
          { key: 'all', label: 'Todos' },
        ].map(o => (
          <button key={o.key} onClick={() => setFilter(o.key as any)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${filter === o.key ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600'}`}>
            {o.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-500 py-8 text-center">Carregando...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <MessageCircle size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Nenhum comentário {filter === 'pending' ? 'pendente' : filter === 'approved' ? 'aprovado' : ''}.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <Card key={c.id} className={c.approved ? '' : 'border-amber-300 bg-amber-50/30'}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{c.author_name}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      em: {c.blog_posts?.title || '(post excluído)'} · {new Date(c.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${c.approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {c.approved ? 'Aprovado' : 'Pendente'}
                  </span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap mb-3">{c.content}</p>
                <div className="flex gap-2">
                  {c.approved ? (
                    <Button size="sm" variant="outline" onClick={() => setApproved(c.id, false)}>
                      <X size={14} className="mr-1" /> Ocultar
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setApproved(c.id, true)}>
                      <Check size={14} className="mr-1" /> Aprovar
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => remove(c.id)}>
                    <Trash2 size={14} className="mr-1" /> Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBlogComments;

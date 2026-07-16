import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ProductCard from '@/components/ProductCard';
import { Calendar, ArrowLeft, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useProducts } from '@/hooks/useProducts';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string;
  content: string;
  published_at: string;
  meta_title: string;
  meta_description: string;
  related_product_ids: string[];
}

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { products } = useProducts();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .maybeSingle()
      .then(({ data }) => {
        setPost(data as Post | null);
        setLoading(false);
        if (data) {
          supabase
            .from('blog_comments')
            .select('id, author_name, content, created_at')
            .eq('post_id', data.id)
            .eq('approved', true)
            .order('created_at', { ascending: false })
            .then(({ data: c }) => setComments(c || []));
        }
      });
  }, [slug]);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !name.trim() || !message.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from('blog_comments').insert({
        post_id: post.id,
        author_name: name.trim(),
        content: message.trim(),
      });
      if (error) throw error;
      toast({ title: 'Comentário enviado!', description: 'Aparecerá aqui após aprovação. 💗' });
      setName('');
      setMessage('');
    } catch (err: any) {
      toast({ title: 'Erro ao enviar', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!post) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <p>Post não encontrado.</p>
      <Button onClick={() => navigate('/blog')}>Voltar ao blog</Button>
    </div>
  );

  const relatedProducts = products.filter(p => post.related_product_ids?.includes(p.id));
  const wordCount = post.content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Helmet>
        <title>{post.meta_title || `${post.title} — Sam Esthetic`}</title>
        <meta name="description" content={post.meta_description || post.excerpt} />
        <link rel="canonical" href={`/blog/${post.slug}`} />
        <meta property="og:title" content={post.meta_title || post.title} />
        <meta property="og:description" content={post.meta_description || post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`/blog/${post.slug}`} />
        {post.cover_image && <meta property="og:image" content={post.cover_image} />}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt,
            image: post.cover_image,
            datePublished: post.published_at,
            author: { "@type": "Organization", name: "Sam Esthetic" },
          })}
        </script>
      </Helmet>
      <Header />

      <article className="max-w-3xl mx-auto px-4 pt-6">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft size={14} /> Voltar ao blog
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Calendar size={12} />
          {new Date(post.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>

        <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-tight mb-4">{post.title}</h1>

        {post.excerpt && <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{post.excerpt}</p>}

        {post.cover_image && (
          <img src={post.cover_image} alt={post.title} className="w-full rounded-2xl mb-8 aspect-[16/9] object-cover" />
        )}

        <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-lilac/40 shadow-pink p-5 md:p-8 my-8">
          <div
            className="prose prose-lg md:prose-xl max-w-none
              prose-headings:text-foreground prose-headings:font-bold prose-headings:tracking-tight
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-lilac/30
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-foreground prose-p:leading-[1.85] prose-p:mb-6
              prose-a:text-primary prose-a:font-medium prose-a:underline prose-a:decoration-primary/40 prose-a:underline-offset-4 hover:prose-a:decoration-primary
              prose-blockquote:border-l-4 prose-blockquote:border-primary/40 prose-blockquote:bg-lilac/20 prose-blockquote:rounded-r-2xl prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:italic prose-blockquote:not-italic
              prose-ul:pl-6 prose-ol:pl-6 prose-li:marker:text-primary prose-li:mb-2
              prose-img:rounded-2xl prose-img:shadow-pink prose-img:my-8
              prose-hr:border-border prose-hr:my-10
              prose-strong:text-foreground prose-strong:font-semibold"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-10 pt-8 border-t border-border">
            <h2 className="font-hand text-2xl text-primary mb-4">produtos que a gente indica 💗</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        <section className="mt-10 pt-8 border-t border-border">
          <h2 className="text-lg font-bold text-foreground mb-4">Comentários ({comments.length})</h2>

          <form onSubmit={submitComment} className="bg-muted/30 rounded-2xl p-4 space-y-3 mb-6">
            <Input
              placeholder="Seu nome"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              maxLength={60}
            />
            <Textarea
              placeholder="Escreva seu comentário..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              maxLength={500}
              rows={3}
            />
            <div className="flex justify-between items-center">
              <p className="text-[11px] text-muted-foreground">Seu comentário será revisado antes de aparecer.</p>
              <Button type="submit" disabled={sending} size="sm">{sending ? 'Enviando...' : 'Comentar'}</Button>
            </div>
          </form>

          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Seja o primeiro a comentar 💗</p>
            ) : (
              comments.map(c => (
                <div key={c.id} className="bg-card border border-border rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm text-foreground">{c.author_name}</p>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </article>

      <BottomNav />
    </div>
  );
};

export default BlogPost;

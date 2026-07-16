import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Calendar } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string;
  published_at: string;
}

const Blog = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, cover_image, published_at')
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        setPosts(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Helmet>
        <title>Blog Sam Esthetic — Dicas de Lash Design</title>
        <meta name="description" content="Dicas, tutoriais e novidades sobre extensão de cílios, lash design e cuidados. Aprenda com a Sam Esthetic." />
        <link rel="canonical" href="/blog" />
      </Helmet>
      <Header />

      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="text-center mb-8">
          <h1 className="font-hand text-4xl md:text-5xl text-primary">Blog Sam Esthetic</h1>
          <p className="text-sm text-muted-foreground mt-2">Dicas, tutoriais e novidades pra você lash pro 💗</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Ainda não temos posts publicados.</p>
            <p className="text-xs mt-2">Volte em breve, amor! 💗</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {posts.map((p) => (
              <Link
                key={p.id}
                to={`/blog/${p.slug}`}
                className="group bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all"
              >
                {p.cover_image && (
                  <div className="aspect-[16/9] overflow-hidden bg-muted">
                    <img
                      src={p.cover_image}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
                    <Calendar size={12} />
                    {new Date(p.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                  <h2 className="font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                    {p.title}
                  </h2>
                  {p.excerpt && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.excerpt}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Blog;

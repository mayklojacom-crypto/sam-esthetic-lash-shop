import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Calendar, Sparkles, Heart } from 'lucide-react';

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

  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen bg-gradient-to-b from-lilac/40 via-background to-pink-soft/30 pb-24 md:pb-8">
      <Helmet>
        <title>Blog Sam Esthetic — Dicas de Lash Design</title>
        <meta name="description" content="Dicas, tutoriais e novidades sobre extensão de cílios, lash design e cuidados. Aprenda com a Sam Esthetic." />
        <link rel="canonical" href="/blog" />
      </Helmet>
      <Header />

      {/* Hero fofinho */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-girly opacity-60 pointer-events-none" />
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-lilac blur-3xl opacity-70" />
        <div className="absolute -bottom-16 -right-10 w-56 h-56 rounded-full bg-pink-soft blur-3xl opacity-60" />

        <div className="relative max-w-4xl mx-auto px-4 pt-8 pb-10 text-center">
          <div className="inline-flex items-center gap-1.5 bg-white/70 backdrop-blur-sm border border-primary/15 text-primary rounded-full px-3 py-1 text-[11px] font-medium mb-3 shadow-pink">
            <Sparkles size={12} /> dicas & segredinhos
          </div>
          <h1 className="font-hand text-5xl md:text-6xl text-primary leading-none">
            Cantinho das Dicas
          </h1>
          <p className="text-sm md:text-base text-foreground/70 mt-3 max-w-xl mx-auto">
            Tutoriais, tendências e cuidados pra você lash pro brilhar ainda mais 💗
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-4 relative">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Carregando...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-3xl border border-lilac/60 shadow-pink">
            <Heart className="mx-auto text-accent mb-2" size={28} />
            <p className="font-hand text-2xl text-primary">Em breve, amor!</p>
            <p className="text-xs mt-1 text-muted-foreground">Estamos preparando conteúdos fofinhos pra você 💗</p>
          </div>
        ) : (
          <>
            {/* Post em destaque */}
            {featured && (
              <Link
                to={`/blog/${featured.slug}`}
                className="group block bg-white/80 backdrop-blur-sm rounded-3xl border border-lilac/60 overflow-hidden shadow-pink hover:shadow-elevated transition-all mb-6"
              >
                <div className="grid md:grid-cols-2 gap-0">
                  {featured.cover_image && (
                    <div className="aspect-[16/10] md:aspect-auto overflow-hidden bg-lilac/30 relative">
                      <img
                        src={featured.cover_image}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                      <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 shadow-pink">
                        ✨ Destaque
                      </span>
                    </div>
                  )}
                  <div className="p-5 md:p-7 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 text-[11px] text-primary/70 mb-2">
                      <Calendar size={12} />
                      {new Date(featured.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                      {featured.title}
                    </h2>
                    {featured.excerpt && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-3 leading-relaxed">{featured.excerpt}</p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                      ler agora <span aria-hidden>→</span>
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid dos demais */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rest.map((p, i) => (
                  <Link
                    key={p.id}
                    to={`/blog/${p.slug}`}
                    className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-lilac/50 overflow-hidden shadow-sm hover:shadow-pink hover:-translate-y-0.5 transition-all"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {p.cover_image && (
                      <div className="aspect-[16/10] overflow-hidden bg-lilac/30">
                        <img
                          src={p.cover_image}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-1.5 text-[11px] text-primary/70 mb-2">
                        <Calendar size={12} />
                        {new Date(p.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <h2 className="font-bold text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-2">
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
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Blog;

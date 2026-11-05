import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import PolicyLinks from '@/components/PolicyLinks';

export default function PolicyLayout({ title, description, path, children }: {
  title: string; description: string; path: string; children: React.ReactNode;
}) {
  const url = `https://samestheticlash.shop${path}`;
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-10">
      <Helmet>
        <title>{`${title} | Sam Esthetic`}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={`${title} | Sam Esthetic`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
      </Helmet>
      <Header />
      <main className="max-w-2xl mx-auto px-4 mt-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Voltar à loja</Link>
        <h1 className="text-2xl font-extrabold text-foreground mt-4">{title}</h1>
        <article className="mt-5 space-y-5 text-sm leading-relaxed text-foreground [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-6 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_a]:text-primary [&_a]:underline">
          {children}
        </article>
        <div className="mt-10 border-t border-border pt-5"><PolicyLinks /></div>
      </main>
      <BottomNav />
    </div>
  );
}

export const STORE_WHATSAPP_URL = 'https://wa.me/5562998755213';

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description: string;
  featured?: boolean;
  sizes?: string[];
  weight?: number; // peso em gramas
}

export const getProductBySlug = (slug: string) => products.find(p => p.slug === slug);

export const categories = [
  { id: 'todos', label: 'Todos' },
  { id: 'cilios', label: 'Cílios' },
  { id: 'colas', label: 'Colas' },
  { id: 'liquidos', label: 'Líquidos' },
  { id: 'ferramentas', label: 'Ferramentas' },
  { id: 'descartaveis', label: 'Descartáveis' },
];

export const products: Product[] = [
  {
    id: '1',
    slug: 'cilios-decemars-yy-brasileiro',
    name: 'Cílios Decemars YY Brasileiro',
    price: 21.99,
    image: '/products/cilios-decemars-yy.png',
    category: 'cilios',
    description: 'Cílios Decemars YY Brasileiro — Para um olhar incrível. Cor: Preto. Curvatura: D. Premium Y-Shaped Volume Lashes.',
    featured: true,
    sizes: ['8mm', '10mm', '12mm', '13mm'],
    weight: 50,
  },
  {
    id: '2',
    slug: 'cilios-fadvan-5d-w',
    name: 'Cílios Fadvan 5D W',
    price: 43.99,
    image: '/products/cilios-fadvan-w5d.png',
    category: 'cilios',
    description: 'Cílios Fadvan 5D W — Para um olhar incrível. Cor: Preto. Curvatura: D. Espessura 0.07mm. Allergy-Free, Premium quality, light weight lashes.',
    featured: true,
    sizes: ['8mm', '10mm', '12mm', '13mm'],
    weight: 50,
  },
  {
    id: '3',
    slug: 'cilios-decemars-6d-w',
    name: 'Cílios Decemars 6D W',
    price: 44.99,
    image: '/products/cilios-decemars-6d.png',
    category: 'cilios',
    description: 'Cílios Decemars 6D W — Para um olhar incrível. Cor: Preto. Curvatura: D. Efeito: Volume Egípcio (W Shape). Eyelash Extension.',
    featured: true,
    sizes: ['8mm', '10mm', '12mm', '13mm'],
    weight: 50,
  },
  {
    id: '4',
    slug: 'cola-elite-premium-hs16-3ml',
    name: 'Cola Elite Premium HS16 3ml',
    price: 63.99,
    image: '/products/cola-elite-hs16.png',
    category: 'colas',
    description: 'Cola Elite Premium HS16 3ml. Nível de habilidade: Avançado. Anvisa: nº 2.05.754-4. Cor: Preta. Secagem: 1 a 2 segundos. Duração: 6 a 8 semanas. Eyelash Maker Magic Pack.',
    featured: true,
    weight: 100,
  },
  {
    id: '5',
    slug: 'pads-gel-protetor-palpebras-50-pares',
    name: 'Pads (Patch) em Gel Protetor de Pálpebras — 50 Pares',
    price: 18.50,
    image: '/products/pads-gel-50.png',
    category: 'descartaveis',
    description: 'Pads (Patch) em Gel Protetor de Pálpebras. 50 Pares. Gel suave e hidratante. Protetor. Proteção de pálpebras. Sem fiapos. Formato anatômico.',
    weight: 200,
  },
  {
    id: '6',
    slug: 'microbrush-glitter-lash-design-50-uni',
    name: 'Microbrush Glitter para Lash Design — 50 uni',
    price: 8.99,
    image: '/products/microbrush-glitter.png',
    category: 'descartaveis',
    description: 'Microbrush Glitter para Lash Design. Ponta ultrafina de precisão de cabo. Com Glitter elegante no cabo. Descartável e higiênico. Quantidade: 50 unidades.',
    weight: 80,
  },
  {
    id: '7',
    slug: 'fita-micropore-antialergica',
    name: 'Fita Micropore Antialérgica',
    price: 3.00,
    image: '/products/fita-micropore.png',
    category: 'ferramentas',
    description: 'Fita Micropore Antialérgica para alongamento de cílios. Ideal para fixação durante o procedimento.',
    weight: 30,
  },
  {
    id: '8',
    slug: 'fita-transpore-extensao-cilios',
    name: 'Fita Transpore para Extensão de Cílios',
    price: 4.00,
    image: '/products/fita-transpore.png',
    category: 'ferramentas',
    description: 'Fita Transpore para Extensão de Cílios. Respirável. Transparente e perfurada. Ideal para isolar e fixar. Fácil de cortar sem tesoura.',
    weight: 30,
  },
  {
    id: '9',
    slug: 'anel-batoque-colas-divisoria-50-uni',
    name: 'Anel Batoque para Colas com Divisória — 50 uni',
    price: 13.00,
    image: '/products/anel-batoque.png',
    category: 'descartaveis',
    description: 'Anel Batoque para Colas com Divisória. Higiênico e descartável. Design ergonômico. Divisória prática. Quantidade: 50 unidades.',
    weight: 100,
  },
  {
    id: '10',
    slug: 'aplicador-gloss-descartavel-glitter-50-uni',
    name: 'Aplicador Gloss Descartável Glitter — 50 uni',
    price: 8.99,
    image: '/products/aplicador-gloss.png',
    category: 'descartaveis',
    description: 'Aplicador Gloss Descartável Glitter. Precisão na aplicação. Ponta de esponja macia. Hastes com glitter elegante. Higiênico e descartável. Quantidade: 50 unidades.',
    weight: 80,
  },
];

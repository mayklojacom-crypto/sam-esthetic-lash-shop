export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description: string;
  featured?: boolean;
}

export const categories = [
  { id: 'todos', label: 'Todos', icon: '✨' },
  { id: 'cilios', label: 'Cílios', icon: '👁️' },
  { id: 'colas', label: 'Colas', icon: '💧' },
  { id: 'acessorios', label: 'Acessórios', icon: '🛠️' },
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Cílios Y Decemars YY',
    price: 21.99,
    image: '/products/cilios-decemars-yy.png',
    category: 'cilios',
    description: 'Cílios Y Decemars YY — Para um olhar incrível. Cor: Preto. Curvatura: D. Tamanhos disponíveis: 8mm, 10mm, 12mm, 13mm. Premium Y-Shaped Volume Lashes.',
    featured: true,
  },
  {
    id: '2',
    name: 'Cílios Fadvan W 5D',
    price: 43.99,
    image: '/products/cilios-fadvan-w5d.png',
    category: 'cilios',
    description: 'Cílios Fadvan W 5D — Para um olhar incrível. Cor: Preto. Curvatura: D. Espessura 0.07mm. Mix 8-14mm. Allergy-Free, Premium quality, light weight lashes.',
    featured: true,
  },
  {
    id: '3',
    name: 'Cílios Decemars 6D',
    price: 44.99,
    image: '/products/cilios-decemars-6d.png',
    category: 'cilios',
    description: 'Cílios Decemars 6D — Para um olhar incrível. Cor: Preto. Curvatura: D. Efeito: Volume Egípcio (W Shape). Tamanhos: 10mm, 12mm, 13mm. Eyelash Extension.',
    featured: true,
  },
  {
    id: '4',
    name: 'Cola Elite Premium HS16 3ml',
    price: 63.99,
    image: '/products/cola-elite-hs16.png',
    category: 'colas',
    description: 'Cola Elite Premium HS16 3ml. Nível de habilidade: Avançado. Anvisa: nº 2.05.754-4. Cor: Preta. Secagem: 1 a 2 segundos. Duração: 6 a 8 semanas. Eyelash Maker Magic Pack.',
    featured: true,
  },
  {
    id: '5',
    name: 'Pads (Patch) em Gel Protetor de Pálpebras — 50 Pares',
    price: 18.50,
    image: '/products/pads-gel-50.png',
    category: 'acessorios',
    description: 'Pads (Patch) em Gel Protetor de Pálpebras. 50 Pares. Gel suave e hidratante. Protetor. Proteção de pálpebras. Sem fiapos. Formato anatômico.',
  },
  {
    id: '6',
    name: 'Microbrush Glitter para Lash Design — 50 uni',
    price: 8.99,
    image: '/products/microbrush-glitter.png',
    category: 'acessorios',
    description: 'Microbrush Glitter para Lash Design. Ponta ultrafina de precisão de cabo. Com Glitter elegante no cabo. Descartável e higiênico. Quantidade: 50 unidades.',
  },
];

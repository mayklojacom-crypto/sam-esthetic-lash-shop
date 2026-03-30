export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description: string;
  featured?: boolean;
  sizes?: string[];
}

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
    name: 'Cílios Decemars YY Brasileiro',
    price: 21.99,
    image: '/products/cilios-decemars-yy.png',
    category: 'cilios',
    description: 'Cílios Decemars YY Brasileiro — Para um olhar incrível. Cor: Preto. Curvatura: D. Premium Y-Shaped Volume Lashes.',
    featured: true,
    sizes: ['8mm', '10mm', '12mm', '13mm'],
  },
  {
    id: '2',
    name: 'Cílios Fadvan 5D W',
    price: 43.99,
    image: '/products/cilios-fadvan-w5d.png',
    category: 'cilios',
    description: 'Cílios Fadvan 5D W — Para um olhar incrível. Cor: Preto. Curvatura: D. Espessura 0.07mm. Allergy-Free, Premium quality, light weight lashes.',
    featured: true,
    sizes: ['8mm', '10mm', '12mm', '13mm'],
  },
  {
    id: '3',
    name: 'Cílios Decemars 6D W',
    price: 44.99,
    image: '/products/cilios-decemars-6d.png',
    category: 'cilios',
    description: 'Cílios Decemars 6D W — Para um olhar incrível. Cor: Preto. Curvatura: D. Efeito: Volume Egípcio (W Shape). Eyelash Extension.',
    featured: true,
    sizes: ['8mm', '10mm', '12mm', '13mm'],
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
    category: 'descartaveis',
    description: 'Pads (Patch) em Gel Protetor de Pálpebras. 50 Pares. Gel suave e hidratante. Protetor. Proteção de pálpebras. Sem fiapos. Formato anatômico.',
  },
  {
    id: '6',
    name: 'Microbrush Glitter para Lash Design — 50 uni',
    price: 8.99,
    image: '/products/microbrush-glitter.png',
    category: 'descartaveis',
    description: 'Microbrush Glitter para Lash Design. Ponta ultrafina de precisão de cabo. Com Glitter elegante no cabo. Descartável e higiênico. Quantidade: 50 unidades.',
  },
  {
    id: '7',
    name: 'Fita Micropore Antialérgica',
    price: 3.00,
    image: '/products/fita-micropore.png',
    category: 'ferramentas',
    description: 'Fita Micropore Antialérgica para alongamento de cílios. Ideal para fixação durante o procedimento.',
  },
  {
    id: '8',
    name: 'Fita Transpore para Extensão de Cílios',
    price: 4.00,
    image: '/products/fita-transpore.png',
    category: 'ferramentas',
    description: 'Fita Transpore para Extensão de Cílios. Respirável. Transparente e perfurada. Ideal para isolar e fixar. Fácil de cortar sem tesoura.',
  },
  {
    id: '9',
    name: 'Anel Batoque para Colas com Divisória — 50 uni',
    price: 13.00,
    image: '/products/anel-batoque.png',
    category: 'descartaveis',
    description: 'Anel Batoque para Colas com Divisória. Higiênico e descartável. Design ergonômico. Divisória prática. Quantidade: 50 unidades.',
  },
  {
    id: '10',
    name: 'Aplicador Gloss Descartável Glitter — 50 uni',
    price: 8.99,
    image: '/products/aplicador-gloss.png',
    category: 'descartaveis',
    description: 'Aplicador Gloss Descartável Glitter. Precisão na aplicação. Ponta de esponja macia. Hastes com glitter elegante. Higiênico e descartável. Quantidade: 50 unidades.',
  },
];

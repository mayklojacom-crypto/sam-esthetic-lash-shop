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
  { id: 'ferramentas', label: 'Ferramentas', icon: '🔧' },
  { id: 'kits', label: 'Kits', icon: '🎁' },
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Cílios Fio a Fio Volume Russo 0.07',
    price: 29.90,
    originalPrice: 39.90,
    image: 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=400&h=400&fit=crop',
    category: 'cilios',
    description: 'Cílios fio a fio para volume russo, espessura 0.07mm. Curvatura C e D disponíveis. Mix de tamanhos de 8mm a 14mm. Fibra de seda premium com acabamento matte.',
    featured: true,
  },
  {
    id: '2',
    name: 'Cola Premium Black Glue 5ml',
    price: 49.90,
    originalPrice: 69.90,
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop',
    category: 'colas',
    description: 'Cola profissional preta para extensão de cílios. Secagem ultra-rápida de 1-2 segundos. Duração de 6-8 semanas. Ideal para profissionais.',
    featured: true,
  },
  {
    id: '3',
    name: 'Pinça Curva Isolamento Pro',
    price: 34.90,
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop',
    category: 'ferramentas',
    description: 'Pinça curva de precisão para isolamento de cílios. Aço inoxidável cirúrgico. Ponta ultrafina para maior controle.',
    featured: true,
  },
  {
    id: '4',
    name: 'Kit Iniciante Lash Designer',
    price: 189.90,
    originalPrice: 249.90,
    image: 'https://images.unsplash.com/photo-1631214500115-598fc2cb8ada?w=400&h=400&fit=crop',
    category: 'kits',
    description: 'Kit completo para iniciantes em extensão de cílios. Inclui: 3 bandejas de cílios, 1 cola, 2 pinças, micropore, microbrush e necessaire.',
    featured: true,
  },
  {
    id: '5',
    name: 'Cílios Volume Brasileiro 0.10',
    price: 24.90,
    image: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=400&h=400&fit=crop',
    category: 'cilios',
    description: 'Cílios para técnica volume brasileiro. Espessura 0.10mm. Curvatura C. Bandeja com 16 linhas mix.',
  },
  {
    id: '6',
    name: 'Removedor de Cola em Gel 15g',
    price: 19.90,
    image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop',
    category: 'colas',
    description: 'Removedor de cola em gel para remoção segura de extensões de cílios. Fórmula suave que não irrita os olhos.',
  },
  {
    id: '7',
    name: 'Pinça Reta Volume 45°',
    price: 32.90,
    image: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=400&h=400&fit=crop',
    category: 'ferramentas',
    description: 'Pinça reta com ângulo de 45° para técnicas de volume. Perfeita para criar leques. Aço inoxidável de alta qualidade.',
  },
  {
    id: '8',
    name: 'Kit Profissional Completo',
    price: 349.90,
    originalPrice: 449.90,
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop',
    category: 'kits',
    description: 'Kit profissional completo com 6 bandejas de cílios variados, 2 colas, 4 pinças, acessórios e maleta organizadora.',
  },
  {
    id: '9',
    name: 'Cílios Mega Volume 0.05',
    price: 34.90,
    image: 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=400&h=400&fit=crop',
    category: 'cilios',
    description: 'Cílios ultrafinos 0.05mm para técnica mega volume. Até 20 fios por leque. Fibra PBT premium importada.',
  },
  {
    id: '10',
    name: 'Primer para Cílios 10ml',
    price: 22.90,
    image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop',
    category: 'colas',
    description: 'Primer preparador para extensão de cílios. Remove oleosidade e resíduos. Aumenta a durabilidade da colagem.',
  },
];

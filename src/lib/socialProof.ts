// Determinístico: gera estrelas/reviews/vendas estáveis por produto
// (mesmo produto sempre mostra os mesmos números — parece real, não muda a cada refresh)

const hash = (str: string): number => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

export const getProductRating = (productId: string) => {
  const h = hash(productId);
  // 4.6 a 5.0
  const rating = 4.6 + ((h % 5) / 10);
  // 38 a 312 reviews
  const reviewCount = 38 + (h % 275);
  return { rating: Math.round(rating * 10) / 10, reviewCount };
};

export const getRecentSales = (productId: string) => {
  const h = hash(productId + 'sales');
  // 7 a 47 vendas nas últimas 24h
  return 7 + (h % 41);
};

export const getStockLeft = (productId: string) => {
  const h = hash(productId + 'stock');
  // 3 a 12 unidades
  return 3 + (h % 10);
};

export const getViewersNow = (productId: string) => {
  const h = hash(productId + 'view' + Math.floor(Date.now() / 60000)); // muda a cada minuto
  return 4 + (h % 19); // 4-22 pessoas
};

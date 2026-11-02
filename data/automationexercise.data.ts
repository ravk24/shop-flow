// Recorded on automationexercise.com, 2026-11-03.

interface AeProduct {
  id: number;
  name: string;
  category: string;
  price: string;
  brand: string;
}

const blueTop = {
  id: 1,
  name: 'Blue Top',
  category: 'Category: Women > Tops',
  price: 'Rs. 500',
  brand: 'Brand: Polo',
} satisfies AeProduct;

const catalogue = {
  productCount: 34,
  // The search also matches categories, so not every result has the term in its name.
  search: { term: 'Top', resultCount: 14, includes: ['Blue Top', 'Winter Top'] },
  noMatchTerm: 'zzzz-no-such-product',
};

// A made-up address on the reserved .invalid domain: it can't belong to anyone, and a failed login creates nothing.
const unknownLogin = {
  email: 'shopflow-test@example.invalid',
  password: 'not-a-real-password',
  error: 'Your email or password is incorrect!',
};

export { blueTop, catalogue, unknownLogin };
export type { AeProduct };

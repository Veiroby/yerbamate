export type TgProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  descriptionLv: string | null;
  descriptionEn: string | null;
  price: number | string;
  bottleDeposit?: number | string | null;
  currency: string;
  brand: string | null;
  images?: Array<{ url: string; altText: string | null }>;
  category?: { name: string; slug: string } | null;
};

export type TgCartItem = {
  product: TgProduct;
  quantity: number;
};

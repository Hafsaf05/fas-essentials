export interface ProductSpec {
  material: string;
  capacity?: string;
  color?: string;
  compatibility?: string;
  use?: string;
  lid?: string;
  finish?: string;
  insulation?: string;
  handle?: string;
  specialFeature?: string;
}

export interface CustomerReview {
  id: string;
  author: string;
  location: string;
  rating: number; // 1 to 5
  date: string;
  title: string;
  comment: string;
  verified: boolean;
}

export interface Product {
  id: string;
  title: string;
  shortTitle: string;
  handle: string;
  price: number; // in ₹ (e.g. 349)
  compareAtPrice: number; // in ₹ (e.g. 799)
  category: string;
  badge?: string;
  headline: string;
  description: string;
  features: string[];
  specs: ProductSpec;
  careInstructions: string[];
  images: string[];
  inStock: boolean;
  featured?: boolean;
  rating: number;
  reviewCount: number;
  stockCount: number;
  highlights: string[];
  colors?: { id: string; name: string; hex: string; stock: number }[];
  customerReviews: CustomerReview[];
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
}

export type SortOption = 'featured' | 'rating' | 'price-asc' | 'price-desc' | 'discount';

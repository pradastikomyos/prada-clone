export type ListingProduct = {
  name: string;
  note: string;
  image: string;
  alt?: string;
  colors?: string[];
};

export type HeroSection = {
  id: string;
  title: string;
  mediaType: 'image' | 'video';
  src: string;
  links: Array<{
    text: string;
    href: string;
  }>;
};

export type ProductTuple = readonly [name: string, price: string, image: string];

export type ProductGroup = {
  title: string;
  products: ProductTuple[];
};

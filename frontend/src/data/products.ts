import { ListingProduct } from '../types/catalog';

/**
 * Women category products used by `WomenPage`. All images are harvested
 * to `public/assets/reference/prada/women-categories/...`.
 */
export const womenProducts = [
  {
    title: 'DRESSES',
    products: [
      ['Embroidered linen mini-dress', 'EUR 2,900', '/assets/reference/prada/women-categories/dresses/embroidered-linen-mini-dress.avif'],
      ['Embroidered linen dress', 'EUR 2,900', '/assets/reference/prada/women-categories/dresses/embroidered-linen-dress.avif'],
      ['Embroidered canvas mini-dress', 'EUR 2,500', '/assets/reference/prada/women-categories/dresses/embroidered-canvas-mini-dress.avif'],
    ],
  },
  {
    title: 'SHIRTS AND TOPS',
    products: [
      ['Embroidered linen top', 'EUR 1,100', '/assets/reference/prada/women-categories/tops/embroidered-linen-top.avif'],
      ['Linen top with floral motif', 'EUR 1,300', '/assets/reference/prada/women-categories/tops/linen-top-floral-motif.avif'],
      ['Sleeveless polka-dot silk shirt', 'EUR 1,450', '/assets/reference/prada/women-categories/tops/sleeveless-polka-dot-silk-shirt.avif'],
    ],
  },
  {
    title: 'OUTERWEAR',
    products: [
      ['Embroidered gabardine blouson', 'EUR 3,500', '/assets/reference/prada/women-categories/outerwear/embroidered-gabardine-blouson.avif'],
      ['Washed Re-Nylon jacket', 'EUR 2,400', '/assets/reference/prada/women-categories/outerwear/washed-re-nylon-jacket.avif'],
      ['Silk faille blouson jacket', 'EUR 2,650', '/assets/reference/prada/women-categories/outerwear/silk-faille-blouson-jacket.avif'],
    ],
  },
  {
    title: 'TROUSERS AND SHORTS',
    products: [
      ['Floral print linen skirt', 'EUR 950', '/assets/reference/prada/women-categories/trousers/floral-print-linen-skirt.avif'],
      ['Pleated silk faille skirt', 'EUR 850', '/assets/reference/prada/women-categories/trousers/pleated-silk-faille-skirt.avif'],
      ['Poplin shorts', 'EUR 790', '/assets/reference/prada/women-categories/trousers/poplin-shorts.avif'],
    ],
  },
];

const womenNewArrivalRows: Array<readonly [name: string, note: string, image: string, colors: string[]]> = [
  ['Ribbed cotton top', 'WHITE - YELLOW - BLACK', '/assets/reference/prada/women-new-arrivals/products/ribbed-cotton-top.avif', ['#ffffff', '#ffff00', '#000000']],
  ['Embroidered linen skirt', 'NEW', '/assets/reference/prada/women-new-arrivals/products/embroidered-linen-skirt.avif', ['#fdfdfd']],
  ['Antiqued leather sandals', 'CHALK WHITE - NATURAL', '/assets/reference/prada/women-new-arrivals/products/antiqued-leather-sandals.avif', ['#f5f5f5', '#d2b48c']],
  ['Prada Fold large leather shoulder bag', 'WHITE - CARAMEL - BLACK - +3', '/assets/reference/prada/women-new-arrivals/products/prada-fold-large-leather-shoulder-bag.avif', ['#ffffff', '#af6e4d', '#000000', '#cccccc']],
  ['Striped pique polo shirt', 'NEW', '/assets/reference/prada/women-new-arrivals/products/striped-pique-polo-shirt.avif', ['#334e68', '#ffffff']],
  ['Prada Bonnie small printed linen and leather handbag', 'NEW', '/assets/reference/prada/women-new-arrivals/products/prada-bonnie-small-printed-linen-leather-handbag.avif', ['#fdfdfd', '#000000']],
  ['Shuffle antiqued leather boat shoes', 'CHALK WHITE - BLACK - COGNAC', '/assets/reference/prada/women-new-arrivals/products/shuffle-antiqued-leather-boat-shoes.avif', ['#f5f5f5', '#000000', '#964b00']],
  ['Suede jacket', 'ONLINE EARLY ACCESS', '/assets/reference/prada/women-new-arrivals/products/suede-jacket.avif', ['#c39a6b']],
  ['Old denim blouson jacket', 'NEW', '/assets/reference/prada/women-new-arrivals/products/old-denim-blouson-jacket.avif', ['#4a5d7e']],
];

export const womenNewArrivals: ListingProduct[] = womenNewArrivalRows.map(([name, note, image, colors]) => ({ name, note, image, colors }));

const menNewArrivalRows: Array<readonly [name: string, note: string, image: string]> = [
  ['Prada Route canvas and leather tote bag', 'NEW', '/assets/reference/prada/men-new-arrivals/products/prada-route-canvas-leather-tote-bag.jpg'],
  ['Suede bomber jacket', 'NEW', '/assets/reference/prada/men-new-arrivals/products/suede-bomber-jacket.jpg'],
  ['Sunglasses with the iconic metal plaque', 'VIRTUAL TRY-ON', '/assets/reference/prada/men-new-arrivals/products/sunglasses-iconic-metal-plaque.jpg'],
  ['Leather mules', 'SIENNA - BLACK', '/assets/reference/prada/men-new-arrivals/products/leather-mules.jpg'],
  ['Prada Explore leather shoulder bag', 'COFFEE - BLACK', '/assets/reference/prada/men-new-arrivals/products/prada-explore-leather-shoulder-bag.jpg'],
  ['Suede band sandals', 'DARK BROWN - CINNAMON - DESERT BEIGE - NAVY', '/assets/reference/prada/men-new-arrivals/products/suede-band-sandals.jpg'],
  ['Striped cotton pique polo shirt', 'NEW', '/assets/reference/prada/men-new-arrivals/products/striped-cotton-pique-polo-shirt.jpg'],
  ['Old denim five-pocket jeans', 'NEW', '/assets/reference/prada/men-new-arrivals/products/old-denim-five-pocket-jeans.jpg'],
  ['Bull denim zipper shirt', 'NEW', '/assets/reference/prada/men-new-arrivals/products/bull-denim-zipper-shirt.jpg'],
];

export const menNewArrivals: ListingProduct[] = menNewArrivalRows.map(([name, note, image]) => ({ name, note, image }));

/**
 * Men category products used by `MenPage`. Reuses images from
 * `public/assets/reference/prada/men-new-arrivals/products/...`.
 */
export const menProducts = [
  {
    title: 'OUTERWEAR',
    products: [
      ['Suede bomber jacket', 'EUR 4,200', '/assets/reference/prada/men-new-arrivals/products/suede-bomber-jacket.jpg'],
      ['Bull denim zipper shirt', 'EUR 1,350', '/assets/reference/prada/men-new-arrivals/products/bull-denim-zipper-shirt.jpg'],
    ],
  },
  {
    title: 'SHIRTS AND TOPS',
    products: [
      ['Striped cotton pique polo shirt', 'EUR 950', '/assets/reference/prada/men-new-arrivals/products/striped-cotton-pique-polo-shirt.jpg'],
    ],
  },
  {
    title: 'TROUSERS',
    products: [
      ['Old denim five-pocket jeans', 'EUR 1,100', '/assets/reference/prada/men-new-arrivals/products/old-denim-five-pocket-jeans.jpg'],
    ],
  },
  {
    title: 'BAGS AND ACCESSORIES',
    products: [
      ['Prada Route canvas and leather tote bag', 'EUR 2,600', '/assets/reference/prada/men-new-arrivals/products/prada-route-canvas-leather-tote-bag.jpg'],
      ['Prada Explore leather shoulder bag', 'EUR 2,100', '/assets/reference/prada/men-new-arrivals/products/prada-explore-leather-shoulder-bag.jpg'],
      ['Sunglasses with the iconic metal plaque', 'EUR 380', '/assets/reference/prada/men-new-arrivals/products/sunglasses-iconic-metal-plaque.jpg'],
    ],
  },
];

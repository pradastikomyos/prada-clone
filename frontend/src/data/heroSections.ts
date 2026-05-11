import type { HeroSection } from '../types/catalog';

/**
 * Home page hero sections. Media lives under `/assets/reference/prada/...`.
 * Listing hero videos are referenced from here so `ListingPage` no longer
 * hardcodes CDN URLs.
 */
export const homeSections: HeroSection[] = [
  {
    id: 'home',
    title: 'Days of Summer',
    mediaType: 'video',
    src: '/assets/reference/prada/home/hero/days-of-summer-loop.mp4',
    links: [
      { text: 'For Her', href: 'women.html' },
      { text: 'For Him', href: 'men.html' },
    ],
  },
  {
    id: 'new-arrivals-women',
    title: "Women's New Arrivals",
    mediaType: 'video',
    src: '/assets/reference/prada/women-new-arrivals/hero/new-arrivals-loop.webm',
    links: [{ text: "Women's New Arrivals", href: 'new-arrivals.html' }],
  },
  {
    id: 'spring-summer-women',
    title: 'Spring Summer 2026',
    mediaType: 'image',
    src: '/assets/reference/prada/home/mosaic/spring-summer-women-landscape.avif',
    links: [{ text: 'Spring Summer 2026', href: 'women.html' }],
  },
  {
    id: 'new-arrivals-men',
    title: "Men's New Arrivals",
    mediaType: 'image',
    src: '/assets/reference/prada/home/mosaic/spring-summer-men-landscape.avif',
    links: [{ text: "Men's New Arrivals", href: 'men.html' }],
  },
  {
    id: 'spring-summer-men',
    title: 'Spring Summer 2026',
    mediaType: 'video',
    src: '/assets/reference/prada/men-new-arrivals/hero/new-arrivals-loop.webm',
    links: [{ text: 'Spring Summer 2026', href: 'men.html' }],
  },
];

/**
 * Listing hero videos, referenced from `ListingPage`.
 */
export const listingHeroVideo = {
  women: '/assets/reference/prada/women-new-arrivals/hero/new-arrivals-loop.webm',
  men: '/assets/reference/prada/men-new-arrivals/hero/new-arrivals-loop.webm',
} as const;

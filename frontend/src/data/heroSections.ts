import type { HeroSection } from '../types/catalog';
import { SITE_ASSET_FALLBACKS, type SiteAssetSlot } from '../services/siteAssets';

/**
 * Build the home page hero sections from a resolved asset map.
 * When `assetMap` is null (Supabase not configured or still loading),
 * falls back to local `/assets/reference/...` paths.
 */
export function buildHomeSections(
  assetMap: Record<SiteAssetSlot, string> | null,
): HeroSection[] {
  const get = (slot: SiteAssetSlot) =>
    assetMap?.[slot] ?? SITE_ASSET_FALLBACKS[slot];

  return [
    {
      id: 'home',
      title: 'Days of Summer',
      mediaType: 'video',
      src: get('home.hero.video'),
      links: [
        { text: 'For Her', href: '/women' },
        { text: 'For Him', href: '/men' },
      ],
    },
    {
      id: 'new-arrivals-women',
      title: "Women's New Arrivals",
      mediaType: 'video',
      src: get('women.new-arrivals.hero.video'),
      links: [{ text: "Women's New Arrivals", href: '/women/new-arrivals' }],
    },
    {
      id: 'spring-summer-women',
      title: 'Spring Summer 2026',
      mediaType: 'image',
      src: get('home.spring-summer.women.mosaic'),
      links: [{ text: 'Spring Summer 2026', href: '/women' }],
    },
    {
      id: 'new-arrivals-men',
      title: "Men's New Arrivals",
      mediaType: 'image',
      src: get('home.spring-summer.men.mosaic'),
      links: [{ text: "Men's New Arrivals", href: '/men/new-arrivals' }],
    },
    {
      id: 'spring-summer-men',
      title: 'Spring Summer 2026',
      mediaType: 'video',
      src: get('men.new-arrivals.hero.video'),
      links: [{ text: 'Spring Summer 2026', href: '/men' }],
    },
  ];
}

/**
 * Static listing hero video URLs — used by ListingPage.
 * Resolved at runtime via useSiteAssets() hook; these are the fallbacks.
 */
export const listingHeroVideo = {
  women: SITE_ASSET_FALLBACKS['women.new-arrivals.hero.video'],
  men:   SITE_ASSET_FALLBACKS['men.new-arrivals.hero.video'],
} as const;

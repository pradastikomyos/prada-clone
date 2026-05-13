import { MenuCategory, MenuSection } from '../types/navigation';

export const menuCategories: MenuCategory[] = [
  { id: 'new-arrivals', label: 'New Arrivals' },
  { id: 'women', label: 'Women' },
  { id: 'men', label: 'Men' },
];

export const menuData: Record<string, MenuSection[]> = {
  'new-arrivals': [
    {
      header: 'FOR HER',
      links: [
        { text: "Women's New Arrivals", href: '/women/new-arrivals' },
        { text: 'Spring Summer 2026', href: '/women' },
      ],
    },
    {
      header: 'FOR HIM',
      links: [
        { text: "Men's New Arrivals", href: '/men/new-arrivals' },
        { text: 'Spring Summer 2026', href: '/men' },
      ],
    },
  ],
  women: [
    {
      header: null,
      links: [
        { text: 'Ready to wear', href: '/women' },
      ],
    },
    {
      header: 'HIGHLIGHTS',
      links: [
        { text: 'Spring Summer 2026', href: '/women' },
      ],
    },
  ],
  men: [
    {
      header: null,
      links: [
        { text: 'Ready to wear', href: '/men' },
      ],
    },
    {
      header: 'HIGHLIGHTS',
      links: [
        { text: 'Spring Summer 2026', href: '/men' },
      ],
    },
  ],
};

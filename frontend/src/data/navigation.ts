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
        { text: "Women's New Arrivals", href: 'new-arrivals.html' },
        { text: 'Spring Summer 2026', href: 'women.html' },
      ],
    },
    {
      header: 'FOR HIM',
      links: [
        { text: "Men's New Arrivals", href: 'men.html' },
        { text: 'Spring Summer 2026', href: 'men.html' },
      ],
    },
  ],
  women: [
    {
      header: null,
      links: [
        { text: 'Ready to wear', href: 'women.html' },
      ],
    },
    {
      header: 'HIGHLIGHTS',
      links: [
        { text: 'Spring Summer 2026', href: 'women.html' },
      ],
    },
  ],
  men: [
    {
      header: null,
      links: [
        { text: 'Ready to wear', href: 'men.html' },
      ],
    },
    {
      header: 'HIGHLIGHTS',
      links: [
        { text: 'Spring Summer 2026', href: 'men.html' },
      ],
    },
  ],
};

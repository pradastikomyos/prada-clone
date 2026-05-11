export type MenuLink = {
  text: string;
  href?: string;
  placeholder?: boolean;
};

export type MenuSection = {
  header: string | null;
  links: MenuLink[];
};

export type MenuCategory = {
  id: string;
  label: string;
  badge?: string;
};

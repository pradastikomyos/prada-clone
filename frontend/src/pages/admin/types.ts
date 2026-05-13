/**
 * Shared type definitions for the admin section.
 * Centralised here so AdminPage, section pages, Rail, and Sidebar
 * all import from one place — no more duplicated local type aliases.
 */

export const ADMIN_VIEWS = ['dashboard', 'inventory', 'orders', 'payments', 'bopis', 'cms', 'doku'] as const;
export type AdminView = (typeof ADMIN_VIEWS)[number];

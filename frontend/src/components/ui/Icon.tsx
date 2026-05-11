import type { ComponentType, SVGProps } from 'react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import * as HugeiconsCoreIcons from '@hugeicons/core-free-icons';
import * as PhosphorIcons from '@phosphor-icons/react';
import type { IconWeight } from '@phosphor-icons/react';

/**
 * Minimal local shape for phosphor icon components. We can't safely reuse phosphor's own
 * `IconProps` through the namespace-wide `as unknown` cast (it flattens to a form TS won't
 * accept `className`/`role`/etc on), so we describe just the props we pass.
 */
type PhosphorIconComponent = ComponentType<
  SVGProps<SVGSVGElement> & {
    size?: string | number;
    weight?: IconWeight;
    color?: string;
    mirrored?: boolean;
  }
>;

export type IconSource = 'hugeicons' | 'phosphor';

export interface UnifiedIconProps {
  /** Which icon library to pull the icon from. */
  source: IconSource;
  /**
   * Name of the icon as exported by the library.
   * - For `hugeicons`, this matches an export from `@hugeicons/core-free-icons` (e.g. `Search01Icon`).
   * - For `phosphor`, this matches a component name from `@phosphor-icons/react` (e.g. `Pause`, `Play`).
   */
  name: string;
  /** Pixel size. Default 20. */
  size?: number;
  /** Stroke width (hugeicons only). Default 1.5. Ignored for phosphor. */
  strokeWidth?: number;
  /** Weight (phosphor only). Default 'regular'. Ignored for hugeicons. */
  weight?: IconWeight;
  className?: string;
  'aria-label'?: string;
}

// Narrow record views over the namespace imports so we can look up by string key.
const hugeiconsRegistry = HugeiconsCoreIcons as unknown as Record<string, IconSvgElement | undefined>;
const phosphorRegistry = PhosphorIcons as unknown as Record<string, PhosphorIconComponent | undefined>;

/**
 * Unified icon wrapper that can render icons from either `@hugeicons/core-free-icons`
 * (via `@hugeicons/react`) or `@phosphor-icons/react`, selected by the `source` prop.
 *
 * Phosphor acts as a fallback source for icons missing from hugeicons. Use the existing
 * `HugeiconsIcon`/`AdminIcon` wrappers for icons whose names are known statically — this
 * wrapper is meant for code paths that want a single uniform interface across libraries.
 *
 * If the requested name doesn't resolve in the chosen library, a warning is logged and
 * `null` is rendered (the component never throws).
 */
export function Icon({
  source,
  name,
  size = 20,
  strokeWidth = 1.5,
  weight = 'regular',
  className,
  'aria-label': ariaLabel,
}: UnifiedIconProps) {
  if (source === 'hugeicons') {
    const iconData = hugeiconsRegistry[name];
    if (!iconData) {
      console.warn(`[Icon] hugeicons icon "${name}" not found in @hugeicons/core-free-icons`);
      return null;
    }
    return (
      <HugeiconsIcon
        icon={iconData}
        size={size}
        strokeWidth={strokeWidth}
        color="currentColor"
        className={className}
        role={ariaLabel ? 'img' : undefined}
        aria-label={ariaLabel}
        aria-hidden={ariaLabel ? undefined : true}
      />
    );
  }

  if (source === 'phosphor') {
    const PhosphorComponent = phosphorRegistry[name];
    if (!PhosphorComponent || typeof PhosphorComponent !== 'function') {
      console.warn(`[Icon] phosphor icon "${name}" not found in @phosphor-icons/react`);
      return null;
    }
    return (
      <PhosphorComponent
        size={size}
        weight={weight}
        color="currentColor"
        className={className}
        role={ariaLabel ? 'img' : undefined}
        aria-label={ariaLabel}
        aria-hidden={ariaLabel ? undefined : true}
      />
    );
  }

  // Exhaustiveness guard — unreachable under TypeScript, but stays safe at runtime.
  console.warn(`[Icon] unknown source "${source as string}"`);
  return null;
}

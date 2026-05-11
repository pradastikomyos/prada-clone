import { ComponentProps } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';

export type AdminIconProps = Omit<ComponentProps<typeof HugeiconsIcon>, 'strokeWidth'>;

export function AdminIcon(props: AdminIconProps) {
  return <HugeiconsIcon {...props} strokeWidth={1} />;
}

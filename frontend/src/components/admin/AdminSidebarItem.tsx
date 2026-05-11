import { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type AdminSidebarItemBaseProps = {
  label: ReactNode;
  icon?: ReactNode;
  trailing?: ReactNode;
  active?: boolean;
  className?: string;
};

type AdminSidebarButtonProps = AdminSidebarItemBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & {
    href?: never;
  };

type AdminSidebarAnchorProps = AdminSidebarItemBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className'> & {
    href: string;
  };

export type AdminSidebarItemProps = AdminSidebarButtonProps | AdminSidebarAnchorProps;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const itemClasses =
  'flex h-10 w-full items-center justify-between gap-3 rounded-md px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2';

export function AdminSidebarItem(props: AdminSidebarItemProps) {
  const { active = false, className, icon, label, trailing } = props;
  const content = (
    <>
      <span className="flex min-w-0 items-center gap-3">
        {icon ? <span className="shrink-0 text-neutral-500">{icon}</span> : null}
        <span className="truncate">{label}</span>
      </span>
      {trailing ? <span className="shrink-0 text-neutral-500">{trailing}</span> : null}
    </>
  );
  const classes = cx(
    itemClasses,
    active ? 'bg-neutral-950 text-white' : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950',
    active && '[&_span]:text-white',
    className,
  );

  if (typeof props.href === 'string') {
    const { active: _active, className: _className, icon: _icon, label: _label, trailing: _trailing, ...anchorProps } = props;

    return (
      <a className={classes} aria-current={active ? 'page' : undefined} {...anchorProps}>
        {content}
      </a>
    );
  }

  const buttonItemProps = props as AdminSidebarButtonProps;
  const { active: _active, className: _className, icon: _icon, label: _label, trailing: _trailing, ...buttonProps } = buttonItemProps;
  const buttonType = buttonProps.type ?? 'button';

  return (
    <button className={classes} type={buttonType} {...buttonProps}>
      {content}
    </button>
  );
}

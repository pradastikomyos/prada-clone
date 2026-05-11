import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardSquare03Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { SignOut } from '@phosphor-icons/react';
import { useAuthUser } from '../../hooks/useCartSummary';
import { LogoutConfirmDialog } from './LogoutConfirmDialog';

type UserHeaderActionsProps = {
  /** Extra CSS class applied to the wrapper span. */
  className?: string;
};

/**
 * Renders the user identity area in any storefront header.
 *
 * - Guest: shows an "Account" link to /login.
 * - Logged in (customer): shows display name + sign-out icon.
 * - Logged in (admin): shows display name + Dashboard link + sign-out icon.
 *   The Dashboard link is a fallback for admins who land on the storefront
 *   and need to navigate back to the admin panel.
 */
export function UserHeaderActions({ className }: UserHeaderActionsProps) {
  const { isLoggedIn, displayName, role, signOut } = useAuthUser();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  if (!isLoggedIn) {
    return (
      <Link to="/login" className={className}>
        Account
      </Link>
    );
  }

  return (
    <>
      <span className={`user-header-identity${className ? ` ${className}` : ''}`}>
        <span className="user-header-name">{displayName}</span>

        {role === 'admin' && (
          <Link
            to="/admin/dashboard"
            className="user-header-admin-link"
            aria-label="Go to admin dashboard"
            title="Admin Dashboard"
          >
            <HugeiconsIcon icon={DashboardSquare03Icon} size={17} strokeWidth={1.5} />
            <span className="user-header-admin-label">Dashboard</span>
          </Link>
        )}

        <button
          type="button"
          className="user-header-signout"
          aria-label="Sign out"
          title="Sign out"
          onClick={() => setShowLogoutDialog(true)}
        >
          <SignOut size={18} weight="regular" />
        </button>
      </span>

      <LogoutConfirmDialog
        isOpen={showLogoutDialog}
        displayName={displayName}
        onConfirm={async () => {
          setShowLogoutDialog(false);
          await signOut();
        }}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </>
  );
}

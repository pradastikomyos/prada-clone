import { useState } from 'react';
import { Link } from 'react-router-dom';
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
 * - Guest: shows an "Account" link to /login.html.
 * - Logged in: shows the user's display name + a sign-out icon button.
 *   Clicking the icon opens a confirmation dialog before signing out.
 */
export function UserHeaderActions({ className }: UserHeaderActionsProps) {
  const { isLoggedIn, displayName, signOut } = useAuthUser();
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

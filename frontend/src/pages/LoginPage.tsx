import { FormEvent, useMemo, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons';
import { BrandLogo } from '../components/ui/BrandLogo';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { getUserRole, resolvePostLoginPath } from '../services/auth';

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignup = mode === 'signup';
  const requestedRedirect = useMemo(() => new URLSearchParams(window.location.search).get('redirect'), []);

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault();
    setAuthError(null);
    setStatusMessage(null);

    if (!supabase || !isSupabaseConfigured) {
      setAuthError('Supabase env belum tersedia.');
      return;
    }

    setIsSubmitting(true);

    try {
      let userId: string | undefined;

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        userId = data.user?.id;
        setStatusMessage('Account created. You can continue.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        userId = data.user?.id;
      }

      const role = userId ? await getUserRole(userId) : null;
      window.location.href = resolvePostLoginPath(role, requestedRedirect);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <header className="login-logo"><a href="index.html" aria-label="Spark Stage home"><BrandLogo /></a></header>
        <main className="login-form-area">
          <h2 className="login-heading">LOG IN OR SIGN UP</h2>
          <form className="login-form" onSubmit={submitAuth}>
            <div className="field">
              <label htmlFor="email">E-MAIL</label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="field field-password">
              <label htmlFor="password">{isSignup ? 'CREATE PASSWORD' : 'PASSWORD'}</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>
                  <HugeiconsIcon icon={showPassword ? ViewOffIcon : ViewIcon} size={22} strokeWidth={1.5} />
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="btn-continue"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'PLEASE WAIT' : isSignup ? 'CREATE ACCOUNT' : 'LOG IN'}
            </button>
            {authError ? <p className="login-message login-message-error">{authError}</p> : null}
            {statusMessage ? <p className="login-message login-message-success">{statusMessage}</p> : null}
            <p className="toggle-text">
              {isSignup ? 'Already have an account? ' : "Don't have an account? "}
              <button type="button" className="toggle-link" onClick={() => {
                setMode(isSignup ? 'login' : 'signup');
                setShowPassword(false);
                setPassword('');
                setAuthError(null);
                setStatusMessage(null);
              }}>{isSignup ? 'Log in' : 'Sign up'}</button>
            </p>
          </form>
          <div className="divider"><span>ACCESS WITH</span></div>
          <p className="sso-disclaimer">By using social media login, I agree to link my account in accordance with the <button type="button" className="inline-link is-placeholder" aria-disabled="true" data-ui="placeholder">Privacy Policy</button>.</p>
          <button className="btn-sso" type="button">CONTINUE WITH GOOGLE</button>
          <button className="btn-sso" type="button">CONTINUE WITH APPLE</button>
        </main>
        <footer className="login-help"><button type="button" className="inline-link is-placeholder" aria-disabled="true" data-ui="placeholder">HELP</button></footer>
      </div>
      <div className="login-right">
        <img src="/assets/reference/zara/login/editorial.jpg" alt="Fashion Editorial" />
      </div>
    </div>
  );
}

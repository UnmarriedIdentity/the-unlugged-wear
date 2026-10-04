'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mail, Eye, EyeOff, Check, CircleX, CircleCheck, ArrowRight } from 'lucide-react';
// Class map - selectors live in src/app/globals.css (single app.css, login- prefix).
// Verbatim port of LoginPage.module.css; JSX untouched for zero pixel drift.
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'login-' + String(p) });

type AuthView = 'login' | 'reset-password' | 'recovery-sent';
type StateMode = 'default' | 'filled' | 'error' | 'reset' | 'recovery';

interface LoginPageProps {
  initialMode?: StateMode;
}

function LoginPageContent({ initialMode }: LoginPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stateParam = searchParams.get('state') as StateMode | null;

  const [view, setView] = useState<AuthView>('login');
  const [currentMode, setCurrentMode] = useState<StateMode>(initialMode || 'default');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Apply a specific Figma state mode
  const applyState = (mode: StateMode) => {
    setCurrentMode(mode);
    if (mode === 'default') {
      setView('login');
      setEmail('');
      setPassword('');
      setRememberMe(false);
      setHasError(false);
    } else if (mode === 'filled') {
      setView('login');
      setEmail('contactstylehub@gmail.com');
      setPassword('stylehubforlyfe');
      setRememberMe(true);
      setHasError(false);
    } else if (mode === 'error') {
      setView('login');
      setEmail('contactstylehub@gmail.com');
      setPassword('stylehubforlyfe');
      setRememberMe(false);
      setHasError(true);
    } else if (mode === 'reset') {
      setView('reset-password');
      setEmail('');
      setHasError(false);
    } else if (mode === 'recovery') {
      setView('recovery-sent');
      setHasError(false);
    }
  };

  // Synchronize state if URL query param or initialMode is provided
  useEffect(() => {
    if (stateParam) {
      applyState(stateParam);
    } else if (initialMode) {
      applyState(initialMode);
    }
  }, [stateParam, initialMode]);

  // Keyboard shortcut listener to easily simulate any Figma frame:
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === '1') applyState('default');
        if (e.key === '2') applyState('filled');
        if (e.key === '3') applyState('error');
        if (e.key === '4') applyState('reset');
        if (e.key === '5') applyState('recovery');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !email) {
      // Simulate exact Figma 1:20725 Wrong Password state
      applyState('error');
    } else if (password === 'wrong' || password === 'error') {
      applyState('error');
    } else {
      setHasError(false);
      router.push('/dashboard');
    }
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyState('recovery');
  };

  const isEmailActive = email.length > 0;

  return (
    <main className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-white max-lg:flex-col">
      {/* ==========================================================================
          LEFT HERO SECTION (Frame 124 - Width 712px, Height 1024px)
          ========================================================================== */}

      {/* ==========================================================================
          LEFT HERO SECTION (Frame 124 - Width 712px, Height 1024px)
          ========================================================================== */}
      <section className="relative flex min-h-screen w-[49.444%] flex-[0_0_49.444%] flex-col justify-end overflow-hidden bg-auth-hero max-lg:h-[420px] max-lg:min-h-[420px] max-lg:w-full max-lg:flex-none">
        <Image
          src="/images/login-hero.png"
          alt="Retail Storeflow Dashboard Owners"
          fill
          priority
          sizes="(max-width: 900px) 100vw, 50vw"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        {/* Rectangle 96: Linear gradient overlay on bottom 50% */}
        <div className={styles.heroOverlay} />

        {/* Frame 60511: Brand, Headline, Subtitle */}
        <div className="relative z-2 flex flex-col gap-4 px-14 pb-17 text-white max-lg:px-6 max-lg:pb-8">
          <div className={styles.brandTitle}>Storeflow</div>
          <h1 className={styles.heroHeadline}>
            Command Your{'\n'}Business with{'\n'}Confidence.
          </h1>
          <p className={styles.heroSubtitle}>
            Experience a new standard of efficiency through an intelligent, beautifully designed admin dashboard.
          </p>
        </div>
      </section>

      {/* ==========================================================================
          RIGHT AUTH SECTION (Frame 140 - Width 728px, Height 1024px)
          ========================================================================== */}
      <section className="relative flex min-h-screen w-[50.556%] flex-[0_0_50.556%] flex-col items-center justify-center overflow-y-auto bg-white bg-no-repeat py-[clamp(24px,4vh,48px)] px-6 max-lg:w-full max-lg:flex-none max-lg:px-5 max-lg:py-9 bg-[radial-gradient(circle_520px_at_78%_5%,rgba(229,245,211,0.6)_0%,rgba(255,255,255,0)_100%),radial-gradient(circle_420px_at_98%_8%,rgba(246,198,54,0.1)_0%,rgba(229,245,211,0.05)_50%,rgba(255,255,255,0)_100%)]">
        <div className="flex w-full max-w-auth-form flex-col items-center">
          {/* Header Block: Frame 3 Logo Badge + Title */}
          <header className={styles.headerBlock}>
            <div className={styles.logoBadge}>
              <Image
                src="/logos/tuw-stag-white.png"
                alt="The Unplugged Wear"
                width={27}
                height={27}
                className={styles.logoMonogram}
              />
            </div>

            {view === 'login' && (
              <>
                <h2 className={styles.formTitle}>Log in or Sign up</h2>
                <p className={styles.formSubtitle}>Welcome to Storeflow</p>
              </>
            )}

            {view === 'reset-password' && (
              <h2 className={styles.formTitle} style={{ color: 'var(--color-auth-pure)' }}>
                Reset password
              </h2>
            )}

            {view === 'recovery-sent' && (
              <h2
                className={styles.formTitle}
                style={{
                  fontSize: '24px',
                  lineHeight: '28.8px',
                  letterSpacing: '0.72px',
                  color: 'var(--color-auth-pure)',
                }}
              >
                Reset password
              </h2>
            )}
          </header>

          {/* ==========================================================================
              STATE 1 & 2 & 3: LOGIN FORM (Frames 1:20816, 1:20776, 1:20725)
              ========================================================================== */}
          {view === 'login' && (
            <>
              {/* Frame 139: Social Login Buttons */}
              <div className="grid w-full max-w-auth-form grid-cols-2 gap-6 mb-auth-field-gap">
                <button
                  type="button"
                  className="flex h-13 w-full items-center gap-2 rounded-auth-social border border-auth-line bg-white px-3.5 select-none transition-colors duration-200 hover:border-auth-line-hover hover:bg-auth-canvas"
                  onClick={() => applyState('filled')}
                  id="apple-login-btn"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-auth-check-line bg-white">
                    <Image
                      src="/images/apple-logo.png"
                      alt="Apple"
                      width={18}
                      height={18}
                      className="h-4.5 w-4.5 object-contain"
                    />
                  </div>
                  <span className="text-auth-social font-medium tracking-auth-social text-auth-ink whitespace-nowrap">Use Apple</span>
                </button>

                <button
                  type="button"
                  className="flex h-13 w-full items-center gap-2 rounded-auth-social border border-auth-line bg-white px-3.5 select-none transition-colors duration-200 hover:border-auth-line-hover hover:bg-auth-canvas"
                  onClick={() => applyState('filled')}
                  id="google-login-btn"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-auth-check-line bg-white">
                    <Image
                      src="/images/google-logo.png"
                      alt="Google"
                      width={16}
                      height={16}
                      className="h-4 w-4 object-contain"
                    />
                  </div>
                  <span className="text-auth-social font-medium tracking-auth-social text-auth-ink whitespace-nowrap">Use Google</span>
                </button>
              </div>

              {/* Frame 136: Divider */}
              <div className="flex w-full max-w-auth-form items-center justify-between gap-4 mb-auth-field-gap">
                <div className="h-px flex-1 bg-auth-divider" />
                <span className="shrink-0 px-6 text-center text-auth-divider font-normal text-auth-muted">Or</span>
                <div className="h-px flex-1 bg-auth-divider" />
              </div>

              {/* Login Form */}
              <form className="flex w-full max-w-auth-form flex-col" onSubmit={handleLoginSubmit} noValidate>
                {/* Frame 129: Email Field */}
                <div className="flex w-full flex-col mb-auth-field-gap">
                  <label htmlFor="email-input" className="text-auth-social font-medium tracking-auth-social text-auth-ink mb-2 text-left">
                    Email
                  </label>
                  <div
                    className={`flex h-12 w-full items-center gap-2.5 rounded-xl border bg-white px-4 transition-colors duration-200 ${isEmailActive ? 'border-auth-teal' : 'border-auth-line'}`}
                  >
                    <input
                      id="email-input"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (hasError) setHasError(false);
                      }}
                      placeholder="Enter your email here"
                      className={`h-full w-full flex-1 border-none bg-transparent tracking-auth-input text-auth-ink placeholder:text-auth-faint placeholder:text-sm ${email ? 'text-auth-input-filled tracking-auth-input-filled' : 'text-auth-input'}`}
                      autoComplete="email"
                    />
                    <div className="flex items-center justify-center shrink-0 text-auth-faint">
                      <Mail size={20} strokeWidth={1.5} />
                    </div>
                  </div>
                </div>

                {/* Frame 130: Password Field & Remember Me */}
                <div className="flex w-full flex-col mb-auth-field-gap">
                  <label htmlFor="password-input" className="text-auth-social font-medium tracking-auth-social text-auth-ink mb-2 text-left">
                    Password
                  </label>
                  <div
                    className={`flex h-12 w-full items-center gap-2.5 rounded-xl border bg-white px-4 transition-colors duration-200 ${hasError ? 'border-auth-error bg-auth-error-bg' : 'border-auth-line'}`}
                  >
                    <input
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (hasError) setHasError(false);
                      }}
                      placeholder="Input your password"
                      className={`h-full w-full flex-1 border-none bg-transparent tracking-auth-input text-auth-ink placeholder:text-auth-faint placeholder:text-sm ${password ? 'text-auth-input-filled tracking-auth-input-filled' : 'text-auth-input'}`}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="flex items-center justify-center p-0.5 text-auth-faint transition-colors duration-150 hover:text-auth-ink"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      id="toggle-password-btn"
                    >
                      {showPassword ? (
                        <Eye size={20} strokeWidth={1.5} />
                      ) : (
                        <EyeOff size={20} strokeWidth={1.5} />
                      )}
                    </button>
                  </div>

                  {/* Frame 281 in 1:20725: Password comparison error */}
                  {hasError && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-auth-input tracking-auth-input text-auth-error" id="password-error">
                      <CircleX size={16} strokeWidth={1.0} className="shrink-0 text-auth-error" />
                      <span>Password comparisson failed</span>
                    </div>
                  )}
                </div>

                {/* Frame 132: Remember Me Checkbox */}
                <div
                  className={styles.rememberRow}
                  onClick={() => setRememberMe(!rememberMe)}
                  id="remember-me-toggle"
                >
                  <div
                    className={`${styles.checkboxBox} ${
                      rememberMe ? styles.checkboxBoxChecked : ''
                    }`}
                  >
                    {rememberMe && <Check size={12} strokeWidth={3} color="currentColor" className="text-white" />}
                  </div>
                  <span className={styles.rememberText}>Remember me</span>
                </div>

                {/* Primary_button in Figma: 568x48, radius 12px, fill auth-ink token */}
                <button type="submit" className="flex h-12 w-full max-w-auth-form items-center justify-center rounded-xl bg-auth-ink text-auth-btn font-bold text-white select-none transition-colors duration-150 hover:bg-auth-ink-hover" id="login-submit-btn">
                  Log in
                </button>
              </form>

              {/* Frame 133: Forgot Password Link */}
              <div className={styles.forgotPasswordRow}>
                Did you forget your password?{' '}
                <span
                  className={styles.resetLink}
                  onClick={() => applyState('reset')}
                  id="goto-reset-btn"
                >
                  Reset password
                </span>
              </div>

              {/* Sign up for free: 568x48, radius auth-btn token, 16px 700 */}
              <Link
                href="/signup"
                className="flex h-12 w-full max-w-auth-form cursor-pointer items-center justify-center rounded-auth-btn text-auth-btn font-bold text-auth-ink no-underline select-none transition-opacity duration-150 hover:opacity-75"
                id="signup-link-btn"
              >
                Sign up for free
              </Link>
            </>
          )}

          {/* ==========================================================================
              STATE 4: RESET PASSWORD (Frame 1:20710)
              Card width: 552px, radius: 20px, fill: surface token, stroke: auth-line token
              ========================================================================== */}
          {view === 'reset-password' && (
            <div className={styles.resetCard}>
              <form className={styles.form} onSubmit={handleResetSubmit}>
                <div className={styles.fieldGroup} style={{ marginBottom: '24px' }}>
                  <label
                    htmlFor="reset-email-input"
                    className={styles.fieldLabel}
                    style={{ fontWeight: 600, letterSpacing: '0.28px' }}
                  >
                    Email
                  </label>
                  <div className={styles.resetInputWrapper}>
                    <input
                      id="reset-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email here"
                      className={styles.resetInput}
                      required
                    />
                    <div className={styles.inputIcon}>
                      <Mail size={20} strokeWidth={1.5} />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex h-12 w-full max-w-auth-reset items-center justify-center rounded-xl bg-auth-ink text-auth-btn font-bold text-white select-none transition-colors duration-150 hover:bg-auth-ink-hover"
                  id="reset-submit-btn"
                >
                  Reset password
                </button>
              </form>

              <div
                className={styles.backLink}
                onClick={() => applyState('default')}
              >
                Back to log in
              </div>
            </div>
          )}

          {/* ==========================================================================
              STATE 5: RECOVERY EMAIL SENT (Frame 1:20690)
              Card width: 552px, radius: 24px, fill: surface token, stroke: auth-line token
              ========================================================================== */}
          {view === 'recovery-sent' && (
            <div className={styles.recoveryCard}>
              {/* Frame 281: Success pill badge */}
              <div className={styles.recoveryPill}>
                <CircleCheck size={20} strokeWidth={1.5} color="currentColor" className="text-auth-success" />
                <span>Sending password reset link was successful</span>
              </div>

              {/* Frame 283: Headline & Description */}
              <div className={styles.recoveryTextBlock}>
                <h3 className={styles.recoveryHeading}>
                  The recovery email was sent successfully!
                </h3>
                <p className={styles.recoveryDescription}>
                  Check your e-mail and click on the link, where you will able to change your password.
                </p>
              </div>

              {/* Primary_button: Back to login */}
              <button
                type="button"
                className="flex h-12 w-full max-w-auth-recovery items-center justify-center rounded-xl bg-auth-ink text-auth-btn font-bold text-white select-none transition-colors duration-150 hover:bg-auth-ink-hover"
                onClick={() => applyState('default')}
                id="back-to-login-btn"
              >
                Back to login
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function LoginPage({ initialMode }: LoginPageProps) {
  return (
      <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--color-surface)' }} />}>
      <LoginPageContent initialMode={initialMode} />
    </Suspense>
  );
}

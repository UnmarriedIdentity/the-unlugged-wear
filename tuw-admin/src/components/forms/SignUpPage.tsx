'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Mail, UserRound, ArrowLeft } from 'lucide-react';
// Class map - selectors live in src/app/globals.css (single app.css, signup- prefix).
// Verbatim port of SignUpPage.module.css; JSX untouched for zero pixel drift.
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'signup-' + String(p) });

type SignUpStateMode = 'default' | 'filled' | 'verify-empty' | 'verify-filled';

interface SignUpPageProps {
  initialMode?: SignUpStateMode;
  initialStep?: number;
}

function SignUpPageContent({ initialMode }: SignUpPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active view: 'signup' or 'verify'
  const [view, setView] = useState<'signup' | 'verify'>('signup');
  const [currentMode, setCurrentMode] = useState<SignUpStateMode>(initialMode || 'default');

  // Form Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // OTP Fields (4 digits)
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Apply state based on Figma frames
  const applyState = (mode: SignUpStateMode) => {
    setCurrentMode(mode);

    if (mode === 'default') {
      setView('signup');
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setAgreeTerms(false);
      setOtp(['', '', '', '']);
    } else if (mode === 'filled') {
      setView('signup');
      setUsername('Jessicha Smith');
      setEmail('jessichasmith94@gmail.com');
      setPassword('••••••••••••');
      setConfirmPassword('••••••••••••');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setAgreeTerms(true);
      setOtp(['', '', '', '']);
    } else if (mode === 'verify-empty') {
      setView('verify');
      setOtp(['', '', '', '']);
    } else if (mode === 'verify-filled') {
      setView('verify');
      setOtp(['3', '3', '4', '2']);
    }
  };

  // Synchronize state with URL query param ?state=... or initialMode prop
  useEffect(() => {
    const stateParam = searchParams.get('state');
    if (stateParam === 'filled') {
      applyState('filled');
    } else if (stateParam === 'verify' || stateParam === 'verify-empty') {
      applyState('verify-empty');
    } else if (stateParam === 'verify-filled' || stateParam === 'enter-code') {
      applyState('verify-filled');
    } else if (stateParam === 'default') {
      applyState('default');
    } else if (initialMode) {
      applyState(initialMode);
    } else {
      applyState('default');
    }
  }, [searchParams, initialMode]);

  // Handle Form Submit -> Goes to Verification
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setView('verify');
    setCurrentMode('verify-empty');
  };

  // OTP Input Handlers
  const handleOtpChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    const newOtp = [...otp];

    if (cleaned.length > 1) {
      // Pasting multiple digits
      const digits = cleaned.slice(0, 4).split('');
      for (let i = 0; i < 4; i++) {
        newOtp[i] = digits[i] || '';
      }
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 3);
      otpInputsRef.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = cleaned;
    setOtp(newOtp);

    // Auto-advance
    if (cleaned && index < 3) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  return (
    <main className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-white text-auth-ink relative max-[900px]:flex-col max-[900px]:overflow-y-auto">
      {/* ==========================================================================
          LEFT HERO SECTION (Frame 124 - Width 712px, Height 1024px)
          ========================================================================== */}
      <section className="relative flex h-full min-h-screen w-[49.444%] flex-[0_0_49.444%] flex-col justify-end overflow-hidden bg-auth-hero max-[900px]:h-[320px] max-[900px]:min-h-[320px] max-[900px]:w-full max-[900px]:flex-none">
        <Image
          src="/images/signup-hero.png"
          alt="Retail Storeflow Team Members"
          fill
          priority
          sizes="(max-width: 900px) 100vw, 50vw"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        {/* Rectangle 96: Linear gradient overlay on bottom half */}
        <div className={styles.heroOverlay} />

        {/* Frame 60511: Brand Mark, Headline, Subtitle */}
        <div className="relative z-2 flex flex-col gap-[clamp(8px,1.4vh,16px)] px-[clamp(24px,3.88vw,56px)] pb-[clamp(24px,4.5vh,68px)] max-w-[600px] max-[900px]:px-6 max-[900px]:pb-7">
          <div className="text-auth-signup-brand font-bold leading-auth-headline text-white">Storeflow</div>
          <h1 className="text-auth-signup-headline font-bold leading-auth-signup-headline tracking-auth-title text-white whitespace-pre-line max-w-auth-hero-copy m-0">
            All your store{'\n'}essentials{'\n'}in one place
          </h1>
          <p className="text-auth-signup-sub font-medium tracking-auth-signup-sub text-white opacity-90 m-0 max-w-auth-hero-copy">
            Experience a new standard of efficiency through an intelligent, beautifully designed admin dashboard.
          </p>
        </div>
      </section>

      {/* ==========================================================================
          RIGHT AUTH SECTION (Frame 140 - Width 728px, Height 1024px)
          ========================================================================== */}
      <section className="relative flex h-screen w-[50.556%] flex-[0_0_50.556%] flex-col items-center justify-center overflow-y-auto overflow-x-hidden bg-white bg-no-repeat py-[clamp(16px,2.5vh,40px)] px-[clamp(20px,3vw,48px)] bg-[radial-gradient(circle_520px_at_78%_5%,rgba(229,245,211,0.6)_0%,rgba(255,255,255,0)_100%),radial-gradient(circle_420px_at_98%_8%,rgba(246,198,54,0.1)_0%,rgba(229,245,211,0.05)_50%,rgba(255,255,255,0)_100%)] max-[900px]:h-auto max-[900px]:min-h-auto max-[900px]:w-full max-[900px]:flex-none max-[900px]:px-5 max-[900px]:pt-9 max-[900px]:pb-15">
        <div className="flex w-full max-w-auth-form flex-col my-auto">
          {/* ==========================================================================
              VIEW 1: SIGN UP FORM (Figma 1:20984 & 1:20920)
              ========================================================================== */}
          {view === 'signup' && (
            <>
              {/* Header: Frame 128 (Badge + Title + Subtitle) */}
              <header className="flex flex-col items-center text-center gap-[clamp(8px,1.2vh,14px)] mb-[clamp(12px,2vh,24px)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-auth-button">
                  <Image
                    src="/logos/tuw-stag-white.png"
                    alt="The Unplugged Wear"
                    width={27}
                    height={27}
                    className="h-[25px] w-[25px] object-contain"
                  />
                </div>
                <h2 className="text-auth-signup-title font-semibold text-auth-ink tracking-auth-title m-0">Create an account</h2>
                <div className="flex items-center justify-center gap-1.5 text-auth-subrow text-auth-muted m-0">
                  <span>Already have an account?</span>
                  <Link href="/login" className="text-auth-teal font-semibold no-underline cursor-pointer transition-opacity duration-150 hover:opacity-80 hover:underline" id="link-to-login">
                    Login
                  </Link>
                </div>
              </header>

                {/* Form Body: Frame 135 */}
                <div className="flex w-full flex-col gap-[clamp(12px,1.8vh,20px)]">
                {/* Social Login Buttons: Apple & Google (Frame 139) */}
                <div className="grid grid-cols-2 gap-[clamp(12px,1.5vw,24px)]">
                  <button
                    type="button"
                    className="flex h-12 items-center justify-center gap-2 rounded-auth-social border border-auth-line bg-white px-3.5 py-2 cursor-pointer transition-all duration-200 hover:bg-auth-hover-canvas hover:border-auth-hover-line"
                    onClick={() => applyState('filled')}
                    id="signup-apple-btn"
                  >
                    <div className="flex h-7.5 w-7.5 items-center justify-center rounded-full border border-auth-line bg-white">
                      <Image
                        src="/images/apple-logo.png"
                        alt="Apple"
                        width={18}
                        height={18}
                      />
                    </div>
                    <span className="text-[14px] font-medium tracking-auth-social text-auth-ink">Use Apple</span>
                  </button>

                  <button
                    type="button"
                    className="flex h-12 items-center justify-center gap-2 rounded-auth-social border border-auth-line bg-white px-3.5 py-2 cursor-pointer transition-all duration-200 hover:bg-auth-hover-canvas hover:border-auth-hover-line"
                    onClick={() => applyState('filled')}
                    id="signup-google-btn"
                  >
                    <div className="flex h-7.5 w-7.5 items-center justify-center rounded-full border border-auth-line bg-white">
                      <Image
                        src="/images/google-logo.png"
                        alt="Google"
                        width={16}
                        height={16}
                      />
                    </div>
                    <span className="text-[14px] font-medium tracking-auth-social text-auth-ink">Use Google</span>
                  </button>
                </div>

                {/* Divider: Or (Frame 136) */}
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-auth-line" />
                  <span className="text-sm font-medium text-auth-divider">Or</span>
                  <div className="h-px flex-1 bg-auth-line" />
                </div>

                {/* Sign Up Form Inputs */}
                <form onSubmit={handleSignUpSubmit} id="signup-form">
                  <div className="flex flex-col gap-[clamp(8px,1.2vh,14px)]">
                    {/* 1. Username Field */}
                    <div className="flex flex-col gap-[5px]">
                      <label htmlFor="signup-username" className="text-sm font-medium tracking-auth-social text-auth-ink">
                        Username
                      </label>
                      <div className="relative flex w-full items-center">
                        <input
                          id="signup-username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Enter your name here"
                          className="w-full h-11.5 py-2.5 pl-4 pr-11 border border-auth-line rounded-xl bg-white outline-none text-auth-signup-input tracking-auth-signup-input text-auth-ink placeholder:text-auth-faint placeholder:font-normal transition-all duration-200 focus:border-auth-teal focus:shadow-auth-input"
                          required
                        />
                        <div className="absolute right-4 flex items-center justify-center text-auth-faint pointer-events-none">
                          <UserRound size={20} strokeWidth={1.5} />
                        </div>
                      </div>
                    </div>

                    {/* 2. Email Field */}
                    <div className="flex flex-col gap-[5px]">
                      <label htmlFor="signup-email" className="text-sm font-medium tracking-auth-social text-auth-ink">
                        Email
                      </label>
                      <div className="relative flex w-full items-center">
                        <input
                          id="signup-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email here"
                          className="w-full h-11.5 py-2.5 pl-4 pr-11 border border-auth-line rounded-xl bg-white outline-none text-auth-signup-input tracking-auth-signup-input text-auth-ink placeholder:text-auth-faint placeholder:font-normal transition-all duration-200 focus:border-auth-teal focus:shadow-auth-input"
                          required
                        />
                        <div className="absolute right-4 flex items-center justify-center text-auth-faint pointer-events-none">
                          <Mail size={20} strokeWidth={1.5} />
                        </div>
                      </div>
                    </div>

                    {/* 3. Create Password Field */}
                    <div className="flex flex-col gap-[5px]">
                      <label htmlFor="signup-password" className="text-sm font-medium tracking-auth-social text-auth-ink">
                        Create password
                      </label>
                      <div className="relative flex w-full items-center">
                        <input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Input your password"
                          className="w-full h-11.5 py-2.5 pl-4 pr-11 border border-auth-line rounded-xl bg-white outline-none text-auth-signup-input tracking-auth-signup-input text-auth-ink placeholder:text-auth-faint placeholder:font-normal transition-all duration-200 focus:border-auth-teal focus:shadow-auth-input"
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-4 flex items-center justify-center text-auth-faint bg-transparent border-0 cursor-pointer p-1 rounded-auth-checkbox transition-colors duration-150 hover:text-auth-ink"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <Eye size={20} strokeWidth={1.5} />
                          ) : (
                            <EyeOff size={20} strokeWidth={1.5} />
                          )}
                        </button>
                      </div>
                      <div className="text-xs text-auth-muted mt-0.5">
                        Use 8 or more characters, with number and symbol combinations
                      </div>
                    </div>

                    {/* 4. Confirm Password Field */}
                    <div className="flex flex-col gap-[5px]">
                      <label htmlFor="signup-confirm-password" className="text-sm font-medium tracking-auth-social text-auth-ink">
                        Confirm your password
                      </label>
                      <div className="relative flex w-full items-center">
                        <input
                          id="signup-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Input your password"
                          className="w-full h-11.5 py-2.5 pl-4 pr-11 border border-auth-line rounded-xl bg-white outline-none text-auth-signup-input tracking-auth-signup-input text-auth-ink placeholder:text-auth-faint placeholder:font-normal transition-all duration-200 focus:border-auth-teal focus:shadow-auth-input"
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-4 flex items-center justify-center text-auth-faint bg-transparent border-0 cursor-pointer p-1 rounded-auth-checkbox transition-colors duration-150 hover:text-auth-ink"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? (
                            <Eye size={20} strokeWidth={1.5} />
                          ) : (
                            <EyeOff size={20} strokeWidth={1.5} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Frame 1410130423: Checkbox & Submit Button */}
                  <div className={styles.footerActionsBlock}>
                    {/* 5. Terms of Use & Privacy Checkbox */}
                    <div
                      className={styles.termsRow}
                      onClick={() => setAgreeTerms(!agreeTerms)}
                      style={{ cursor: 'pointer' }}
                    >
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={agreeTerms}
                        className={`${styles.checkbox} ${agreeTerms ? styles.checkboxChecked : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setAgreeTerms(!agreeTerms);
                        }}
                        id="terms-checkbox"
                      >
                        {agreeTerms && (
                          <svg className={styles.checkboxIcon} viewBox="0 0 14 14" fill="none">
                            <path d="M2.5 7.5L5.5 10.5L11.5 3.5" />
                          </svg>
                        )}
                      </button>
                      <div className={styles.termsText}>
                        By creating an account you agree to the{' '}
                        <span className={styles.termsLink}>Term of use</span> and{' '}
                        <span className={styles.termsLink}>Privacy policy</span>
                      </div>
                    </div>

                    {/* 6. Primary Button: Sign Up */}
                    <button type="submit" className={styles.submitButton} id="signup-submit-btn">
                      Sign Up
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}

          {/* ==========================================================================
              VIEW 2: EMAIL VERIFICATION (Figma 1:20890 & 1:20856)
              ========================================================================== */}
          {view === 'verify' && (
            <div className={styles.verifyContainer}>
              {/* Header: Frame 128 (Badge + Title + Subtitle) */}
              <header className={styles.verifyHeaderBlock}>
                <div className={styles.logoBadge}>
                  <Image
                    src="/logos/tuw-stag-white.png"
                    alt="The Unplugged Wear"
                    width={27}
                    height={27}
                    className={styles.logoMonogram}
                  />
                </div>
                <h2 className={styles.verifyTitle}>Email verification code</h2>
                <p className={styles.verifySubtitle}>
                  We have sent verification code to your email
                </p>
              </header>

              {/* 4-Digit OTP Code Inputs Form (Frame 135) */}
              <form onSubmit={handleVerifySubmit} style={{ width: '100%' }}>
                {/* 4 OTP Input Boxes */}
                <div className={styles.otpRow} style={{ marginBottom: '32px' }}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputsRef.current[idx] = el;
                      }}
                      id={`otp-box-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className={`${styles.otpInput} ${digit ? styles.otpInputActive : ''}`}
                    />
                  ))}
                </div>

                {/* Verify Actions: Button + Resend + Back to login */}
                <div className={styles.verifyActions}>
                  <div className={styles.verifyPrimaryGroup}>
                    {/* Primary Button: Verify email */}
                    <button type="submit" className={styles.verifyButton} id="verify-email-btn">
                      Verify email
                    </button>

                    {/* Resend Code Prompt */}
                    <div className={styles.resendRow}>
                      <span>Don’t receive the email?</span>
                      <button
                        type="button"
                        className={styles.resendLink}
                        onClick={() => alert('Verification code resent to your email.')}
                        id="resend-code-btn"
                      >
                        Click to resend the code
                      </button>
                    </div>
                  </div>

                  {/* Secondary Button: Back to login */}
                  <Link href="/login" className={styles.backToLoginButton} id="back-to-login-btn">
                    Back to login
                  </Link>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function SignUpPage({ initialMode }: SignUpPageProps) {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#FFFFFF' }} />}>
      <SignUpPageContent initialMode={initialMode} />
    </Suspense>
  );
}

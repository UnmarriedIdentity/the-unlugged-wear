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
    <main className={styles.pageWrapper}>
      {/* ==========================================================================
          LEFT HERO SECTION (Frame 124 - Width 712px, Height 1024px)
          ========================================================================== */}
      <section className={styles.heroSection}>
        <Image
          src="/images/signup-hero.png"
          alt="Retail Storeflow Team Members"
          fill
          priority
          sizes="(max-width: 900px) 100vw, 50vw"
          className={styles.heroImage}
        />
        {/* Rectangle 96: Linear gradient overlay on bottom 50% */}
        <div className={styles.heroOverlay} />

        {/* Frame 60511: Brand Mark, Headline, Subtitle */}
        <div className={styles.heroContent}>
          <div className={styles.brandTitle}>Storeflow</div>
          <h1 className={styles.heroHeadline}>
            All your store{'\n'}essentials{'\n'}in one place
          </h1>
          <p className={styles.heroSubtitle}>
            Experience a new standard of efficiency through an intelligent, beautifully designed admin dashboard.
          </p>
        </div>
      </section>

      {/* ==========================================================================
          RIGHT AUTH SECTION (Frame 140 - Width 728px, Height 1024px)
          ========================================================================== */}
      <section className={styles.formSection}>
        <div className={styles.formContainer}>
          {/* ==========================================================================
              VIEW 1: SIGN UP FORM (Figma 1:20984 & 1:20920)
              ========================================================================== */}
          {view === 'signup' && (
            <>
              {/* Header: Frame 128 (Badge + Title + Subtitle) */}
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
                <h2 className={styles.formTitle}>Create an account</h2>
                <div className={styles.formSubtitleRow}>
                  <span>Already have an account?</span>
                  <Link href="/login" className={styles.loginLink} id="link-to-login">
                    Login
                  </Link>
                </div>
              </header>

              {/* Form Body: Frame 135 */}
              <div className={styles.formBody}>
                {/* Social Login Buttons: Apple & Google (Frame 139) */}
                <div className={styles.socialRow}>
                  <button
                    type="button"
                    className={styles.socialButton}
                    onClick={() => applyState('filled')}
                    id="signup-apple-btn"
                  >
                    <div className={styles.socialIconBadge}>
                      <Image
                        src="/images/apple-logo.png"
                        alt="Apple"
                        width={18}
                        height={18}
                      />
                    </div>
                    <span className={styles.socialText}>Use Apple</span>
                  </button>

                  <button
                    type="button"
                    className={styles.socialButton}
                    onClick={() => applyState('filled')}
                    id="signup-google-btn"
                  >
                    <div className={styles.socialIconBadge}>
                      <Image
                        src="/images/google-logo.png"
                        alt="Google"
                        width={16}
                        height={16}
                      />
                    </div>
                    <span className={styles.socialText}>Use Google</span>
                  </button>
                </div>

                {/* Divider: Or (Frame 136) */}
                <div className={styles.dividerRow}>
                  <div className={styles.dividerLine} />
                  <span className={styles.dividerText}>Or</span>
                  <div className={styles.dividerLine} />
                </div>

                {/* Sign Up Form Inputs */}
                <form onSubmit={handleSignUpSubmit} id="signup-form">
                  <div className={styles.formInputsWrapper}>
                    {/* 1. Username Field */}
                    <div className={styles.fieldGroup}>
                      <label htmlFor="signup-username" className={styles.fieldLabel}>
                        Username
                      </label>
                      <div className={styles.inputWrapper}>
                        <input
                          id="signup-username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Enter your name here"
                          className={styles.inputField}
                          required
                        />
                        <div className={styles.inputIcon}>
                          <UserRound size={20} strokeWidth={1.5} />
                        </div>
                      </div>
                    </div>

                    {/* 2. Email Field */}
                    <div className={styles.fieldGroup}>
                      <label htmlFor="signup-email" className={styles.fieldLabel}>
                        Email
                      </label>
                      <div className={styles.inputWrapper}>
                        <input
                          id="signup-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email here"
                          className={styles.inputField}
                          required
                        />
                        <div className={styles.inputIcon}>
                          <Mail size={20} strokeWidth={1.5} />
                        </div>
                      </div>
                    </div>

                    {/* 3. Create Password Field */}
                    <div className={styles.fieldGroup}>
                      <label htmlFor="signup-password" className={styles.fieldLabel}>
                        Create password
                      </label>
                      <div className={styles.inputWrapper}>
                        <input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Input your password"
                          className={styles.inputField}
                          required
                        />
                        <button
                          type="button"
                          className={styles.inputIconButton}
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
                      <div className={styles.helperText}>
                        Use 8 or more characters, with number and symbol combinations
                      </div>
                    </div>

                    {/* 4. Confirm Password Field */}
                    <div className={styles.fieldGroup}>
                      <label htmlFor="signup-confirm-password" className={styles.fieldLabel}>
                        Confirm your password
                      </label>
                      <div className={styles.inputWrapper}>
                        <input
                          id="signup-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Input your password"
                          className={styles.inputField}
                          required
                        />
                        <button
                          type="button"
                          className={styles.inputIconButton}
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

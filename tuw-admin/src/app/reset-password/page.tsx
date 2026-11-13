import LoginPage from '@/components/forms/LoginPage';

// Opened from the reset email (?token=…): set a new password.
export default function Page() {
  return <LoginPage initialMode="new-password" />;
}

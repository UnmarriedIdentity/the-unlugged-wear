import SignUpPage from '@/components/forms/SignUpPage';

// Staff accounts are invitation only: without an invite the page explains
// that and points to the login (TL-BE-02).
export default function Page() {
  return <SignUpPage initialMode="default" invite={null} />;
}

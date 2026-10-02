// Root layout — imports the SINGLE CSS file. Keep thin.
// TODO: add Urbanist next/font, SEO metadata, <Providers>.
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

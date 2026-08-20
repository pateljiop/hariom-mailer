import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hariom Builds Mailer',
  description: 'Private Gmail outreach mailer for Hariom Builds.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

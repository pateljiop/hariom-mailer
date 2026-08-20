import type { Metadata } from 'next';
import './globals.css';

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

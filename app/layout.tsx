import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GreenWin Order System',
  description: '果然盈點餐系統',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
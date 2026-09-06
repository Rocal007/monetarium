import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Monetarium — Algorithmic & Paper Trading Platform',
  description: 'Risikofreie Simulationsumgebung, Backtest-Hygiene & Quantitative Risikoanalyse',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="dark">
      <body className="bg-trading-bg text-trading-text min-h-screen flex flex-col selection:bg-trading-accent/30 selection:text-trading-accent">
        {children}
      </body>
    </html>
  );
}

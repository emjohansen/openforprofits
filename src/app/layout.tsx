import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans'; // Correct import for Geist Sans
// Removed GeistMono import as it's not found and likely not needed
import './globals.css';

export const metadata: Metadata = {
  title: 'Open For Profit', // Updated title
  description: 'Analyze the profitability of your business idea.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply Geist Sans font variable */}
      <body className={`${GeistSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}

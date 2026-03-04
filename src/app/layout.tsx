import type { Metadata } from 'next';
import './globals.css';
import { ChatProvider } from '@/components/ChatContext';

export const metadata: Metadata = {
  title: 'Eddy Chat',
  description: 'Local chat UI for Eddy',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ChatProvider>{children}</ChatProvider>
      </body>
    </html>
  );
}

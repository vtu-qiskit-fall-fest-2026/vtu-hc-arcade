import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { ProfileProvider } from '@/context/ProfileContext';
import { AuthGuard } from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'Q-IRRIGATE | Hybrid Quantum-Classical Smart Irrigation',
  description:
    'Sustainable agricultural irrigation scheduling platform powered by hybrid quantum-classical optimization and NASA POWER solar data.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="h-screen w-screen overflow-hidden flex bg-[#F7F6F0] text-[#181C1A] antialiased font-sans">
        <AuthProvider>
          <ProfileProvider>
            <SidebarProvider>
              <AuthGuard>{children}</AuthGuard>
            </SidebarProvider>
          </ProfileProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

'use client';

import { AuthProvider, useAuth } from '@/lib/auth';
import LoginScreen from '@/components/LoginScreen';
import AppShell from '@/components/AppShell';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <AppShell />;
}

export default function HomeContent() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

'use client';

import { useState } from 'react';
import type { TabType } from '@/lib/types';
import Dashboard from './Dashboard';
import SalaryScreen from './SalaryScreen';
import DebtsScreen from './DebtsScreen';
import GroceryScreen from './GroceryScreen';
import CadastrosScreen from './CadastrosScreen';
import { useAuth } from '@/lib/auth';
import { useFirestoreSync } from '@/lib/useFirestoreSync';
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  ShoppingCart,
  UserCog,
  LogOut,
  WalletIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'salary', label: 'Salário', icon: Wallet },
  { id: 'debts', label: 'Dívidas', icon: CreditCard },
  { id: 'grocery', label: 'Compras', icon: ShoppingCart },
  { id: 'cadastros', label: 'Cadastros', icon: UserCog },
];

export default function AppShell() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const { usuarioData, logout } = useAuth();

  // Sync Firestore data in real-time
  useFirestoreSync();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'salary':
        return <SalaryScreen />;
      case 'debts':
        return <DebtsScreen />;
      case 'grocery':
        return <GroceryScreen />;
      case 'cadastros':
        return <CadastrosScreen />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background app-container">
      {/* Header - Glass Morphism */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 glass-header">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center">
            <WalletIcon className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground tracking-tight">Gestão Financeira</h1>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
              Olá, {usuarioData?.nome || 'Usuário'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/8 rounded-xl"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto hide-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation - Glass Morphism */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 glass-nav pb-safe">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground/70'
                }`}
              >
                <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary/8' : ''}`}>
                  <Icon className={`h-4 w-4 transition-all duration-200 ${isActive ? 'scale-110' : ''}`} />
                </div>
                <span className={`text-[9px] font-medium transition-colors duration-200 leading-none ${isActive ? 'text-primary' : ''}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute -top-0 h-0.5 w-8 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

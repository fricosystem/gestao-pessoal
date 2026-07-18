'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Wallet, Mail, Lock, LogIn, UserPlus, User, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

type Screen = 'login' | 'cadastro';

export default function LoginScreen() {
  const { login, cadastrar } = useAuth();
  const [screen, setScreen] = useState<Screen>('login');

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lembrar, setLembrar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Cadastro form
  const [nome, setNome] = useState('');
  const [cadastroEmail, setCadastroEmail] = useState('');
  const [cadastroPassword, setCadastroPassword] = useState('');
  const [cadastroConfirm, setCadastroConfirm] = useState('');
  const [isCadastroLoading, setIsCadastroLoading] = useState(false);

  // Load "lembrar" preferences on mount
  useEffect(() => {
    const saved = localStorage.getItem('gastos-lembrar');
    const savedEmail = localStorage.getItem('gastos-email');
    if (saved === 'true' && savedEmail) {
      setLembrar(true);
      setEmail(savedEmail);
    }
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error('Preencha todos os campos', {
        description: 'E-mail e senha são obrigatórios.',
      });
      return;
    }
    setIsLoading(true);
    try {
      await login(email.trim(), password, lembrar);
      toast.success('Login realizado com sucesso!');
    } catch (err: unknown) {
      const message =
        err instanceof Error && 'code' in err
          ? mapFirebaseAuthError((err as { code: string }).code)
          : 'E-mail ou senha incorretos. Tente novamente.';
      toast.error('Erro no login', { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCadastro = async () => {
    if (!nome.trim() || !cadastroEmail.trim() || !cadastroPassword.trim()) {
      toast.error('Preencha todos os campos', {
        description: 'Nome, e-mail e senha são obrigatórios.',
      });
      return;
    }
    if (cadastroPassword.length < 6) {
      toast.error('Senha muito curta', {
        description: 'A senha deve ter no mínimo 6 caracteres.',
      });
      return;
    }
    if (cadastroPassword !== cadastroConfirm) {
      toast.error('Senhas não conferem', {
        description: 'A senha e a confirmação devem ser iguais.',
      });
      return;
    }
    setIsCadastroLoading(true);
    try {
      await cadastrar(nome.trim(), cadastroEmail.trim(), cadastroPassword);
      toast.success('Cadastro realizado com sucesso!', {
        description: 'Bem-vindo ao Gestão Financeira!',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error && 'code' in err
          ? mapFirebaseAuthError((err as { code: string }).code)
          : 'Erro ao criar conta. Tente novamente.';
      toast.error('Erro no cadastro', { description: message });
    } finally {
      setIsCadastroLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (screen === 'login') handleLogin();
      else handleCadastro();
    }
  };

  if (screen === 'cadastro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-background relative">
        <Card className="w-full max-w-sm premium-card-accent">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8 border border-primary/20 pulse-green">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground tracking-tight">
              Criar Conta
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-1.5">
              Cadastre-se para começar a gerenciar seus gastos
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Nome
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9 h-12 field-dark text-foreground"
                  placeholder="Seu nome completo"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cadastro-email" className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cadastro-email"
                  type="email"
                  value={cadastroEmail}
                  onChange={(e) => setCadastroEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9 h-12 field-dark text-foreground"
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cadastro-password" className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cadastro-password"
                  type="password"
                  value={cadastroPassword}
                  onChange={(e) => setCadastroPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9 h-12 field-dark text-foreground"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cadastro-confirm" className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Confirmar Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cadastro-confirm"
                  type="password"
                  value={cadastroConfirm}
                  onChange={(e) => setCadastroConfirm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9 h-12 field-dark text-foreground"
                  placeholder="Repita a senha"
                />
              </div>
            </div>
            <Button
              onClick={handleCadastro}
              disabled={isCadastroLoading}
              className="w-full h-12 btn-primary text-base mt-2"
            >
              {isCadastroLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Cadastrando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Criar Conta
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setScreen('login')}
              className="w-full h-10 text-muted-foreground hover:text-foreground text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Já tenho conta — Entrar
            </Button>
          </CardContent>
        </Card>
        {/* APEX HUB Footer - fixed bottom */}
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-1.5">
          <img
            src="/apex-hub-icon.png"
            alt="APEX HUB"
            className="h-4 w-4 rounded opacity-60"
          />
          <span className="text-[10px] text-muted-foreground/50 font-medium tracking-wide">
            Desenvolvido por APEX HUB
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-background relative">
      <Card className="w-full max-w-sm premium-card-accent">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8 border border-primary/20 pulse-green">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground tracking-tight">
            Gestão Financeira
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-1.5">
            Administração Financeira Pessoal
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              E-mail
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 h-12 field-dark text-foreground"
                placeholder="seu@email.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 h-12 field-dark text-foreground"
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="lembrar"
              checked={lembrar}
              onCheckedChange={(checked) => setLembrar(checked === true)}
              className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label
              htmlFor="lembrar"
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              Lembrar login
            </Label>
          </div>
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full h-12 btn-primary text-base mt-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Entrando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                Entrar
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setScreen('cadastro')}
            className="w-full h-10 text-muted-foreground hover:text-foreground text-sm"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Não tenho conta — Criar conta
          </Button>
        </CardContent>
      </Card>
      {/* APEX HUB Footer - fixed bottom */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-1.5">
        <img
          src="/apex-hub-icon.png"
          alt="APEX HUB"
          className="h-4 w-4 rounded opacity-60"
        />
        <span className="text-[10px] text-muted-foreground/50 font-medium tracking-wide">
          Desenvolvido por APEX HUB
        </span>
      </div>
    </div>
  );
}

function mapFirebaseAuthError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
      return 'Usuário não encontrado. Verifique o e-mail ou crie uma conta.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos. Tente novamente.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.';
    case 'auth/weak-password':
      return 'A senha é muito fraca. Use no mínimo 6 caracteres.';
    case 'auth/invalid-email':
      return 'E-mail inválido. Verifique o formato do e-mail.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um momento e tente novamente.';
    case 'auth/network-request-failed':
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    default:
      return 'Ocorreu um erro. Tente novamente.';
  }
}

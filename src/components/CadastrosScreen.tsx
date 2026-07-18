'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  User,
  Mail,
  Lock,
  Save,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function CadastrosScreen() {
  const { user, usuarioData } = useAuth();
  const [nome, setNome] = useState(usuarioData?.nome || '');
  const [hasChanges, setHasChanges] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleNomeChange = (value: string) => {
    setNome(value);
    setHasChanges(value !== (usuarioData?.nome || ''));
  };

  const handleSaveNome = async () => {
    if (!user || !nome.trim()) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'usuarios', user.uid), { nome: nome.trim() });
      setHasChanges(false);
      toast.success('Nome atualizado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar nome', { description: 'Tente novamente.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !currentPassword || !newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos', { description: 'Senha atual, nova senha e confirmação são obrigatórias.' });
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Senha muito curta', { description: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Senhas não conferem', { description: 'A nova senha e a confirmação devem ser iguais.' });
      return;
    }

    setIsSaving(true);
    try {
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      toast.success('Senha alterada com sucesso!');
    } catch (err: unknown) {
      const code = err instanceof Error && 'code' in err ? (err as { code: string }).code : '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        toast.error('Senha atual incorreta', { description: 'Verifique sua senha atual e tente novamente.' });
      } else {
        toast.error('Erro ao alterar senha', { description: 'Tente novamente mais tarde.' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 pb-24 space-y-4 hide-scrollbar overflow-y-auto">
      {/* Header */}
      <h2 className="text-lg font-bold text-foreground tracking-tight">Cadastros</h2>

      {/* Profile Card */}
      <Card className="premium-card-accent">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
            <div className="h-8 w-8 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            Meu Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-3 pb-3 border-b border-white/[0.06]">
            <div className="h-14 w-14 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center text-primary font-bold text-xl">
              {(usuarioData?.nome || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{usuarioData?.nome || 'Usuário'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Cadastrado em {usuarioData?.criadoEm ? new Date(usuarioData.criadoEm).toLocaleDateString('pt-BR') : '—'}
              </p>
            </div>
          </div>

          {/* Edit Name */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Nome</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={nome}
                onChange={(e) => handleNomeChange(e.target.value)}
                className="pl-9 h-11 field-dark text-foreground"
                placeholder="Seu nome completo"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={user?.email || ''}
                readOnly
                className="pl-9 h-11 field-dark text-muted-foreground cursor-not-allowed opacity-60"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">O e-mail não pode ser alterado</p>
          </div>

          {hasChanges && (
            <Button
              onClick={handleSaveNome}
              disabled={isSaving}
              className="w-full h-11 btn-primary"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Salvando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Salvar Nome
                </span>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card className="premium-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
            <div className="h-8 w-8 rounded-lg bg-[#ffb800]/8 border border-[#ffb800]/15 flex items-center justify-center">
              <Shield className="h-4 w-4 text-[#ffb800]" />
            </div>
            Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!showPasswordForm ? (
            <Button
              variant="outline"
              onClick={() => setShowPasswordForm(true)}
              className="w-full h-11 btn-ghost-premium"
            >
              <Lock className="h-4 w-4 mr-2" />
              Alterar Senha
            </Button>
          ) : (
            <div className="space-y-3 animate-fade-in">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Senha Atual</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pl-9 pr-10 h-11 field-dark text-foreground"
                    placeholder="Senha atual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-9 pr-10 h-11 field-dark text-foreground"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 h-11 field-dark text-foreground"
                    placeholder="Repita a nova senha"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={isSaving}
                  className="flex-1 h-11 btn-primary"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Alterando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Alterar Senha
                    </span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="h-11 btn-ghost-premium"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

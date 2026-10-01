'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { KeyRound, Save, X, Eye, EyeOff } from 'lucide-react';

interface PasswordResetModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

export function PasswordResetModal({ userId, userName, onClose }: PasswordResetModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: (newPassword: string) => 
      api.patch(`/users/${userId}`, { password: newPassword }),
    onSuccess: () => {
      alert('Password aggiornata con successo');
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      alert('La password deve essere di almeno 6 caratteri');
      return;
    }
    mutation.mutate(password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2">
              <KeyRound className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Reset Password</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <p className="mb-6 text-sm text-slate-600">
          Stai resettando la password per l'utente <span className="font-bold">{userName}</span>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nuova Password</label>
            <div className="relative">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm focus:border-amber-500 focus:outline-none"
                placeholder="Almeno 6 caratteri"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Aggiornamento...' : (
                <>
                  <Save className="h-4 w-4" />
                  Salva Nuova Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, KeyRound, Loader2, Lock, Mail } from 'lucide-react';
import { Button, Input, Label } from '@mockups/web-ui';

import { useAuth } from '../lib/auth-context';

// DEMO ONLY — remove this block (and the callout below the form) before
// wiring real authentication.
const DEMO_EMAIL = 'demo@qwipo.com';
const DEMO_PASSWORD = 'qwipo123';

export default function Login() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate('/promotions', { replace: true });
  }, [user, navigate]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = login(email, password);
    if (result.ok === false) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    navigate('/promotions');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center text-center">
            <h1 className="mt-5 text-2xl font-semibold text-gray-900">Sign in</h1>
            <p className="mt-1.5 text-sm text-gray-600">Welcome back to the Qwipo Marketing Platform.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                Email address
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@qwipo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={Boolean(error) || undefined}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-900">
                Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(error) || undefined}
                  className="pl-9 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full h-10" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Sign in
            </Button>
          </form>

          <div className="mt-4 rounded-lg border border-dashed border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-blue-900">Demo access</p>
                <p className="mt-1 text-xs leading-5 text-blue-700">
                  Email <span className="font-medium">{DEMO_EMAIL}</span> · Password <span className="font-medium">{DEMO_PASSWORD}</span>
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2.5 border-blue-200 bg-white text-blue-700 hover:bg-blue-100"
                  onClick={() => {
                    setEmail(DEMO_EMAIL);
                    setPassword(DEMO_PASSWORD);
                    setError(null);
                  }}
                >
                  Fill demo credentials
                </Button>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            Access is limited to the Qwipo marketing team. Contact your administrator if you need an account.
          </p>
        </div>
      </div>
    </div>
  );
}

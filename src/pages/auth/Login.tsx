import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Input, Card, CardContent } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { showError } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 mb-4 shadow-lg shadow-indigo-200">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">SplitX</h1>
          <p className="text-slate-500 mt-1">Split expenses smartly with friends</p>
        </div>

        <Card>
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-1">Welcome back</h2>
            <p className="text-sm text-slate-500 mb-6">Sign in to your account to continue</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                error={errors.email}
                autoComplete="email"
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  error={errors.password}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Button type="submit" loading={loading} className="w-full">
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Don't have an account?{' '}
                <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">
                  Create one
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-slate-400 text-center mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

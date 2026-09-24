import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Input, Card, CardContent } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { showError, showSuccess } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  function validate() {
    const newErrors: typeof errors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      await signUp(email, password, fullName.trim());
      showSuccess('Account created! Please check your email to confirm your account.');
      navigate('/login');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create account');
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
            <h2 className="text-xl font-semibold text-slate-900 mb-1">Create an account</h2>
            <p className="text-sm text-slate-500 mb-6">Get started for free</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="John Doe"
                error={errors.fullName}
                autoComplete="name"
              />

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
                  placeholder="At least 6 characters"
                  error={errors.password}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                error={errors.confirmPassword}
                autoComplete="new-password"
              />

              <Button type="submit" loading={loading} className="w-full">
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-slate-400 text-center mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

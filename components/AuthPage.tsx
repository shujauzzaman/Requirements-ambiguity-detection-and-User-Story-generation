
import React, { useState } from 'react';
import { AuthMode } from '../types';
import { Mail, Lock, User, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

interface AuthPageProps {
  onLogin: (email: string, name: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>(AuthMode.LOGIN);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Mock Authentication Logic
    setTimeout(() => {
      if (mode === AuthMode.LOGIN) {
        if (email === 'demo@example.com' && password === 'password') {
          onLogin(email, 'Demo User');
        } else {
          setError('Invalid email or password. Use demo@example.com / password');
        }
      } else if (mode === AuthMode.SIGNUP) {
        if (email && password && name) {
          onLogin(email, name);
        } else {
          setError('Please fill in all fields.');
        }
      } else {
        setResetSent(true);
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-2xl mb-4 border border-indigo-100 shadow-sm">
            <ShieldCheck className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">ReqAnalyzer AI</h1>
          <p className="text-slate-500 mt-2">Precision requirements for agile teams.</p>
        </div>

        <div className="glass bg-white/80 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">
            {mode === AuthMode.LOGIN && 'Welcome back'}
            {mode === AuthMode.SIGNUP && 'Create account'}
            {mode === AuthMode.RESET && 'Reset password'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {resetSent ? (
            <div className="text-center space-y-6">
              <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm">
                If an account exists for {email}, a reset link has been sent.
              </div>
              <button
                onClick={() => { setResetSent(false); setMode(AuthMode.LOGIN); }}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center justify-center w-full transition-colors"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === AuthMode.SIGNUP && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    required
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                  required
                />
              </div>

              {mode !== AuthMode.RESET && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                  <>
                    {mode === AuthMode.LOGIN && 'Sign In'}
                    {mode === AuthMode.SIGNUP && 'Create Account'}
                    {mode === AuthMode.RESET && 'Send Reset Link'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
            {mode === AuthMode.LOGIN && (
              <>
                <button
                  onClick={() => setMode(AuthMode.SIGNUP)}
                  className="text-slate-500 text-sm hover:text-indigo-600 transition-colors block w-full"
                >
                  Don't have an account? <span className="text-indigo-600 font-semibold">Sign up</span>
                </button>
                <button
                  onClick={() => setMode(AuthMode.RESET)}
                  className="text-slate-400 text-xs hover:text-indigo-600 transition-colors"
                >
                  Forgot your password?
                </button>
              </>
            )}
            {mode === AuthMode.SIGNUP && (
              <button
                onClick={() => setMode(AuthMode.LOGIN)}
                className="text-slate-500 text-sm hover:text-indigo-600 transition-colors block w-full"
              >
                Already have an account? <span className="text-indigo-600 font-semibold">Sign in</span>
              </button>
            )}
            {mode === AuthMode.RESET && !resetSent && (
              <button
                onClick={() => setMode(AuthMode.LOGIN)}
                className="text-slate-500 text-sm hover:text-indigo-600 transition-colors block w-full"
              >
                Remembered your password? <span className="text-indigo-600 font-semibold">Sign in</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

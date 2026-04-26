import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as loginApi } from '../api/api';
import { Lock, User, AlertCircle } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    localStorage.clear(); // Clear old tokens to avoid conflicts
    try {
      const data = await loginApi(username, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('username', data.username);
      
      if (data.role === 'MERCHANT') {
        navigate('/merchant');
      } else {
        navigate('/reviewer');
      }
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-primary-700 to-indigo-900">
      <div className="w-full max-w-md p-8 glass rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 mb-4 bg-primary-500 rounded-xl shadow-lg">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Playto Pay</h1>
          <p className="text-primary-100 mt-2">Sign in to your KYC portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="flex items-center p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-100 text-sm animate-shake">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-primary-100 mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-300 w-5 h-5" />
              <input
                type="text"
                required
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-100 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-300 w-5 h-5" />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-white text-primary-700 font-bold rounded-xl shadow-lg hover:bg-primary-50 transform transition active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-primary-200 text-sm">
          Don't have an account? <Link to="/signup" className="text-white font-bold hover:underline">Create Account</Link>
        </p>

        <div className="mt-8 pt-6 border-t border-white/10">
          <h3 className="text-[10px] font-bold text-primary-300 uppercase tracking-widest mb-4 text-center">Reviewer Demo Access</h3>
          <button 
            type="button"
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-all group flex justify-between items-center"
            onClick={() => { setUsername('reviewer1'); setPassword('password123'); }}
          >
            <div>
              <p className="text-[9px] font-bold text-primary-400 uppercase mb-1">Admin / Reviewer Role</p>
              <p className="text-sm text-white font-medium">reviewer1 <span className="text-primary-400 font-normal ml-2">/ password123</span></p>
            </div>
            <div className="text-[10px] text-primary-400 font-bold bg-white/5 px-2 py-1 rounded">Click to Auto-fill</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

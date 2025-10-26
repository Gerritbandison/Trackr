import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiMail, FiLock, FiPackage, FiShield, FiTrendingUp } from 'react-icons/fi';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login({ email, password });
    setLoading(false);
  };

  const quickLogin = async (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
    setLoading(true);
    await login({ email: userEmail, password: userPass });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <FiPackage className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Trackr ITAM</h1>
              <p className="text-primary-100 text-sm">Enterprise Asset Management</p>
            </div>
          </div>
          
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-white leading-tight mb-4">
                Complete IT Asset Lifecycle Management
              </h2>
              <p className="text-lg text-primary-100 leading-relaxed">
                Track, manage, and optimize your IT hardware, software licenses, and resources from a single, powerful platform.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <FiPackage className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Comprehensive Inventory</h3>
                  <p className="text-primary-100 text-sm">Full transparency over all assets, locations, and assignments</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <FiShield className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Compliance & Security</h3>
                  <p className="text-primary-100 text-sm">Audit trails, lifecycle tracking, and compliance reporting</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <FiTrendingUp className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Cost Optimization</h3>
                  <p className="text-primary-100 text-sm">Track spending, utilization, and identify cost savings</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-primary-100 text-sm">
          © 2024 Trackr ITAM. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full">
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center">
                <FiPackage className="text-white" size={20} />
              </div>
              <h1 className="text-3xl font-bold text-secondary-900">Trackr ITAM</h1>
            </div>
            <p className="text-secondary-600">Enterprise Asset Management</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-strong border border-gray-100 p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-secondary-900 mb-2">
                Welcome Back
              </h2>
              <p className="text-secondary-600">
                Sign in to access your asset management dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="admin@company.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3.5 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </span>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </form>

            {/* Quick Login Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm font-semibold text-secondary-600 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                Quick Login (Development Only)
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => quickLogin('sarah.johnson@company.com', 'password123')}
                  className="w-full px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm flex items-center justify-between group"
                  disabled={loading}
                >
                  <span className="flex items-center gap-2">
                    <span>👑</span>
                    <span>Login as Admin</span>
                  </span>
                  <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">Full access →</span>
                </button>
                <button
                  onClick={() =>
                    quickLogin('michael.chen@company.com', 'password123')
                  }
                  className="w-full px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm flex items-center justify-between group"
                  disabled={loading}
                >
                  <span className="flex items-center gap-2">
                    <span>🎯</span>
                    <span>Login as Manager</span>
                  </span>
                  <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">Manage assets →</span>
                </button>
                <button
                  onClick={() =>
                    quickLogin('emily.rodriguez@company.com', 'password123')
                  }
                  className="w-full px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium text-sm flex items-center justify-between group"
                  disabled={loading}
                >
                  <span className="flex items-center gap-2">
                    <span>👤</span>
                    <span>Login as Staff</span>
                  </span>
                  <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">View only →</span>
                </button>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white rounded-xl border border-gray-100">
              <div className="text-2xl font-bold text-primary-600 mb-1">500+</div>
              <div className="text-xs text-secondary-600">Assets Tracked</div>
            </div>
            <div className="text-center p-3 bg-white rounded-xl border border-gray-100">
              <div className="text-2xl font-bold text-emerald-600 mb-1">99%</div>
              <div className="text-xs text-secondary-600">Uptime SLA</div>
            </div>
            <div className="text-center p-3 bg-white rounded-xl border border-gray-100">
              <div className="text-2xl font-bold text-accent-600 mb-1">24/7</div>
              <div className="text-xs text-secondary-600">Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


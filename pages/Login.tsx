import React, { useState } from 'react';
import { Pill, Lock, User as UserIcon, PlayCircle, AlertCircle, LogIn } from 'lucide-react';
import { User } from '../types';
import { dataService } from '../services/dataService';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Supabase is now hardcoded in supabaseClient.ts, so config is always true
  const isConfigured = true;

  const handleDemoMode = () => {
    dataService.setDemoMode(true);
    onLogin({ username: 'admin', role: 'admin', name: 'Quản trị viên (Demo)' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await dataService.login(username, password);
      if (res.success && res.user) {
        onLogin(res.user);
      } else {
        setError(res.error || 'Đăng nhập thất bại');
      }
    } catch (e: any) {
      setError('Lỗi kết nối: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-white p-8 pb-0 text-center">
          <div className="inline-flex justify-center items-center p-4 bg-teal-50 rounded-full mb-4">
            <Pill className="h-8 w-8 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Chào mừng trở lại</h2>
          <p className="text-gray-500 mt-2 text-sm">Hệ thống quản lý Khoa Dược</p>
        </div>

        <div className="p-8 pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 p-3 rounded-lg text-red-600 text-xs flex items-center">
                <AlertCircle size={14} className="mr-2 flex-shrink-0" /> 
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Tên đăng nhập</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm transition-all"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white ${loading ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 hover:shadow-lg'} transition-all duration-200`}
            >
              {loading ? 'Đang xác thực...' : (
                <>
                  <LogIn size={18} className="mr-2" /> Đăng nhập
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <button 
               type="button"
               onClick={handleDemoMode}
               className="text-xs text-gray-500 hover:text-teal-600 hover:underline flex items-center justify-center w-full transition-colors"
            >
               <PlayCircle size={14} className="mr-1.5" /> Truy cập chế độ Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
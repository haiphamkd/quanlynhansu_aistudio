
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, Calendar, Wallet, FileBarChart, 
  Menu, LogOut, Pill, FileText, Star, Clock, AlertTriangle, Sparkles, Building, Settings
} from 'lucide-react';
import { MenuItem, User } from '../types';
import { dataService } from '../services/dataService';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: FileBarChart, path: '/' },
  { id: 'employees', label: 'Nhân sự', icon: Users, path: '/employees', allowedRoles: ['admin', 'manager'] },
  { id: 'shifts', label: 'Lịch trực', icon: Clock, path: '/shifts' },
  { id: 'attendance', label: 'Chấm công', icon: Calendar, path: '/attendance' },
  { id: 'funds', label: 'Quỹ Khoa', icon: Wallet, path: '/funds', allowedRoles: ['admin', 'manager'] },
  { id: 'reports', label: 'Báo cáo đơn', icon: Pill, path: '/reports' },
  { id: 'evaluation', label: 'Đánh giá năm', icon: Star, path: '/evaluation', allowedRoles: ['admin', 'manager'] },
  { id: 'proposals', label: 'Tờ trình', icon: FileText, path: '/proposals' },
  { id: 'categories', label: 'Danh mục', icon: Settings, path: '/categories', allowedRoles: ['admin', 'manager'] },
  { id: 'ai', label: 'Trợ lý AI', icon: Sparkles, path: '/ai-assistant', allowedRoles: ['admin', 'manager'] },
];

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const isDemo = dataService.isDemo();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const filteredMenu = MENU_ITEMS.filter(item => {
    if (!item.allowedRoles) return true;
    return item.allowedRoles.includes(user.role);
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive Drawer for Mobile / Fixed for Tablet+Desktop (md+) */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } flex flex-col shadow-lg md:shadow-none`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
          <div className="bg-teal-600 p-1.5 rounded-lg mr-3 shadow-sm">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-800 tracking-tight">PHARMA<span className="text-teal-600">HR</span></h1>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm border border-teal-200">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
              <div className="flex items-center text-[10px] text-gray-500 font-medium">
                 <span className="uppercase tracking-wide mr-1">{user.role}</span>
                 {user.department && <span className="truncate border-l border-gray-300 pl-1 text-teal-600">{user.department}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
          <nav className="space-y-1">
            {filteredMenu.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
                    isActive 
                      ? 'bg-teal-50 text-teal-700 shadow-sm ring-1 ring-teal-200' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
          <button 
            onClick={onLogout}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
        {/* Mobile Header (Hidden on md+) */}
        <header className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-10 sticky top-0 shadow-sm">
          <button onClick={toggleSidebar} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-gray-800 text-lg">PharmaHR</span>
          <div className="w-6" /> 
        </header>

        {/* Demo Banner */}
        {isDemo && (
          <div className="bg-amber-50 px-4 py-2 text-amber-800 text-xs font-medium text-center flex items-center justify-center border-b border-amber-100 shadow-sm z-10">
             <AlertTriangle size={14} className="mr-2" />
             Chế độ Demo - Dữ liệu sẽ không được lưu vào hệ thống
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

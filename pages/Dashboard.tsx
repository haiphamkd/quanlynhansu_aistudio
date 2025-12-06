
import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Users, TrendingUp, AlertCircle, DollarSign, Pill, Building } from 'lucide-react';
import { dataService } from '../services/dataService';
import { formatDateVN, formatCurrencyVN } from '../utils/helpers';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    employeeCount: 0,
    fundBalance: 0,
    totalPrescriptions: 0,
    pendingIssues: 0
  });
  const [fundData, setFundData] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);

  const getCurrentUser = () => {
    try { return JSON.parse(localStorage.getItem('pharmahr_user') || '{}'); } catch { return { role: 'staff' }; }
  };
  const currentUser = getCurrentUser();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const deptFilter = currentUser.role === 'admin' ? 'All' : currentUser.department;

        const [employees, funds, reports] = await Promise.all([
          dataService.getEmployees(deptFilter),
          dataService.getFunds(deptFilter),
          dataService.getReports(deptFilter)
        ]);

        // Process Stats
        const balance = funds.length > 0 ? funds[funds.length - 1].balanceAfter : 0;
        const totalP = reports.reduce((acc, curr) => acc + curr.totalIssued, 0);
        const pending = reports.reduce((acc, curr) => acc + curr.notReceived, 0);

        setStats({
          employeeCount: employees.length,
          fundBalance: balance,
          totalPrescriptions: totalP,
          pendingIssues: pending
        });

        // Process Fund Chart Data (Last 5 transactions)
        setFundData(funds.slice(-5).map(f => ({
          date: formatDateVN(f.date).substring(0, 5), // dd/mm for compact view
          fullDate: formatDateVN(f.date),
          balance: f.balanceAfter,
          amount: f.amount,
          type: f.type
        })));

        // Process Report Chart Data
        setReportData(reports.slice(-5).map(r => ({
          date: formatDateVN(r.date).substring(0, 5),
          fullDate: formatDateVN(r.date),
          issued: r.totalIssued,
          missed: r.notReceived
        })));

      } catch (error) {
        console.error("Error loading dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Tổng quan</h2>
          <p className="text-gray-500 text-sm flex items-center mt-1">
             {currentUser.role === 'admin' ? (
                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold mr-2">Toàn viện</span>
             ) : (
                <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded text-xs font-semibold mr-2 flex items-center">
                    <Building size={12} className="mr-1"/> {currentUser.department}
                </span>
             )}
             Cập nhật tình hình hoạt động
          </p>
        </div>
        <div className="text-xs text-gray-500 font-medium bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm hidden sm:block">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
             <div className="p-2 bg-teal-50 rounded-lg text-teal-600">
               <Users size={20} />
             </div>
             <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full border border-green-200">ACTIVE</span>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Nhân sự {currentUser.department ? `(${currentUser.role === 'admin' ? 'Tổng' : 'Khoa'})` : ''}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.employeeCount}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
             <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
               <DollarSign size={20} />
             </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Quỹ hiện tại</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrencyVN(stats.fundBalance)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
             <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
               <Pill size={20} />
             </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Đơn thuốc (Tuần)</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPrescriptions}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
             <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
               <AlertCircle size={20} />
             </div>
             {stats.pendingIssues > 0 && <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">CẦN XỬ LÝ</span>}
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Chưa nhận thuốc</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingIssues}</h3>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fund Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-w-0">
          <div className="flex items-center justify-between mb-6">
             <h3 className="font-semibold text-gray-800 flex items-center">
               <TrendingUp size={18} className="mr-2 text-gray-400" />
               Biến động quỹ
             </h3>
          </div>
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fundData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000000}M`} />
                <Tooltip 
                  labelFormatter={(label, payload) => payload[0]?.payload.fullDate}
                  formatter={(value: number) => formatCurrencyVN(value)}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="balance" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" name="Số dư" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prescription Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-w-0">
          <div className="flex items-center justify-between mb-6">
             <h3 className="font-semibold text-gray-800 flex items-center">
               <Pill size={18} className="mr-2 text-gray-400" />
               Tình hình cấp phát
             </h3>
          </div>
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  labelFormatter={(label, payload) => payload[0]?.payload.fullDate}
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Bar dataKey="issued" name="Đã cấp" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="missed" name="Chưa nhận" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

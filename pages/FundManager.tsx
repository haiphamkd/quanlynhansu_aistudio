
import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, Filter, Save, X, Pencil, Search, Building, Trash2 } from 'lucide-react';
import GenericTable from '../components/GenericTable';
import { AppButton } from '../components/AppButton';
import { FundTransaction, TransactionType } from '../types';
import { dataService } from '../services/dataService';
import { formatDateVN, formatCurrencyVN, formatNumberInput, parseNumberInput } from '../utils/helpers';

const FundManager: React.FC = () => {
  const [funds, setFunds] = useState<FundTransaction[]>([]);
  const [filteredFunds, setFilteredFunds] = useState<FundTransaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totals, setTotals] = useState({ balance: 0, income: 0, expense: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Date filter state - default empty to show all
  const [dateRange, setDateRange] = useState({
    from: '', 
    to: ''
  });
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], type: TransactionType.INCOME, content: '', amount: '', performer: ''
  });
  const [historyContents, setHistoryContents] = useState<string[]>([]);

  const getCurrentUser = () => {
     try { return JSON.parse(localStorage.getItem('pharmahr_user') || '{}'); } catch { return { name: '', role: 'staff' }; }
  };
  const currentUser = getCurrentUser();

  useEffect(() => { loadFunds(); }, []);
  
  // Update totals and list when funds change or filter changes
  useEffect(() => { 
    filterData(); 
    setHistoryContents([...new Set(funds.map(f => f.content))]); 
  }, [funds, dateRange]);

  const loadFunds = async () => { 
      const deptFilter = currentUser.role === 'admin' ? 'All' : currentUser.department;
      const data = await dataService.getFunds(deptFilter);
      setFunds(data); 
  };

  const filterData = () => {
    let filtered = funds;
    
    // Only filter if dates are selected
    if (dateRange.from && dateRange.to) {
        filtered = funds.filter(f => f.date >= dateRange.from && f.date <= dateRange.to);
    }
    
    setFilteredFunds(filtered);
    
    // Calculate stats based on ALL data or FILTERED data? usually Filtered
    const income = filtered.filter(f => f.type === TransactionType.INCOME).reduce((sum, f) => sum + f.amount, 0);
    const expense = filtered.filter(f => f.type === TransactionType.EXPENSE).reduce((sum, f) => sum + f.amount, 0);
    
    // Balance is always the latest record's balance (if sorted by time) or calculated
    const currentBalance = funds.length > 0 ? funds[funds.length - 1].balanceAfter : 0;
    
    setTotals({ balance: currentBalance, income, expense });
  };

  const handleOpenModal = () => {
     setEditingId(null);
     const user = getCurrentUser();
     setFormData({ date: new Date().toISOString().split('T')[0], type: TransactionType.INCOME, content: '', amount: '', performer: user.name || '' });
     setIsModalOpen(true);
  };

  const handleEditClick = (item: FundTransaction) => {
      setEditingId(item.id);
      setFormData({
          date: item.date,
          type: item.type,
          content: item.content,
          amount: formatNumberInput(item.amount),
          performer: item.performer
      });
      setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
      if(confirm("Bạn có chắc chắn muốn xóa giao dịch này?")) {
          await dataService.deleteFundTransaction(id);
          loadFunds();
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountVal = parseNumberInput(formData.amount);
    
    try {
        if (editingId) {
            // Edit existing
            const updatedTrans: FundTransaction = {
                id: editingId,
                date: formData.date,
                type: formData.type,
                content: formData.content,
                amount: amountVal,
                performer: formData.performer,
                balanceAfter: 0 // Will be handled by service
            };
            await dataService.updateFundTransaction(updatedTrans);
        } else {
            // Add new
            const newTrans = { 
                ...formData, 
                amount: amountVal, 
                id: `T-${Date.now()}`, 
                department: currentUser.department, // Assign current user's dept
                balanceAfter: 0 
            } as FundTransaction;
            await dataService.addFundTransaction(newTrans);
        }

        setIsModalOpen(false);
        loadFunds();
    } catch (err: any) {
        alert("Có lỗi xảy ra: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center">
             <Wallet className="mr-2" /> Quỹ Khoa 
             {currentUser.department && <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex items-center"><Building size={12} className="mr-1"/>{currentUser.department}</span>}
          </h2>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-teal-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-teal-100 text-sm uppercase tracking-wider">TỔNG QUỸ HIỆN TẠI</h3>
              <Wallet className="text-teal-200" size={20} />
            </div>
            <p className="text-3xl font-bold tracking-tight">{formatCurrencyVN(totals.balance)}</p>
          </div>
          <div className="absolute -bottom-4 -right-4 bg-white opacity-5 w-24 h-24 rounded-full"></div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
             <h3 className="font-medium text-gray-500 text-xs uppercase tracking-wider">Tổng Thu (Theo lọc)</h3>
             <div className="bg-emerald-50 p-1.5 rounded-md text-emerald-600"><TrendingUp size={16} /></div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrencyVN(totals.income)}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
             <h3 className="font-medium text-gray-500 text-xs uppercase tracking-wider">Tổng Chi (Theo lọc)</h3>
             <div className="bg-rose-50 p-1.5 rounded-md text-rose-600"><TrendingDown size={16} /></div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrencyVN(totals.expense)}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="text-sm font-semibold text-gray-700 whitespace-nowrap">Bộ lọc thời gian:</div>
           <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-1 border border-gray-200">
             <input 
                type="date" 
                value={dateRange.from} 
                onChange={e => setDateRange({...dateRange, from: e.target.value})} 
                className="bg-transparent text-sm focus:outline-none w-32 px-2 py-1 text-gray-600"
                placeholder="Từ ngày"
             />
             <span className="text-gray-400">-</span>
             <input 
                type="date" 
                value={dateRange.to} 
                onChange={e => setDateRange({...dateRange, to: e.target.value})} 
                className="bg-transparent text-sm focus:outline-none w-32 px-2 py-1 text-gray-600"
                placeholder="Đến ngày"
             />
           </div>
           {(dateRange.from || dateRange.to) && (
             <button onClick={() => setDateRange({from: '', to: ''})} className="text-xs text-red-500 hover:underline">Xóa lọc</button>
           )}
        </div>
        
        <AppButton variant="primary" icon={Plus} onClick={handleOpenModal}>
           Thêm giao dịch
        </AppButton>
      </div>

      <GenericTable 
        data={[...filteredFunds].reverse()}
        columns={[
          { header: 'Ngày', accessor: (item) => formatDateVN(item.date), className: 'w-28 text-gray-500' },
          { 
            header: 'Loại', 
            accessor: (item) => (
              <span className={`flex items-center font-medium text-xs ${item.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                {item.type === TransactionType.INCOME ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                {item.type}
              </span>
            ),
            className: 'w-24'
          },
          { header: 'Nội dung', accessor: 'content', className: 'font-medium text-gray-800' },
          { header: 'Người thực hiện', accessor: 'performer', className: 'text-gray-500 text-xs hidden sm:table-cell' },
          { 
            header: 'Số tiền', 
            accessor: (item) => <div className={`text-right font-bold ${item.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>{item.type === TransactionType.INCOME ? '+' : '-'}{formatCurrencyVN(item.amount)}</div>,
            className: 'text-right w-32'
          },
          { 
            header: 'Số dư cuối', 
            accessor: (item) => <div className="text-right text-gray-400 text-xs font-mono">{formatCurrencyVN(item.balanceAfter)}</div>,
            className: 'text-right w-32 hidden md:table-cell'
          },
        ]}
        actions={(item) => (
            <div className="flex justify-end space-x-1">
                <button onClick={() => handleEditClick(item)} className="p-1.5 text-gray-400 hover:text-teal-600 bg-gray-50 hover:bg-teal-50 rounded-md transition-colors">
                    <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-md transition-colors">
                    <Trash2 size={16} />
                </button>
            </div>
        )}
      />

       {/* Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
               <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Sửa giao dịch' : 'Thêm giao dịch'}</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">Ngày</label>
                   <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 bg-white shadow-sm" />
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">Loại</label>
                   <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as TransactionType})} className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 bg-white shadow-sm">
                     <option value={TransactionType.INCOME}>Thu</option>
                     <option value={TransactionType.EXPENSE}>Chi</option>
                   </select>
                 </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Số tiền (VNĐ)</label>
                <input type="text" required value={formData.amount} onChange={e => setFormData({...formData, amount: formatNumberInput(e.target.value)})} className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-right font-bold text-gray-800 focus:ring-2 focus:ring-teal-500 text-lg bg-white shadow-sm" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nội dung</label>
                <input type="text" required list="contents" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 bg-white shadow-sm" placeholder="Nhập nội dung..." />
                <datalist id="contents">{historyContents.map((c, i) => <option key={i} value={c} />)}</datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Người thực hiện</label>
                <input type="text" required value={formData.performer} onChange={e => setFormData({...formData, performer: e.target.value})} className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 bg-white shadow-sm" />
              </div>
              <div className="pt-4">
                <AppButton type="submit" variant="primary" icon={Save} className="w-full">
                   {editingId ? 'Cập nhật' : 'Lưu giao dịch'}
                </AppButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundManager;

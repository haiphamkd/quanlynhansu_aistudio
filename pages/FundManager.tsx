
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
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Date filter state - default empty to show all
  const [dateRange, setDateRange] = useState({
    from: '', 
    to: ''
  });

  // NEW: State for default transaction type
  const [defaultTransactionType, setDefaultTransactionType] = useState<TransactionType>(TransactionType.INCOME);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], type: defaultTransactionType, content: '', amount: '', performer: ''
  });
  const [historyContents, setHistoryContents] = useState<string[]>([]);

  const getCurrentUser = () => {
     try { return JSON.parse(localStorage.getItem('pharmahr_user') || '{}'); } catch { return { name: '', role: 'staff' }; }
  };
  const currentUser = getCurrentUser();
  const canEdit = ['admin', 'operator', 'manager'].includes(currentUser.role);
  const isAdminOrOperator = ['admin', 'operator'].includes(currentUser.role);

  useEffect(() => { loadFunds(); }, []);
  
  // Update totals and list when funds change or filter changes
  useEffect(() => { 
    filterData(); 
    setHistoryContents([...new Set(funds.map(f => f.content))]); 
  }, [funds, dateRange, searchTerm]);

  const loadFunds = async () => { 
      // Admin and Operator see All, Manager sees their Dept
      const deptFilter = isAdminOrOperator ? 'All' : currentUser.department;
      const data = await dataService.getFunds(deptFilter);
      setFunds(data); 
  };

  const filterData = () => {
    let filtered = funds;
    
    // 1. Date Filter
    if (dateRange.from && dateRange.to) {
        filtered = filtered.filter(f => f.date >= dateRange.from && f.date <= dateRange.to);
    }

    // 2. Text Search (Content or Performer)
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(f => 
            f.content.toLowerCase().includes(lowerTerm) || 
            f.performer.toLowerCase().includes(lowerTerm)
        );
    }
    
    setFilteredFunds(filtered);
    
    // Calculate stats based on FILTERED data
    const income = filtered.filter(f => f.type === TransactionType.INCOME).reduce((sum, f) => sum + f.amount, 0);
    const expense = filtered.filter(f => f.type === TransactionType.EXPENSE).reduce((sum, f) => sum + f.amount, 0);
    
    // Balance is usually global, but if showing filtered view, we might want to show filtered totals.
    // However, "Balance" usually implies current cash on hand, which shouldn't change by filter unless we calculate running balance.
    // For now, keep Balance as the latest record's balance (Global), but Income/Expense follow filter.
    const currentBalance = funds.length > 0 ? funds[funds.length - 1].balanceAfter : 0;
    
    setTotals({ balance: currentBalance, income, expense });
  };

  const handleOpenModal = () => {
     setEditingId(null);
     const user = getCurrentUser();
     setFormData({ 
        date: new Date().toISOString().split('T')[0], 
        type: defaultTransactionType, // Use the default type
        content: '', 
        amount: '', 
        performer: user.name || '' 
     });
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

      {/* Overview Cards - Compact Height */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-teal-600 rounded-xl p-4 text-white shadow-lg relative overflow-hidden flex flex-col justify-center">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-teal-100 text-xs uppercase tracking-wider">TỔNG QUỸ HIỆN TẠI</h3>
              <Wallet className="text-teal-200" size={18} />
            </div>
            <p className="text-2xl font-bold tracking-tight">{formatCurrencyVN(totals.balance)}</p>
          </div>
          <div className="absolute -bottom-4 -right-4 bg-white opacity-5 w-16 h-16 rounded-full"></div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between mb-1">
             <h3 className="font-medium text-gray-500 text-xs uppercase tracking-wider">Tổng Thu (Theo lọc)</h3>
             <div className="bg-emerald-50 p-1 rounded-md text-emerald-600"><TrendingUp size={14} /></div>
          </div>
          <p className="text-xl font-bold text-gray-800">{formatCurrencyVN(totals.income)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between mb-1">
             <h3 className="font-medium text-gray-500 text-xs uppercase tracking-wider">Tổng Chi (Theo lọc)</h3>
             <div className="bg-rose-50 p-1 rounded-md text-rose-600"><TrendingDown size={14} /></div>
          </div>
          <p className="text-xl font-bold text-gray-800">{formatCurrencyVN(totals.expense)}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
            {/* Search and Date Filter */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                 {/* Search Box */}
                 <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        placeholder="Tìm nội dung, người thực hiện..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>

                 {/* Date Filter */}
                 <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-1 border border-gray-200 w-full sm:w-auto">
                        <input 
                            type="date" 
                            value={dateRange.from} 
                            onChange={e => setDateRange({...dateRange, from: e.target.value})} 
                            className="bg-transparent text-xs focus:outline-none w-full sm:w-28 px-2 py-1 text-gray-600"
                            placeholder="Từ ngày"
                        />
                        <span className="text-gray-400">-</span>
                        <input 
                            type="date" 
                            value={dateRange.to} 
                            onChange={e => setDateRange({...dateRange, to: e.target.value})} 
                            className="bg-transparent text-xs focus:outline-none w-full sm:w-28 px-2 py-1 text-gray-600"
                            placeholder="Đến ngày"
                        />
                    </div>
                    {(dateRange.from || dateRange.to) && (
                        <button onClick={() => setDateRange({from: '', to: ''})} className="text-xs text-red-500 hover:underline whitespace-nowrap">Xóa lọc</button>
                    )}
                 </div>
            </div>
            
            {/* Buttons */}
            {canEdit && (
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
                    <button 
                        onClick={() => setDefaultTransactionType(TransactionType.INCOME)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                            defaultTransactionType === TransactionType.INCOME 
                            ? 'bg-white text-emerald-600 shadow-sm' 
                            : 'text-gray-500 hover:bg-white/50'
                        }`}
                    >
                        Thu
                    </button>
                    <button 
                        onClick={() => setDefaultTransactionType(TransactionType.EXPENSE)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                            defaultTransactionType === TransactionType.EXPENSE 
                            ? 'bg-white text-rose-600 shadow-sm' 
                            : 'text-gray-500 hover:bg-white/50'
                        }`}
                    >
                        Chi
                    </button>
                </div>
                <AppButton variant="primary" icon={Plus} onClick={handleOpenModal} className="shrink-0">
                Thêm GD
                </AppButton>
            </div>
            )}
        </div>
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
        actions={canEdit ? (item) => (
            <div className="flex justify-end space-x-1">
                <button onClick={() => handleEditClick(item)} className="p-1.5 text-gray-400 hover:text-teal-600 bg-gray-50 hover:bg-teal-50 rounded-md transition-colors">
                    <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-md transition-colors">
                    <Trash2 size={16} />
                </button>
            </div>
        ) : undefined}
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

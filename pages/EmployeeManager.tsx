
import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, User, X, Upload, FileText, CheckCircle, RotateCcw, Key, Download, Eye, QrCode, Shield, Lock, MapPin, Calendar, CreditCard, Mail, Phone } from 'lucide-react';
import GenericTable from '../components/GenericTable';
import { AppButton } from '../components/AppButton';
import { Employee, EmployeeStatus, TempData, User as AppUser, DEPARTMENTS, Category } from '../types';
import { dataService } from '../services/dataService';
import { formatDateVN, generateUsername } from '../utils/helpers';

const EmployeeManager: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingUsers, setExistingUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'work' | 'account'>('personal');

  // Current User
  const getCurrentUser = () => {
    try { return JSON.parse(localStorage.getItem('pharmahr_user') || '{}'); } catch { return { role: 'staff' }; }
  };
  const currentUser = getCurrentUser();

  const initialFormState: Employee = {
    id: '', fullName: '', department: 'Khoa Dược', dob: '', gender: 'Nam', position: 'Dược sĩ', qualification: '',
    phone: '', email: '', contractDate: '', joinDate: '',
    hometown: '', permanentAddress: '', idCardNumber: '', idCardDate: '', idCardPlace: 'Cục trưởng Cục CSQLHC về TTXH',
    status: EmployeeStatus.ACTIVE, avatarUrl: '', fileUrl: '', notes: ''
  };
  
  const [formData, setFormData] = useState<Employee>(initialFormState);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const deptFilter = currentUser.role === 'admin' ? 'All' : currentUser.department;
    
    const [empData, catData, userData] = await Promise.all([
       dataService.getEmployees(deptFilter),
       dataService.getCategories(),
       dataService.getUsers()
    ]);
    
    setEmployees(empData);
    setCategories(catData);
    setExistingUsers(userData);
    setLoading(false);
  };

  const getNextId = () => {
     if (employees.length === 0) return "NV001";
     const ids = employees.map(e => parseInt(e.id.replace('NV', ''))).filter(n => !isNaN(n));
     const maxId = Math.max(...ids, 0);
     return `NV${String(maxId + 1).padStart(3, '0')}`;
  };

  const handleAddClick = () => {
    setEditingEmployee(null);
    setIsViewMode(false);
    setActiveTab('personal');
    setFormData({
      ...initialFormState,
      department: currentUser.role === 'admin' ? 'Khoa Dược' : (currentUser.department || 'Khoa Dược'),
      id: getNextId(),
      dob: '1990-01-01',
      joinDate: new Date().toISOString().split('T')[0],
      contractDate: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleViewClick = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsViewMode(true); 
    setActiveTab('personal');
    setFormData({ ...emp });
    setIsModalOpen(true);
  };

  const handleSwitchToEdit = () => {
     setIsViewMode(false);
  };

  const handleDeleteClick = async () => {
    if (!editingEmployee) return;
    if (confirm('Bạn có chắc chắn muốn xóa nhân viên này? Hành động này không thể hoàn tác.')) {
      await dataService.deleteEmployee(editingEmployee.id);
      setIsModalOpen(false);
      loadData();
    }
  };

  // --- ACCOUNT LOGIC ---
  const handleCreateAccount = async () => {
    if(!editingEmployee) return;
    if (!confirm(`Tạo tài khoản cho nhân viên ${editingEmployee.fullName}? \nTài khoản sẽ là: ${generateUsername(editingEmployee.fullName)}\nMật khẩu mặc định: 1`)) return;

    const newUser: AppUser = {
      username: generateUsername(editingEmployee.fullName),
      password: '1',
      name: editingEmployee.fullName,
      role: 'staff',
      department: editingEmployee.department,
      employeeId: editingEmployee.id,
      mustChangePassword: true
    };

    const res = await dataService.createUser(newUser);
    if (res.success) {
      alert(`Đã tạo tài khoản thành công!\nUsername: ${newUser.username}\nPassword: 1`);
      loadData(); 
    } else {
      alert(`Lỗi: ${res.error}`);
    }
  };

  const handleResetPassword = async () => {
    if(!editingEmployee) return;
    const user = existingUsers.find(u => u.employeeId === editingEmployee.id);
    if (!user) return;

    if (!confirm(`Bạn có chắc muốn Reset mật khẩu cho tài khoản '${user.username}' về mặc định '1'?`)) return;

    const res = await dataService.adminResetPassword(user.username);
    if (res.success) {
        alert("Đã reset mật khẩu thành công về '1'.");
    } else {
        alert("Lỗi: " + res.error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatarUrl' | 'fileUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;
    if (editingEmployee) await dataService.updateEmployee(formData);
    else await dataService.addEmployee(formData);
    setIsModalOpen(false);
    loadData();
  };

  const filteredEmployees = employees.filter(e => 
    e.fullName.toLowerCase().includes(filter.toLowerCase()) || 
    e.id.toLowerCase().includes(filter.toLowerCase())
  );

  // Dropdown data sources from Category Manager
  const qualifications = categories.filter(c => c.type === 'TrinhDo').map(c => c.value);
  const statuses = categories.filter(c => c.type === 'TrangThai').map(c => c.value);
  const places = categories.filter(c => c.type === 'NoiCap').map(c => c.value);
  const positions = categories.filter(c => c.type === 'ChucVu').map(c => c.value);
  
  // Combine hardcoded DEPARTMENTS with dynamic 'KhoaPhong' categories
  const dynamicDepts = categories.filter(c => c.type === 'KhoaPhong').map(c => c.value);
  const departmentList = [...new Set([...DEPARTMENTS, ...dynamicDepts])];

  const columns = [
    {
       header: 'Chi tiết',
       accessor: (item: Employee) => (
          <button onClick={() => handleViewClick(item)} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-full transition-colors font-medium text-xs flex items-center">
             <Eye size={16} className="mr-1" /> Xem
          </button>
       ),
       className: 'w-24 text-center'
    },
    { header: 'Mã NV', accessor: 'id' as keyof Employee, className: 'w-24 font-mono text-gray-500 font-semibold' },
    { 
      header: 'Họ tên', 
      accessor: (item: Employee) => (
        <div className="flex items-center min-w-[180px]">
          {item.avatarUrl ? (
            <img src={item.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover mr-3 border border-gray-200" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold mr-3 border border-teal-100 text-xs">
               {item.fullName.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-semibold text-gray-900 text-sm">{item.fullName}</div>
            <div className="text-gray-500 text-xs">{item.position}</div>
          </div>
        </div>
      ) 
    },
    { 
      header: 'Khoa Phòng', 
      // Use a function accessor to ensure we get the department value correctly
      accessor: (item: Employee) => item.department || '-',
      className: 'text-sm text-gray-700 font-medium' 
    },
    { header: 'Ngày sinh', accessor: (item: Employee) => formatDateVN(item.dob) },
    { header: 'SĐT', accessor: 'phone' as keyof Employee },
    { 
      header: 'Trạng thái', 
      accessor: (item: Employee) => (
        <span className={`px-2 py-0.5 inline-flex text-xs font-medium rounded-full whitespace-nowrap ${
          item.status === EmployeeStatus.ACTIVE ? 'bg-green-50 text-green-700 border border-green-100' : 
          item.status === EmployeeStatus.LEAVE ? 'bg-amber-50 text-amber-700 border border-amber-100' : 
          'bg-gray-100 text-gray-600 border border-gray-200'
        }`}>
          {item.status}
        </span>
      )
    },
  ];

  const currentEmployeeHasAccount = editingEmployee ? existingUsers.some(u => u.employeeId === editingEmployee.id) : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Hồ Sơ Nhân Sự</h2>
          <p className="text-sm text-gray-500">Quản lý toàn bộ thông tin chi tiết nhân viên</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <AppButton variant="secondary" size="sm" icon={Download} onClick={() => alert("Coming soon")}>
             Mẫu nhập
          </AppButton>
          <AppButton variant="primary" size="sm" icon={Plus} onClick={handleAddClick}>
            Thêm mới
          </AppButton>
        </div>
      </div>

      <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border-none rounded-lg leading-5 bg-transparent placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
            placeholder="Tìm kiếm nhân viên theo tên, mã hoặc khoa..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <GenericTable 
        data={filteredEmployees}
        columns={columns}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-gray-100">
             
             {/* HEADER */}
             <div className="flex-none bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center rounded-t-xl">
               <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                     {formData.avatarUrl ? (
                        <img src={formData.avatarUrl} className="w-full h-full rounded-full object-cover" />
                     ) : (
                        <span className="text-teal-600 font-bold text-lg">{formData.fullName.charAt(0)}</span>
                     )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                        {isViewMode ? formData.fullName : (editingEmployee ? 'Cập nhật hồ sơ' : 'Thêm nhân viên mới')}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono">
                        {formData.id} • {formData.position}
                    </p>
                  </div>
               </div>
               <div className="flex items-center space-x-2">
                   {isViewMode && (currentUser.role === 'admin' || currentUser.role === 'manager') && (
                      <>
                        <button onClick={handleSwitchToEdit} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors" title="Sửa">
                            <Pencil size={18} />
                        </button>
                        {currentUser.role === 'admin' && (
                           <button onClick={handleDeleteClick} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors" title="Xóa">
                                <Trash2 size={18} />
                           </button>
                        )}
                      </>
                   )}
                   <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                     <X size={20} />
                   </button>
               </div>
             </div>
             
             {/* TABS NAVIGATION */}
             <div className="flex-none px-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex space-x-6">
                   <button 
                     onClick={() => setActiveTab('personal')}
                     className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'personal' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                   >
                     <User size={16} className="mr-2"/> Thông tin cá nhân
                   </button>
                   <button 
                     onClick={() => setActiveTab('work')}
                     className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'work' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                   >
                     <Shield size={16} className="mr-2"/> Công việc & Liên hệ
                   </button>
                   {editingEmployee && (
                       <button 
                         onClick={() => setActiveTab('account')}
                         className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'account' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                       >
                         <Lock size={16} className="mr-2"/> Tài khoản & Bảo mật
                       </button>
                   )}
                </div>
             </div>

             {/* FORM BODY */}
             <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                
                {/* TAB: PERSONAL INFO */}
                {activeTab === 'personal' && (
                   <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                         {/* Avatar Section */}
                         <div className="md:col-span-3 flex flex-col items-center space-y-4">
                            <div className="w-40 h-40 rounded-xl bg-white border-2 border-dashed border-gray-300 flex items-center justify-center relative group overflow-hidden shadow-sm">
                               {formData.avatarUrl ? (
                                  <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                               ) : (
                                  <div className="text-center">
                                     <User className="w-12 h-12 text-gray-300 mx-auto" />
                                     <span className="text-xs text-gray-400 block mt-2">Upload ảnh</span>
                                  </div>
                               )}
                               {!isViewMode && (
                                  <label className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 flex items-center justify-center cursor-pointer transition-all">
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatarUrl')} />
                                    <div className="bg-white/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Upload size={16} /></div>
                                  </label>
                               )}
                            </div>
                            
                            {(isViewMode || editingEmployee) && (
                               <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-center w-full">
                                  <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(JSON.stringify({id: formData.id, name: formData.fullName}))}`} 
                                    alt="QR" 
                                    className="w-24 h-24 mx-auto mb-2"
                                  />
                                  <div className="text-[10px] text-gray-500 flex items-center justify-center font-mono bg-gray-100 rounded py-1">
                                     <QrCode size={10} className="mr-1"/> {formData.id}
                                  </div>
                               </div>
                            )}
                         </div>

                         {/* Fields Section */}
                         <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-5 content-start">
                            <div className="col-span-2">
                               <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Họ và tên <span className="text-red-500">*</span></label>
                               <input type="text" required disabled={isViewMode} value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 disabled:bg-gray-100" />
                            </div>
                            
                            <div>
                               <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Ngày sinh</label>
                               <input type="date" required disabled={isViewMode} value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 disabled:bg-gray-100" />
                            </div>
                            
                            <div>
                               <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Giới tính</label>
                               <select disabled={isViewMode} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 disabled:bg-gray-100">
                                  <option value="Nam">Nam</option>
                                  <option value="Nữ">Nữ</option>
                               </select>
                            </div>

                            <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
                               <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center"><CreditCard size={14} className="mr-2 text-teal-600"/> Giấy tờ tùy thân</h4>
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                     <label className="block text-xs font-medium text-gray-500 mb-1">Số CCCD/CMND</label>
                                     <input type="text" disabled={isViewMode} value={formData.idCardNumber} onChange={e => setFormData({...formData, idCardNumber: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 disabled:bg-gray-100" placeholder="012345..." />
                                  </div>
                                  <div>
                                     <label className="block text-xs font-medium text-gray-500 mb-1">Ngày cấp</label>
                                     <input type="date" disabled={isViewMode} value={formData.idCardDate} onChange={e => setFormData({...formData, idCardDate: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 disabled:bg-gray-100" />
                                  </div>
                                  <div>
                                     <label className="block text-xs font-medium text-gray-500 mb-1">Nơi cấp</label>
                                     <select disabled={isViewMode} value={formData.idCardPlace} onChange={e => setFormData({...formData, idCardPlace: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 disabled:bg-gray-100">
                                        {places.length > 0 ? places.map(p => <option key={p} value={p}>{p}</option>) : <option value="Cục trưởng Cục CSQLHC về TTXH">Cục CS QLHC về TTXH</option>}
                                     </select>
                                  </div>
                               </div>
                            </div>
                            
                            <div className="col-span-2">
                               <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Quê quán</label>
                               <input type="text" disabled={isViewMode} value={formData.hometown} onChange={e => setFormData({...formData, hometown: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 disabled:bg-gray-100" placeholder="Xã/Phường, Quận/Huyện, Tỉnh/Thành..." />
                            </div>
                         </div>
                      </div>
                   </div>
                )}

                {/* TAB: WORK & CONTACT */}
                {activeTab === 'work' && (
                   <div className="space-y-6">
                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                         <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center border-b pb-2"><Shield size={16} className="mr-2 text-teal-600"/> Thông tin công việc</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                               <label className="block text-xs font-medium text-gray-500 mb-1">Khoa / Phòng</label>
                               <select 
                                 disabled={isViewMode || currentUser.role !== 'admin'} 
                                 value={formData.department} 
                                 onChange={e => setFormData({...formData, department: e.target.value})} 
                                 className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 disabled:bg-gray-100"
                               >
                                  {departmentList.map(d => <option key={d} value={d}>{d}</option>)}
                               </select>
                            </div>
                            <div>
                               <label className="block text-xs font-medium text-gray-500 mb-1">Chức vụ</label>
                               <select disabled={isViewMode} value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 disabled:bg-gray-100">
                                  {positions.map(p => <option key={p} value={p}>{p}</option>)}
                               </select>
                            </div>
                            <div>
                               <label className="block text-xs font-medium text-gray-500 mb-1">Trình độ chuyên môn</label>
                               <select disabled={isViewMode} value={formData.qualification} onChange={e => setFormData({...formData, qualification: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 disabled:bg-gray-100">
                                  <option value="">-- Chọn --</option>
                                  {qualifications.map(q => <option key={q} value={q}>{q}</option>)}
                               </select>
                            </div>
                            <div>
                               <label className="block text-xs font-medium text-gray-500 mb-1">Trạng thái</label>
                               <select disabled={isViewMode} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 disabled:bg-gray-100">
                                  {statuses.length > 0 ? statuses.map(s => <option key={s} value={s}>{s}</option>) : Object.values(EmployeeStatus).map(s => <option key={s} value={s}>{s}</option>)}
                               </select>
                            </div>
                            <div>
                               <label className="block text-xs font-medium text-gray-500 mb-1">Ngày vào làm</label>
                               <input type="date" disabled={isViewMode} value={formData.joinDate} onChange={e => setFormData({...formData, joinDate: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 disabled:bg-gray-100" />
                            </div>
                            <div>
                               <label className="block text-xs font-medium text-gray-500 mb-1">Ngày ký hợp đồng</label>
                               <input type="date" disabled={isViewMode} value={formData.contractDate} onChange={e => setFormData({...formData, contractDate: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 disabled:bg-gray-100" />
                            </div>
                         </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                         <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center border-b pb-2"><MapPin size={16} className="mr-2 text-teal-600"/> Thông tin liên hệ</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                               <label className="block text-xs font-medium text-gray-500 mb-1">Địa chỉ thường trú</label>
                               <input type="text" disabled={isViewMode} value={formData.permanentAddress} onChange={e => setFormData({...formData, permanentAddress: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 disabled:bg-gray-100" placeholder="Số nhà, đường..." />
                            </div>
                            <div>
                               <label className="block text-xs font-medium text-gray-500 mb-1">Số điện thoại</label>
                               <div className="relative">
                                  <Phone size={14} className="absolute top-3 left-3 text-gray-400"/>
                                  <input type="text" disabled={isViewMode} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-teal-500 disabled:bg-gray-100" />
                               </div>
                            </div>
                            <div>
                               <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                               <div className="relative">
                                  <Mail size={14} className="absolute top-3 left-3 text-gray-400"/>
                                  <input type="email" disabled={isViewMode} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-teal-500 disabled:bg-gray-100" />
                               </div>
                            </div>
                         </div>
                      </div>
                      
                      <div>
                         <label className="block text-xs font-medium text-gray-500 mb-1">Ghi chú thêm</label>
                         <textarea disabled={isViewMode} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 disabled:bg-gray-100" rows={3}></textarea>
                      </div>
                   </div>
                )}

                {/* TAB: ACCOUNT */}
                {activeTab === 'account' && (
                   <div className="flex flex-col items-center justify-center py-10 space-y-6">
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2">
                         <Lock size={32} />
                      </div>
                      
                      {currentEmployeeHasAccount ? (
                         <div className="text-center space-y-4">
                            <h4 className="text-xl font-bold text-gray-800">Tài khoản đang hoạt động</h4>
                            <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg inline-flex items-center">
                               <CheckCircle size={16} className="mr-2"/> Đã cấp tài khoản
                            </div>
                            <p className="text-gray-500 max-w-xs mx-auto text-sm">Nhân viên này đã có thể đăng nhập vào hệ thống.</p>
                            
                            {currentUser.role === 'admin' && (
                               <div className="pt-4">
                                  <AppButton variant="warning" icon={RotateCcw} onClick={handleResetPassword}>
                                     Reset mật khẩu về mặc định (1)
                                  </AppButton>
                               </div>
                            )}
                         </div>
                      ) : (
                         <div className="text-center space-y-4">
                            <h4 className="text-xl font-bold text-gray-800">Chưa có tài khoản</h4>
                            <p className="text-gray-500 max-w-xs mx-auto text-sm">Tạo tài khoản để nhân viên này có thể truy cập vào hệ thống và xem thông tin cá nhân.</p>
                            <AppButton variant="primary" icon={Key} onClick={handleCreateAccount} className="w-full max-w-xs mx-auto">
                               Cấp tài khoản ngay
                            </AppButton>
                         </div>
                      )}
                   </div>
                )}

                {/* FOOTER ACTIONS (Only show in edit/add mode or when not in account tab) */}
                {!isViewMode && (
                   <div className="flex justify-end pt-4 space-x-3 border-t border-gray-100 mt-8">
                     <AppButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                       Hủy bỏ
                     </AppButton>
                     <AppButton type="submit" variant="primary" icon={CheckCircle}>
                       {editingEmployee ? 'Lưu hồ sơ' : 'Hoàn tất thêm mới'}
                     </AppButton>
                   </div>
                )}
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManager;

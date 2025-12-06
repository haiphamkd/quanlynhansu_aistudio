
import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, User, X, Upload, CheckCircle, RotateCcw, Key, Download, Eye, QrCode, Shield, Lock, MapPin, CreditCard, Mail, Phone, Filter } from 'lucide-react';
import GenericTable from '../components/GenericTable';
import { AppButton } from '../components/AppButton';
import { Employee, EmployeeStatus, User as AppUser, DEPARTMENTS, Category } from '../types';
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
    hometown: '', permanentAddress: '', idCardNumber: '', idCardDate: '', idCardPlace: 'Cục CS QLHC về TTXH',
    status: EmployeeStatus.ACTIVE, avatarUrl: '', fileUrl: '', notes: ''
  };
  
  const [formData, setFormData] = useState<Employee>(initialFormState);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const deptFilter = currentUser.role === 'admin' ? 'All' : currentUser.department;
    
    try {
        const [empData, catData, userData] = await Promise.all([
           dataService.getEmployees(deptFilter),
           dataService.getCategories(),
           dataService.getUsers()
        ]);
        setEmployees(empData);
        setCategories(catData);
        setExistingUsers(userData);
    } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
    } finally {
        setLoading(false);
    }
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
    
    try {
        if (editingEmployee) await dataService.updateEmployee(formData);
        else await dataService.addEmployee(formData);
        
        setIsModalOpen(false);
        // Reload data immediately to reflect changes
        await loadData();
    } catch (error) {
        alert("Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại.");
        console.error(error);
    }
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
  const departmentList = Array.from(new Set([...DEPARTMENTS, ...dynamicDepts]));

  // Style Class Constants
  const INPUT_CLASS = "block w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white shadow-sm transition-all disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none";
  const LABEL_CLASS = "block text-xs font-semibold text-gray-700 uppercase mb-1.5 tracking-wide";

  const columns = [
    {
       header: 'Thao tác',
       accessor: (item: Employee) => (
          <AppButton 
            variant="outline" 
            size="sm" 
            onClick={() => handleViewClick(item)} 
            className="!px-3 !py-1 text-teal-600 border-teal-200 hover:bg-teal-50"
            icon={Eye}
          >
             Xem
          </AppButton>
       ),
       className: 'w-24 text-center'
    },
    { header: 'Mã NV', accessor: 'id' as keyof Employee, className: 'w-24 font-mono text-gray-500 font-semibold' },
    { 
      header: 'Họ tên', 
      accessor: (item: Employee) => (
        <div className="flex items-center min-w-[200px]">
          {item.avatarUrl ? (
            <img src={item.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover mr-3 border-2 border-white shadow-sm" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold mr-3 shadow-sm text-sm">
               {item.fullName.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-bold text-gray-800 text-sm">{item.fullName}</div>
            <div className="text-gray-500 text-xs flex items-center mt-0.5"><User size={10} className="mr-1"/>{item.position}</div>
          </div>
        </div>
      ) 
    },
    { 
      header: 'Khoa Phòng', 
      // Ensure we access the property directly and provide a fallback
      accessor: (item: Employee) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
           {item.department || 'Chưa cập nhật'}
        </span>
      ),
      className: 'text-sm' 
    },
    { header: 'Ngày sinh', accessor: (item: Employee) => formatDateVN(item.dob) },
    { header: 'SĐT', accessor: 'phone' as keyof Employee },
    { 
      header: 'Trạng thái', 
      accessor: (item: Employee) => (
        <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full whitespace-nowrap border ${
          item.status === EmployeeStatus.ACTIVE ? 'bg-green-50 text-green-700 border-green-200' : 
          item.status === EmployeeStatus.LEAVE ? 'bg-amber-50 text-amber-700 border-amber-200' : 
          'bg-gray-100 text-gray-600 border-gray-200'
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
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center">
             <User className="mr-3 text-teal-600" size={28} /> Hồ Sơ Nhân Sự
          </h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý thông tin, hợp đồng và tài khoản nhân viên</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <AppButton variant="secondary" size="md" icon={Download} onClick={() => alert("Coming soon")}>
             Xuất Excel
          </AppButton>
          <AppButton variant="primary" size="md" icon={Plus} onClick={handleAddClick} className="shadow-lg shadow-teal-200">
            Thêm nhân viên
          </AppButton>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 transition-all sm:text-sm"
            placeholder="Tìm kiếm nhân viên theo tên, mã số, số điện thoại..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="hidden md:flex items-center space-x-2 text-gray-500 text-sm">
           <Filter size={16} />
           <span>{filteredEmployees.length} nhân viên</span>
        </div>
      </div>

      <GenericTable 
        data={filteredEmployees}
        columns={columns}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-gray-100 transform transition-all">
             
             {/* HEADER */}
             <div className="flex-none bg-white px-8 py-5 border-b border-gray-100 flex justify-between items-center rounded-t-2xl">
               <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md ring-4 ring-teal-50">
                     {formData.avatarUrl ? (
                        <img src={formData.avatarUrl} className="w-full h-full rounded-full object-cover" />
                     ) : (
                        <span className="text-white font-bold text-2xl">{formData.fullName.charAt(0)}</span>
                     )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                        {isViewMode ? formData.fullName : (editingEmployee ? 'Cập nhật hồ sơ' : 'Thêm nhân viên mới')}
                    </h3>
                    <p className="text-sm text-gray-500 font-mono mt-0.5 flex items-center">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-bold mr-2">{formData.id}</span> 
                        {formData.position}
                    </p>
                  </div>
               </div>
               <div className="flex items-center space-x-3">
                   {isViewMode && (currentUser.role === 'admin' || currentUser.role === 'manager') && (
                      <>
                        <button onClick={handleSwitchToEdit} className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium text-sm">
                            <Pencil size={16} className="mr-2"/> Chỉnh sửa
                        </button>
                        {currentUser.role === 'admin' && (
                           <button onClick={handleDeleteClick} className="flex items-center px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm">
                                <Trash2 size={16} className="mr-2"/> Xóa
                           </button>
                        )}
                      </>
                   )}
                   <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                     <X size={24} />
                   </button>
               </div>
             </div>
             
             {/* TABS NAVIGATION */}
             <div className="flex-none px-8 border-b border-gray-100 bg-gray-50/50">
                <div className="flex space-x-8">
                   <button 
                     onClick={() => setActiveTab('personal')}
                     className={`py-4 text-sm font-semibold border-b-2 transition-all flex items-center ${activeTab === 'personal' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                   >
                     <User size={18} className="mr-2"/> Thông tin cá nhân
                   </button>
                   <button 
                     onClick={() => setActiveTab('work')}
                     className={`py-4 text-sm font-semibold border-b-2 transition-all flex items-center ${activeTab === 'work' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                   >
                     <Shield size={18} className="mr-2"/> Công việc & Liên hệ
                   </button>
                   {editingEmployee && (
                       <button 
                         onClick={() => setActiveTab('account')}
                         className={`py-4 text-sm font-semibold border-b-2 transition-all flex items-center ${activeTab === 'account' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                       >
                         <Lock size={18} className="mr-2"/> Tài khoản & Bảo mật
                       </button>
                   )}
                </div>
             </div>

             {/* FORM BODY */}
             <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
                
                {/* TAB: PERSONAL INFO */}
                {activeTab === 'personal' && (
                   <div className="space-y-8 animate-fadeIn">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                         {/* Avatar Section */}
                         <div className="md:col-span-3 flex flex-col items-center space-y-6">
                            <div className="w-48 h-48 rounded-2xl bg-white border-2 border-dashed border-gray-300 flex items-center justify-center relative group overflow-hidden shadow-sm hover:border-teal-400 transition-colors">
                               {formData.avatarUrl ? (
                                  <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                               ) : (
                                  <div className="text-center">
                                     <User className="w-16 h-16 text-gray-300 mx-auto" />
                                     <span className="text-xs text-gray-400 block mt-3 font-medium">Tải ảnh lên</span>
                                  </div>
                               )}
                               {!isViewMode && (
                                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatarUrl')} />
                                    <div className="bg-white p-3 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform"><Upload size={20} className="text-gray-700" /></div>
                                  </label>
                               )}
                            </div>
                            
                            {(isViewMode || editingEmployee) && (
                               <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center w-full">
                                  <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify({id: formData.id, name: formData.fullName, dept: formData.department}))}`} 
                                    alt="QR" 
                                    className="w-32 h-32 mx-auto mb-3"
                                  />
                                  <div className="text-xs text-gray-500 flex items-center justify-center font-mono bg-gray-100 rounded-lg py-1.5 px-3">
                                     <QrCode size={12} className="mr-1.5"/> {formData.id}
                                  </div>
                               </div>
                            )}
                         </div>

                         {/* Fields Section */}
                         <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
                            <div className="col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                               <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center pb-2 border-b border-gray-100">
                                  <User size={16} className="mr-2 text-teal-600"/> Thông tin cơ bản
                               </h4>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                  <div className="col-span-2 md:col-span-1">
                                     <label className={LABEL_CLASS}>Họ và tên <span className="text-red-500">*</span></label>
                                     <input type="text" required disabled={isViewMode} value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className={INPUT_CLASS} placeholder="Nguyễn Văn A" />
                                  </div>
                                  
                                  <div>
                                     <label className={LABEL_CLASS}>Ngày sinh</label>
                                     <input type="date" required disabled={isViewMode} value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className={INPUT_CLASS} />
                                  </div>
                                  
                                  <div>
                                     <label className={LABEL_CLASS}>Giới tính</label>
                                     <select disabled={isViewMode} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className={INPUT_CLASS}>
                                        <option value="Nam">Nam</option>
                                        <option value="Nữ">Nữ</option>
                                     </select>
                                  </div>
                                  <div className="col-span-2">
                                     <label className={LABEL_CLASS}>Quê quán</label>
                                     <input type="text" disabled={isViewMode} value={formData.hometown} onChange={e => setFormData({...formData, hometown: e.target.value})} className={INPUT_CLASS} placeholder="Xã/Phường, Quận/Huyện, Tỉnh/Thành..." />
                                  </div>
                               </div>
                            </div>
                            
                            <div className="col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                               <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center pb-2 border-b border-gray-100">
                                  <CreditCard size={16} className="mr-2 text-teal-600"/> Giấy tờ tùy thân
                               </h4>
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                  <div>
                                     <label className={LABEL_CLASS}>Số CCCD/CMND</label>
                                     <input type="text" disabled={isViewMode} value={formData.idCardNumber} onChange={e => setFormData({...formData, idCardNumber: e.target.value})} className={INPUT_CLASS} placeholder="012345678912" />
                                  </div>
                                  <div>
                                     <label className={LABEL_CLASS}>Ngày cấp</label>
                                     <input type="date" disabled={isViewMode} value={formData.idCardDate} onChange={e => setFormData({...formData, idCardDate: e.target.value})} className={INPUT_CLASS} />
                                  </div>
                                  <div>
                                     <label className={LABEL_CLASS}>Nơi cấp</label>
                                     <select disabled={isViewMode} value={formData.idCardPlace} onChange={e => setFormData({...formData, idCardPlace: e.target.value})} className={INPUT_CLASS}>
                                        <option value="Cục trưởng Cục CSQLHC về TTXH">Cục CS QLHC về TTXH</option>
                                        {places.map(p => <option key={p} value={p}>{p}</option>)}
                                     </select>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                )}

                {/* TAB: WORK & CONTACT */}
                {activeTab === 'work' && (
                   <div className="space-y-6 animate-fadeIn">
                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                         <h4 className="text-sm font-bold text-gray-800 mb-5 flex items-center border-b border-gray-100 pb-3">
                            <Shield size={18} className="mr-2 text-teal-600"/> Thông tin công việc
                         </h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                               <label className={LABEL_CLASS}>Khoa / Phòng <span className="text-red-500">*</span></label>
                               <select 
                                 disabled={isViewMode || currentUser.role !== 'admin'} 
                                 value={formData.department} 
                                 onChange={e => setFormData({...formData, department: e.target.value})} 
                                 className={INPUT_CLASS}
                               >
                                  <option value="">-- Chọn Khoa/Phòng --</option>
                                  {departmentList.map(d => <option key={d} value={d}>{d}</option>)}
                               </select>
                               <p className="text-[10px] text-gray-400 mt-1">Chọn từ danh mục Khoa Phòng</p>
                            </div>
                            <div>
                               <label className={LABEL_CLASS}>Chức vụ</label>
                               <select disabled={isViewMode} value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className={INPUT_CLASS}>
                                  <option value="">-- Chọn Chức vụ --</option>
                                  {positions.map(p => <option key={p} value={p}>{p}</option>)}
                               </select>
                            </div>
                            <div>
                               <label className={LABEL_CLASS}>Trình độ chuyên môn</label>
                               <select disabled={isViewMode} value={formData.qualification} onChange={e => setFormData({...formData, qualification: e.target.value})} className={INPUT_CLASS}>
                                  <option value="">-- Chọn Trình độ --</option>
                                  {qualifications.map(q => <option key={q} value={q}>{q}</option>)}
                               </select>
                            </div>
                            <div>
                               <label className={LABEL_CLASS}>Trạng thái công tác</label>
                               <select disabled={isViewMode} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className={INPUT_CLASS}>
                                  {statuses.length > 0 ? statuses.map(s => <option key={s} value={s}>{s}</option>) : Object.values(EmployeeStatus).map(s => <option key={s} value={s}>{s}</option>)}
                               </select>
                            </div>
                            <div>
                               <label className={LABEL_CLASS}>Ngày vào làm</label>
                               <input type="date" disabled={isViewMode} value={formData.joinDate} onChange={e => setFormData({...formData, joinDate: e.target.value})} className={INPUT_CLASS} />
                            </div>
                            <div>
                               <label className={LABEL_CLASS}>Ngày ký hợp đồng</label>
                               <input type="date" disabled={isViewMode} value={formData.contractDate} onChange={e => setFormData({...formData, contractDate: e.target.value})} className={INPUT_CLASS} />
                            </div>
                         </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                         <h4 className="text-sm font-bold text-gray-800 mb-5 flex items-center border-b border-gray-100 pb-3">
                            <MapPin size={18} className="mr-2 text-teal-600"/> Thông tin liên hệ
                         </h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                               <label className={LABEL_CLASS}>Địa chỉ thường trú</label>
                               <input type="text" disabled={isViewMode} value={formData.permanentAddress} onChange={e => setFormData({...formData, permanentAddress: e.target.value})} className={INPUT_CLASS} placeholder="Số nhà, đường, phường/xã..." />
                            </div>
                            <div>
                               <label className={LABEL_CLASS}>Số điện thoại</label>
                               <div className="relative">
                                  <Phone size={16} className="absolute top-3 left-3 text-gray-400"/>
                                  <input type="text" disabled={isViewMode} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={`${INPUT_CLASS} pl-10`} placeholder="0901234567" />
                               </div>
                            </div>
                            <div>
                               <label className={LABEL_CLASS}>Email</label>
                               <div className="relative">
                                  <Mail size={16} className="absolute top-3 left-3 text-gray-400"/>
                                  <input type="email" disabled={isViewMode} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={`${INPUT_CLASS} pl-10`} placeholder="email@benhvien.com" />
                               </div>
                            </div>
                         </div>
                      </div>
                      
                      <div>
                         <label className={LABEL_CLASS}>Ghi chú thêm</label>
                         <textarea disabled={isViewMode} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className={INPUT_CLASS} rows={3}></textarea>
                      </div>
                   </div>
                )}

                {/* TAB: ACCOUNT */}
                {activeTab === 'account' && (
                   <div className="flex flex-col items-center justify-center py-10 space-y-8 animate-fadeIn">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2 shadow-inner ring-4 ring-white">
                         <Lock size={36} />
                      </div>
                      
                      {currentEmployeeHasAccount ? (
                         <div className="text-center space-y-6 w-full max-w-md">
                            <div>
                                <h4 className="text-2xl font-bold text-gray-900 mb-2">Tài khoản đang hoạt động</h4>
                                <div className="inline-flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-200 shadow-sm">
                                   <CheckCircle size={18} className="mr-2"/> Đã cấp quyền truy cập
                                </div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-left space-y-3">
                                <div className="flex justify-between border-b pb-2">
                                   <span className="text-gray-500 text-sm">Username</span>
                                   <span className="font-mono font-medium text-gray-800">{existingUsers.find(u => u.employeeId === editingEmployee?.id)?.username}</span>
                                </div>
                                <div className="flex justify-between">
                                   <span className="text-gray-500 text-sm">Quyền hạn</span>
                                   <span className="uppercase text-xs font-bold bg-gray-100 px-2 py-1 rounded">{existingUsers.find(u => u.employeeId === editingEmployee?.id)?.role}</span>
                                </div>
                            </div>
                            
                            {currentUser.role === 'admin' && (
                               <div className="pt-4 border-t border-gray-200">
                                  <p className="text-sm text-gray-500 mb-3">Người dùng quên mật khẩu?</p>
                                  <AppButton variant="warning" icon={RotateCcw} onClick={handleResetPassword} className="w-full justify-center">
                                     Reset mật khẩu về mặc định (1)
                                  </AppButton>
                               </div>
                            )}
                         </div>
                      ) : (
                         <div className="text-center space-y-6 max-w-sm">
                            <div>
                                <h4 className="text-2xl font-bold text-gray-900 mb-2">Chưa có tài khoản</h4>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                   Nhân viên này chưa có tài khoản đăng nhập. Tạo tài khoản để họ có thể truy cập hệ thống.
                                </p>
                            </div>
                            <AppButton variant="primary" size="lg" icon={Key} onClick={handleCreateAccount} className="w-full justify-center shadow-lg shadow-teal-200">
                               Cấp tài khoản ngay
                            </AppButton>
                         </div>
                      )}
                   </div>
                )}

                {/* FOOTER ACTIONS */}
                {!isViewMode && (
                   <div className="flex justify-end pt-6 space-x-4 border-t border-gray-100 mt-10">
                     <AppButton type="button" variant="secondary" icon={X} onClick={() => setIsModalOpen(false)}>
                       Hủy bỏ
                     </AppButton>
                     <AppButton type="submit" variant="primary" icon={CheckCircle} className="px-6">
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

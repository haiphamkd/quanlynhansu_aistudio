
import React, { useState, useEffect } from 'react';
import { Settings, Plus, Pencil, Trash2, X, Save, Tag, Layers, GraduationCap, FileQuestion, MapPin, Activity, Building, Loader, RefreshCw } from 'lucide-react';
import { Category } from '../types';
import { dataService } from '../services/dataService';
import { AppButton } from '../components/AppButton';
import GenericTable from '../components/GenericTable';

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); // Trạng thái xử lý khi lưu
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState('ChucVu');

  const [formData, setFormData] = useState({
    type: 'ChucVu',
    value: '',
    notes: ''
  });

  const categoryTypes = [
    { code: 'ChucVu', label: 'Chức vụ', icon: Layers },
    { code: 'KhoaPhong', label: 'Khoa Phòng', icon: Building },
    { code: 'TrinhDo', label: 'Trình độ', icon: GraduationCap },
    { code: 'LyDo', label: 'Lý do', icon: FileQuestion },
    { code: 'NoiCap', label: 'Nơi cấp', icon: MapPin },
    { code: 'TrangThai', label: 'Trạng thái', icon: Activity }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dataService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCat(null);
    setFormData({ type: activeTab, value: '', notes: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (cat: Category) => {
    setEditingCat(cat);
    setFormData({
      type: cat.type,
      value: cat.value,
      notes: cat.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      setLoading(true); // Hiện loading bảng
      try {
        await dataService.deleteCategory(id);
        await loadData(); // Tải lại dữ liệu sau khi xóa
      } catch (error) {
        alert("Xóa thất bại. Vui lòng thử lại.");
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); // Bắt đầu loading nút Lưu
    
    try {
      let success = false;
      if (editingCat) {
        success = await dataService.updateCategory({ ...editingCat, ...formData });
      } else {
        success = await dataService.addCategory(formData);
      }

      if (success) {
        await loadData(); // Tải lại dữ liệu mới nhất
        setIsModalOpen(false); // Chỉ đóng modal khi đã tải xong
      } else {
        alert("Lưu dữ liệu thất bại. Vui lòng kiểm tra kết nối.");
      }
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi hệ thống.");
    } finally {
      setSubmitting(false); // Tắt loading nút Lưu
    }
  };

  const filteredCategories = categories.filter(c => c.type === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center">
             <Settings className="mr-2" /> Quản lý Danh mục
           </h2>
           <p className="text-gray-500 text-sm">Cấu hình các danh sách từ điển trong hệ thống</p>
        </div>
        <button 
          onClick={loadData} 
          className="p-2 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded-lg transition-colors" 
          title="Tải lại dữ liệu"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* TABS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
         <div className="flex flex-wrap gap-2">
            {categoryTypes.map((t) => {
               const Icon = t.icon;
               const isActive = activeTab === t.code;
               return (
                  <button
                    key={t.code}
                    onClick={() => setActiveTab(t.code)}
                    className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                       isActive 
                       ? 'bg-teal-50 text-teal-700 shadow-sm ring-1 ring-teal-200' 
                       : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                     <Icon size={16} className={`mr-2 ${isActive ? 'text-teal-600' : 'text-gray-400'}`} />
                     {t.label}
                  </button>
               );
            })}
         </div>
      </div>

      {/* CONTENT */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 min-h-[300px]">
         <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-700 flex items-center">
               Danh sách {categoryTypes.find(t => t.code === activeTab)?.label}
               <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">{filteredCategories.length}</span>
            </h3>
            <AppButton variant="primary" size="sm" icon={Plus} onClick={handleAdd}>Thêm mục mới</AppButton>
         </div>

         {loading ? (
           <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Loader className="animate-spin mb-2" size={32} />
              <p className="text-sm">Đang tải dữ liệu...</p>
           </div>
         ) : (
           <GenericTable<Category>
              data={filteredCategories}
              columns={[
                { header: 'Giá trị', accessor: 'value', className: 'font-semibold text-gray-800' },
                { header: 'Ghi chú', accessor: 'notes', className: 'text-gray-500' }
              ]}
              actions={(item) => (
                <div className="flex space-x-2 justify-end">
                    <button onClick={() => handleEdit(item)} className="p-1.5 text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded transition-colors"><Pencil size={16}/></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded transition-colors"><Trash2 size={16}/></button>
                </div>
              )}
           />
         )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6 border-b pb-2">
                 <h3 className="font-bold text-lg text-gray-800">{editingCat ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h3>
                 <button onClick={() => setIsModalOpen(false)} disabled={submitting} className="text-gray-400 hover:text-gray-600"><X /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại danh mục</label>
                    <select 
                       value={formData.type} 
                       disabled={true} 
                       className="block w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-gray-500 cursor-not-allowed"
                    >
                       {categoryTypes.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị hiển thị <span className="text-red-500">*</span></label>
                    <input 
                       type="text" required 
                       value={formData.value}
                       onChange={e => setFormData({...formData, value: e.target.value})}
                       className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                       placeholder="Nhập giá trị..."
                       autoFocus
                       disabled={submitting}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                    <textarea 
                       value={formData.notes}
                       onChange={e => setFormData({...formData, notes: e.target.value})}
                       className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                       rows={2}
                       disabled={submitting}
                    />
                 </div>
                 <div className="pt-4 flex justify-end space-x-3 border-t mt-2">
                    <AppButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>Hủy</AppButton>
                    <AppButton type="submit" variant="primary" icon={Save} loading={submitting}>
                      {editingCat ? 'Cập nhật' : 'Lưu'}
                    </AppButton>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;

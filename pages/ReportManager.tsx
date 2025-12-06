
import React, { useState, useEffect } from 'react';
import { FileText, Save, Pencil, Paperclip, X, Building, Trash2 } from 'lucide-react';
import GenericTable from '../components/GenericTable';
import { PrescriptionReport } from '../types';
import { dataService } from '../services/dataService';
import { formatDateVN } from '../utils/helpers';

const ReportManager: React.FC = () => {
  const [reports, setReports] = useState<PrescriptionReport[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  
  const getCurrentUser = () => {
    try {
      const saved = localStorage.getItem('pharmahr_user');
      return saved ? JSON.parse(saved) : { name: 'Guest', username: 'guest', role: 'staff' };
    } catch {
      return { name: 'Guest', username: 'guest', role: 'staff' };
    }
  };

  const currentUser = getCurrentUser();

  const initialFormState: PrescriptionReport = {
    id: '',
    date: new Date().toISOString().split('T')[0],
    totalIssued: 0,
    notReceived: 0,
    reason: '',
    reporter: currentUser.name,
    reporterId: currentUser.username,
    department: currentUser.department,
    attachmentUrls: []
  };

  const [formData, setFormData] = useState<PrescriptionReport>(initialFormState);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const deptFilter = currentUser.role === 'admin' ? 'All' : currentUser.department;
    const data = await dataService.getReports(deptFilter);
    setReports(data);
  };

  const handleEdit = (item: PrescriptionReport) => {
    if (currentUser.role !== 'admin' && item.reporterId !== currentUser.username) {
      alert("Bạn chỉ có thể sửa báo cáo do chính mình tạo.");
      return;
    }
    setFormData(item);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa báo cáo này?")) {
        await dataService.deleteReport(id);
        loadReports();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((f: any) => URL.createObjectURL(f));
      setFormData(prev => ({
        ...prev,
        attachmentUrls: [...(prev.attachmentUrls || []), ...newFiles]
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachmentUrls: prev.attachmentUrls?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newReport = {
      ...formData,
      id: isEditing ? formData.id : `R-${Date.now()}`,
      reporter: isEditing ? formData.reporter : currentUser.name,
      reporterId: isEditing ? formData.reporterId : currentUser.username,
      department: isEditing ? formData.department : currentUser.department,
    };

    await dataService.addReport(newReport); 
    loadReports();
    alert('Đã lưu báo cáo!');
    setFormData(initialFormState);
    setIsEditing(false);
  };

  const totalCalculated = (formData.totalIssued || 0) + (formData.notReceived || 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
        <FileText className="mr-2" /> Báo cáo Đơn thuốc
        {currentUser.department && <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex items-center"><Building size={12} className="mr-1"/>{currentUser.department}</span>}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Input */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 border-b pb-2 flex justify-between">
             {isEditing ? 'Chỉnh sửa báo cáo' : 'Nhập liệu trong ngày'}
             {isEditing && <button onClick={() => { setIsEditing(false); setFormData(initialFormState); }} className="text-xs text-red-500">Hủy</button>}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Ngày báo cáo</label>
              <input 
                type="date" required 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 h-10 bg-white shadow-sm" 
              />
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center mb-2">
                <span className="text-xs text-gray-500 uppercase font-semibold">Tổng đơn thuốc</span>
                <div className="text-2xl font-bold text-gray-800">{totalCalculated}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Đã cấp</label>
                <input 
                  type="number" required min="0"
                  value={formData.totalIssued}
                  onChange={e => setFormData({...formData, totalIssued: Number(e.target.value)})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 h-10 bg-white shadow-sm font-semibold text-blue-700" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Chưa nhận</label>
                <input 
                  type="number" required min="0"
                  value={formData.notReceived}
                  onChange={e => setFormData({...formData, notReceived: Number(e.target.value)})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 h-10 bg-white shadow-sm font-semibold text-red-600" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lý do chưa nhận</label>
              <textarea 
                value={formData.reason}
                onChange={e => setFormData({...formData, reason: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white shadow-sm"
                rows={3}
              ></textarea>
            </div>
            
            {/* File Attachment */}
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Đính kèm ảnh/đơn thuốc</label>
               <div className="flex flex-wrap gap-2 mb-2">
                 {formData.attachmentUrls?.map((url, idx) => (
                   <div key={idx} className="relative w-16 h-16 border rounded overflow-hidden group">
                      <img src={url} alt="att" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeFile(idx)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100">
                        <X size={12} />
                      </button>
                   </div>
                 ))}
                 <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-teal-500 hover:text-teal-500 text-gray-400">
                    <Paperclip size={20} />
                    <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                 </label>
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Người báo cáo</label>
              <input 
                type="text" disabled
                value={formData.reporter}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 h-10 bg-gray-50 text-gray-500" 
              />
            </div>
            <button 
              type="submit" 
              className="w-full h-10 flex justify-center items-center border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none"
            >
              <Save size={18} className="mr-2" /> {isEditing ? 'Cập nhật' : 'Lưu báo cáo'}
            </button>
          </form>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
           <h3 className="font-semibold text-gray-800 mb-4">Lịch sử báo cáo gần đây</h3>
           <GenericTable 
             data={[...reports].reverse().slice(0, 10)}
             columns={[
               { header: 'Ngày', accessor: (item) => formatDateVN(item.date) },
               { header: 'Tổng', accessor: (item) => <span className="font-bold">{(item.totalIssued || 0) + (item.notReceived || 0)}</span>, className: 'text-center bg-gray-50' },
               { header: 'Đã cấp', accessor: 'totalIssued', className: 'text-blue-600 font-medium text-center' },
               { header: 'Chưa nhận', accessor: 'notReceived', className: 'text-red-600 font-medium text-center' },
               { header: 'Lý do', accessor: 'reason' },
               { header: 'Người báo cáo', accessor: 'reporter' },
             ]}
             actions={(item) => (
               <div className="flex space-x-1 justify-end">
                   <button 
                     onClick={() => handleEdit(item)}
                     className={`p-1.5 rounded-md transition-colors ${
                       currentUser.role === 'admin' || item.reporterId === currentUser.username 
                       ? 'text-teal-600 hover:bg-teal-50' 
                       : 'text-gray-300 cursor-not-allowed'
                     }`}
                     disabled={!(currentUser.role === 'admin' || item.reporterId === currentUser.username)}
                   >
                     <Pencil size={16} />
                   </button>
                   {(currentUser.role === 'admin' || item.reporterId === currentUser.username) && (
                       <button 
                         onClick={() => handleDelete(item.id)}
                         className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                       >
                         <Trash2 size={16} />
                       </button>
                   )}
               </div>
             )}
           />
        </div>
      </div>
    </div>
  );
};

export default ReportManager;

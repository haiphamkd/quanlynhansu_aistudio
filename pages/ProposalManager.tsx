import React, { useState, useEffect } from 'react';
import { FileText, Paperclip, Plus, Trash2, Pencil, CheckCircle } from 'lucide-react';
import GenericTable from '../components/GenericTable';
import { Proposal } from '../types';
import { dataService } from '../services/dataService';
import { formatDateVN } from '../utils/helpers';

const ProposalManager: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Proposal>>({
    title: '',
    content: '',
    submitter: '',
    date: new Date().toISOString().split('T')[0],
    fileUrl: '',
    status: 'Chờ duyệt'
  });

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    const data = await dataService.getProposals();
    setProposals(data);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file); // Mock URL
      setFormData({ ...formData, fileUrl: url });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProp: Proposal = {
      ...formData as Proposal,
      id: `P-${Date.now()}`
    };
    await dataService.addProposal(newProp);
    loadProposals();
    setIsModalOpen(false);
  };

  // Fixed signature to accept string | number to match GenericTable constraints
  const handleDelete = (id: string | number) => {
    if(confirm("Bạn có chắc chắn muốn xóa tờ trình này?")) {
      // TODO: Call API to delete proposal
      alert("Đã xóa (Mô phỏng)");
      // refresh list after delete
      // loadProposals(); 
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FileText className="mr-2" /> Quản lý Tờ trình
        </h2>
        <button 
          onClick={() => { setFormData({title: '', content: '', submitter: '', date: new Date().toISOString().split('T')[0], status: 'Chờ duyệt'}); setIsModalOpen(true); }}
          className="h-10 bg-teal-600 text-white px-4 rounded-lg flex items-center hover:bg-teal-700 shadow-sm font-medium text-sm"
        >
          <Plus size={18} className="mr-2" /> Tạo tờ trình mới
        </button>
      </div>

      <GenericTable 
        data={[...proposals].reverse()}
        columns={[
          { header: 'Ngày', accessor: (item) => formatDateVN(item.date), className: 'w-28' },
          { header: 'Tiêu đề', accessor: 'title', className: 'font-medium' },
          { header: 'Người trình', accessor: 'submitter' },
          { 
            header: 'Trạng thái', 
            accessor: (item) => (
              <span className={`px-2 py-1 text-xs rounded-full ${
                item.status === 'Đã duyệt' ? 'bg-green-100 text-green-800' :
                item.status === 'Từ chối' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {item.status}
              </span>
            )
          },
          { 
            header: 'File đính kèm', 
            accessor: (item) => item.fileUrl && item.fileUrl !== '#' ? (
              <a href={item.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center">
                <Paperclip size={14} className="mr-1" /> Mở file
              </a>
            ) : <span className="text-gray-400 text-sm italic">Không có</span>
          }
        ]}
        actions={(item) => (
           <div className="flex space-x-2 justify-end">
              <button className="text-gray-500 hover:text-blue-600"><Pencil size={16} /></button>
              <button onClick={() => handleDelete(item.id)} className="text-gray-500 hover:text-red-600"><Trash2 size={16} /></button>
           </div>
        )}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold mb-4">Tạo tờ trình mới</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày</label>
                  <input 
                    type="date" required 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 h-10" 
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Người trình</label>
                   <input 
                     type="text" required 
                     value={formData.submitter}
                     onChange={e => setFormData({...formData, submitter: e.target.value})}
                     className="mt-1 block w-full border border-gray-300 rounded-md px-3 h-10" 
                   />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
                <input 
                  type="text" required 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 h-10" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Nội dung chi tiết</label>
                <textarea 
                  required 
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tải file lên</label>
                <div className="flex items-center mt-1">
                  <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md px-4 py-2 flex items-center text-sm text-gray-700">
                    <Paperclip size={16} className="mr-2" /> Chọn tài liệu
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                  </label>
                  {formData.fileUrl && <span className="ml-3 text-sm text-green-600 flex items-center"><CheckCircle size={14} className="mr-1"/> Đã đính kèm</span>}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="h-10 px-4 border rounded hover:bg-gray-50 text-sm font-medium">Hủy</button>
                <button type="submit" className="h-10 px-4 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm font-medium">Gửi tờ trình</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalManager;
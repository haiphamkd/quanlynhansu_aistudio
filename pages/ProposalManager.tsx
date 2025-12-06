import React, { useState, useEffect } from 'react';
// FIX: Added 'Save' to the import list from lucide-react.
import { FileText, Paperclip, Plus, Trash2, Pencil, CheckCircle, X, Eye, Image as ImageIcon, File as FileIcon, Download, ChevronLeft, ChevronRight, UploadCloud, Save } from 'lucide-react';
import GenericTable from '../components/GenericTable';
import { Proposal } from '../types';
import { dataService } from '../services/dataService';
import { formatDateVN } from '../utils/helpers';
import { AppButton } from '../components/AppButton';

// --- File Preview Modal Component ---
const FilePreviewModal: React.FC<{ files: string[], startIndex: number, onClose: () => void }> = ({ files, startIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const currentFile = files[currentIndex];

  const getFileType = (base64: string) => {
    if (base64.startsWith('data:image/')) return 'image';
    if (base64.startsWith('data:application/pdf')) return 'pdf';
    return 'other';
  };
  
  const fileType = getFileType(currentFile);
  const fileName = `download.${fileType === 'pdf' ? 'pdf' : 'png'}`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentFile;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex-none p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Xem trước tài liệu</h3>
          <div className="flex items-center space-x-2">
             <span className="text-sm font-mono bg-gray-200 text-gray-600 px-2 py-1 rounded-md">{currentIndex + 1} / {files.length}</span>
             <AppButton variant="secondary" size="sm" icon={Download} onClick={handleDownload}>Tải xuống</AppButton>
             <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full"><X size={20}/></button>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center bg-gray-100 relative">
          {fileType === 'image' && <img src={currentFile} className="max-w-full max-h-full object-contain" />}
          {fileType === 'pdf' && <iframe src={currentFile} className="w-full h-full border-none" title="PDF Preview"/>}
          {fileType === 'other' && (
            <div className="text-center text-gray-500 flex flex-col items-center">
              <FileIcon size={64} className="mb-4" />
              <p className="font-semibold">Không hỗ trợ xem trước</p>
              <p className="text-sm mb-4">Vui lòng tải về để xem.</p>
              <AppButton variant="primary" icon={Download} onClick={handleDownload}>Tải xuống</AppButton>
            </div>
          )}
          
          {/* Navigation */}
          {files.length > 1 && (
            <>
              <button 
                onClick={() => setCurrentIndex(p => (p - 1 + files.length) % files.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-transform active:scale-90"
              >
                <ChevronLeft />
              </button>
              <button 
                onClick={() => setCurrentIndex(p => (p + 1) % files.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-transform active:scale-90"
              >
                <ChevronRight />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


const ProposalManager: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<string[]>([]);
  const [previewStartIndex, setPreviewStartIndex] = useState(0);

  const initialFormState: Proposal = {
    id: '', title: '', proposalNumber: '', content: '', submitter: '',
    date: new Date().toISOString().split('T')[0],
    fileUrls: [], status: 'Chờ duyệt'
  };

  const [formData, setFormData] = useState<Proposal>(initialFormState);

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    setLoading(true);
    const data = await dataService.getProposals();
    setProposals(data);
    setLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // FIX: Explicitly type 'file' as File to resolve the 'unknown' to 'Blob' assignment error.
      const readers = Array.from(files).map((file: File) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then(newFileUrls => {
        setFormData(prev => ({ ...prev, fileUrls: [...(prev.fileUrls || []), ...newFileUrls] }));
      });
    }
  };
  
  const removeFile = (indexToRemove: number) => {
    setFormData(prev => ({ ...prev, fileUrls: prev.fileUrls?.filter((_, index) => index !== indexToRemove) }));
  };

  const handleEditClick = (item: Proposal) => {
    setEditingId(item.id);
    setFormData(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormState);
  };

  const handleViewFiles = (files: string[], startIndex: number = 0) => {
      setPreviewFiles(files);
      setPreviewStartIndex(startIndex);
      setIsPreviewOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const proposalData: Proposal = {
      ...formData,
      id: editingId || `P-${Date.now()}`,
    };

    if (editingId) {
        await dataService.updateProposal(proposalData);
    } else {
        await dataService.addProposal(proposalData);
    }
    
    await loadProposals();
    handleCancelEdit();
  };

  const handleDelete = async (id: string) => {
    if(confirm("Xóa tờ trình này?")) {
      alert("Đã xóa (Mô phỏng - Cần hàm delete trong service)");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FileText className="mr-3 text-teal-600" /> Quản lý Tờ trình
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORM SIDE */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit sticky top-6">
           <h3 className="text-lg font-bold text-gray-800 mb-5 border-b pb-3 flex justify-between items-center">
             {editingId ? 'Cập nhật Tờ trình' : 'Tạo Tờ trình mới'}
             {editingId && <AppButton variant="ghost" size="sm" icon={X} onClick={handleCancelEdit}>Hủy</AppButton>}
           </h3>
           <form onSubmit={handleSubmit} className="space-y-5">
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Số tờ trình</label>
                  <input type="text" value={formData.proposalNumber} onChange={e => setFormData({...formData, proposalNumber: e.target.value})} className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500" placeholder="VD: 123/TTr-KD"/>
               </div>
               <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Ngày</label>
                  <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500" />
               </div>
             </div>
             <div>
                 <label className="block text-xs font-semibold text-gray-600 mb-1">Người trình</label>
                 <input type="text" required value={formData.submitter} onChange={e => setFormData({...formData, submitter: e.target.value})} className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tiêu đề</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nội dung</label>
                <textarea required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="block w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500" rows={4} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Trạng thái</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500">
                    <option value="Chờ duyệt">Chờ duyệt</option>
                    <option value="Đã duyệt">Đã duyệt</option>
                    <option value="Từ chối">Từ chối</option>
                </select>
              </div>
              <div>
                 <label className="block text-xs font-semibold text-gray-600 mb-2">Tài liệu đính kèm ({formData.fileUrls?.length || 0})</label>
                 <div className="space-y-2">
                    {formData.fileUrls && formData.fileUrls.map((url, index) => {
                      const isImage = url.startsWith('data:image/');
                      return (
                         <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                           <div className="flex items-center space-x-2 truncate">
                              {isImage ? <ImageIcon className="text-teal-500" size={16}/> : <FileIcon className="text-gray-500" size={16}/>}
                              <span className="text-xs text-gray-600 truncate">File_{index + 1}.{isImage ? 'png' : 'pdf/doc'}</span>
                           </div>
                           <div className="flex items-center space-x-1">
                              <button type="button" onClick={() => handleViewFiles(formData.fileUrls!, index)} className="p-1 text-gray-400 hover:text-blue-600"><Eye size={14}/></button>
                              <button type="button" onClick={() => removeFile(index)} className="p-1 text-gray-400 hover:text-red-600"><X size={14}/></button>
                           </div>
                         </div>
                      );
                    })}
                 </div>
                 <label className="mt-2 flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
                        <UploadCloud size={32} className="mb-2" />
                        <p className="mb-1 text-sm"><span className="font-semibold">Bấm để tải lên</span> hoặc kéo thả</p>
                        <p className="text-xs">Hỗ trợ nhiều file (Ảnh, PDF, Word...)</p>
                    </div>
                    <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                 </label>
              </div>

              <div className="pt-4 border-t">
                <AppButton type="submit" variant="primary" icon={Save} className="w-full">
                  {editingId ? 'Lưu thay đổi' : 'Gửi tờ trình'}
                </AppButton>
              </div>
           </form>
        </div>

        {/* TABLE SIDE */}
        <div className="lg:col-span-2">
            <GenericTable 
                data={[...proposals].reverse()}
                columns={[
                { header: 'Số TT', accessor: (item) => <span className="font-mono text-teal-700 font-bold">{item.proposalNumber || '-'}</span>, className: 'w-24' },
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
                    header: 'Đính kèm', 
                    accessor: (item) => (item.fileUrls && item.fileUrls.length > 0) ? (
                    <button onClick={() => handleViewFiles(item.fileUrls!)} className="text-blue-600 hover:text-blue-800 flex items-center bg-blue-50 px-2 py-1 rounded text-xs font-medium">
                        <Paperclip size={12} className="mr-1" /> {item.fileUrls.length} file
                    </button>
                    ) : <span className="text-gray-400 text-xs italic">Không có</span>
                }
                ]}
                actions={(item) => (
                <div className="flex space-x-2 justify-end">
                    <button onClick={() => handleEditClick(item)} className="text-gray-500 hover:text-teal-600 p-1 bg-gray-100 rounded hover:bg-teal-50"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(item.id)} className="text-gray-500 hover:text-red-600 p-1 bg-gray-100 rounded hover:bg-red-50"><Trash2 size={16} /></button>
                </div>
                )}
            />
        </div>
      </div>
      
      {isPreviewOpen && <FilePreviewModal files={previewFiles} startIndex={previewStartIndex} onClose={() => setIsPreviewOpen(false)} />}
    </div>
  );
};

export default ProposalManager;
import React, { useState, useEffect } from 'react';
import { Star, Award, CheckCircle, Pencil, Trash2, X, UploadCloud, FileText, Eye, Paperclip, Download, ChevronLeft, ChevronRight, File as FileIcon } from 'lucide-react';
import GenericTable from '../components/GenericTable';
import { AnnualEvaluation, Employee, EvaluationRank, EmployeeStatus } from '../types';
import { dataService } from '../services/dataService';
import { AppButton } from '../components/AppButton';
import SearchableSelect from '../components/SearchableSelect';

// --- File Preview Modal (Copied from ReportManager for consistency) ---
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex-none p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Xem tài liệu đính kèm</h3>
          <div className="flex items-center space-x-2">
             <span className="text-sm font-mono bg-gray-200 text-gray-600 px-2 py-1 rounded-md">{currentIndex + 1} / {files.length}</span>
             <AppButton variant="secondary" size="sm" icon={Download} onClick={handleDownload}>Tải xuống</AppButton>
             <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full"><X size={20}/></button>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center bg-gray-100 relative overflow-hidden">
          {fileType === 'image' && <img src={currentFile} className="max-w-full max-h-full object-contain" />}
          {fileType === 'pdf' && <iframe src={currentFile} className="w-full h-full border-none" title="PDF Preview"/>}
          {fileType === 'other' && (
            <div className="text-center text-gray-500 flex flex-col items-center">
              <FileIcon size={64} className="mb-4" />
              <p className="font-semibold">Không hỗ trợ xem trước</p>
              <AppButton variant="primary" icon={Download} onClick={handleDownload} className="mt-4">Tải xuống</AppButton>
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


const EvaluationManager: React.FC = () => {
  const [evaluations, setEvaluations] = useState<AnnualEvaluation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Preview State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<string>('');

  // Generate years from 2015 to Current Year + 1
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2015 + 2 }, (_, i) => currentYear + 1 - i);

  const initialFormState = {
    employeeId: '',
    professional: 0, attitude: 0, discipline: 0,
    rank: EvaluationRank.GOOD, // Updated default: Hoàn thành tốt nhiệm vụ
    rewardProposal: 'Không',
    rewardTitle: 'Không', // Updated default: Không
    notes: '',
    attachmentUrl: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
      const [emps, evals] = await Promise.all([
        dataService.getEmployees(),
        dataService.getEvaluations()
      ]);
      setEmployees(emps.filter(e => e.status === EmployeeStatus.ACTIVE));
      setEvaluations(evals);
  };

  const handleEdit = (item: AnnualEvaluation) => {
    setEditingId(item.id);
    setFormData({
        employeeId: item.employeeId,
        professional: item.scoreProfessional,
        attitude: item.scoreAttitude,
        discipline: item.scoreDiscipline,
        rank: item.rank,
        rewardProposal: item.rewardProposal,
        rewardTitle: item.rewardTitle,
        notes: item.notes || '',
        attachmentUrl: item.attachmentUrl || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) {
        await dataService.deleteEvaluation(id);
        const updatedEvals = await dataService.getEvaluations();
        setEvaluations(updatedEvals);
        if (editingId === id) {
            handleCancel();
        }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData(initialFormState);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, attachmentUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleViewFile = (fileUrl: string) => {
      if (!fileUrl) return;
      setPreviewFile(fileUrl);
      setIsPreviewOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) return alert("Vui lòng chọn nhân viên");

    const employee = employees.find(e => e.id === formData.employeeId);
    if (!employee) return;
    
    if (!editingId) {
        const isDuplicate = evaluations.some(ev => 
            ev.employeeId === formData.employeeId && 
            ev.year === year
        );

        if (isDuplicate) {
            alert(`Nhân viên này đã có kết quả đánh giá cho năm ${year}. Vui lòng sửa đánh giá cũ nếu cần.`);
            return;
        }
    }

    const avg = parseFloat(((formData.professional + formData.attitude + formData.discipline) / 3).toFixed(1));
    
    const newEval: AnnualEvaluation = {
      id: editingId || `E-${year}-${employee.id}`,
      year: year,
      employeeId: employee.id,
      fullName: employee.fullName,
      position: employee.position,
      scoreProfessional: formData.professional,
      scoreAttitude: formData.attitude,
      scoreDiscipline: formData.discipline,
      averageScore: avg,
      rank: formData.rank,
      rewardProposal: formData.rewardProposal,
      rewardTitle: formData.rewardTitle,
      notes: formData.notes,
      attachmentUrl: formData.attachmentUrl
    };

    if (editingId) {
        await dataService.updateEvaluation(newEval);
        alert("Đã cập nhật đánh giá!");
    } else {
        await dataService.addEvaluation(newEval);
        alert("Đã lưu đánh giá mới!");
    }

    const updatedEvals = await dataService.getEvaluations();
    setEvaluations(updatedEvals);
    
    setEditingId(null);
    setFormData(initialFormState);
  };

  const filteredEvaluations = evaluations.filter(e => e.year === year);
  
  const employeeOptions = employees.map(e => ({
      value: e.id,
      label: `${e.fullName} (${e.position})`
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Star className="mr-2 text-yellow-500" /> Đánh giá thi đua năm {year}
        </h2>
        
        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
            <span className="text-gray-600 text-sm font-medium">Chọn năm:</span>
            <select 
                value={year} onChange={(e) => setYear(Number(e.target.value))}
                className="border-gray-300 rounded-md border p-1 bg-gray-50 text-sm font-bold text-teal-700"
            >
                {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                ))}
            </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-fit sticky top-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center justify-between border-b pb-2">
            <span className="flex items-center">
               <Award className="mr-2 text-teal-600" /> 
               {editingId ? 'Cập nhật đánh giá' : 'Nhập đánh giá mới'}
            </span>
            {editingId && (
                <button onClick={handleCancel} className="text-xs text-red-500 flex items-center hover:underline">
                    <X size={12} className="mr-1"/> Hủy
                </button>
            )}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chọn nhân viên</label>
              <SearchableSelect 
                 options={employeeOptions}
                 value={formData.employeeId}
                 onChange={(value) => setFormData({...formData, employeeId: value})}
                 placeholder="-- Tìm và chọn nhân viên --"
                 disabled={!!editingId}
              />
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2 text-center">Điểm thành phần (0-100)</p>
                <div className="grid grid-cols-3 gap-2">
                <div>
                    <label className="block text-[10px] font-medium text-gray-600 text-center mb-1">Chuyên môn</label>
                    <input 
                    type="number" min="0" max="100" required
                    value={formData.professional}
                    onChange={e => setFormData({...formData, professional: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md p-1.5 text-center text-sm font-semibold"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-medium text-gray-600 text-center mb-1">Thái độ</label>
                    <input 
                    type="number" min="0" max="100" required
                    value={formData.attitude}
                    onChange={e => setFormData({...formData, attitude: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md p-1.5 text-center text-sm font-semibold"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-medium text-gray-600 text-center mb-1">Kỷ luật</label>
                    <input 
                    type="number" min="0" max="100" required
                    value={formData.discipline}
                    onChange={e => setFormData({...formData, discipline: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md p-1.5 text-center text-sm font-semibold"
                    />
                </div>
                </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Xếp loại thi đua</label>
               <select 
                  value={formData.rank}
                  onChange={e => setFormData({...formData, rank: e.target.value as EvaluationRank})}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 bg-white"
               >
                 {Object.values(EvaluationRank).map(r => <option key={r} value={r}>{r}</option>)}
               </select>
            </div>

            <div className="grid grid-cols-1 gap-3">
               <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Đề nghị khen thưởng</label>
                  <select 
                     value={formData.rewardProposal}
                     onChange={e => setFormData({...formData, rewardProposal: e.target.value})}
                     className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="Không">Không</option>
                    <option value="Bệnh viện">Bệnh viện</option>
                    <option value="Sở Y tế">Sở Y tế</option>
                    <option value="UBND">UBND</option>
                    <option value="Chính phủ">Chính phủ</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Danh hiệu</label>
                  <select 
                     value={formData.rewardTitle}
                     onChange={e => setFormData({...formData, rewardTitle: e.target.value})}
                     className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="Không">Không</option>
                    <option value="Lao động tiên tiến">Lao động tiên tiến</option>
                    <option value="Giấy khen">Giấy khen</option>
                    <option value="Chiến sĩ thi đua">Chiến sĩ thi đua</option>
                  </select>
               </div>
            </div>

            {/* Attachments Section */}
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Tài liệu đính kèm (Báo cáo/Ảnh)</label>
               <div className="border border-gray-300 border-dashed rounded-lg p-3 bg-gray-50 hover:bg-white transition-colors">
                  {formData.attachmentUrl ? (
                     <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                        <div className="flex items-center space-x-2 truncate">
                           <FileText size={16} className="text-teal-600 shrink-0"/>
                           <span className="text-xs text-gray-600 truncate max-w-[150px]">File đính kèm</span>
                        </div>
                        <div className="flex space-x-1">
                           <button type="button" onClick={() => handleViewFile(formData.attachmentUrl)} className="p-1 hover:bg-gray-100 rounded text-blue-500"><Eye size={14}/></button>
                           <button type="button" onClick={() => setFormData({...formData, attachmentUrl: ''})} className="p-1 hover:bg-red-50 rounded text-red-500"><X size={14}/></button>
                        </div>
                     </div>
                  ) : (
                     <label className="flex items-center justify-center cursor-pointer py-2">
                        <UploadCloud size={20} className="text-gray-400 mr-2"/>
                        <span className="text-xs text-gray-500">Tải lên file</span>
                        <input type="file" className="hidden" onChange={handleFileUpload} />
                     </label>
                  )}
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <textarea 
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                rows={2}
              ></textarea>
            </div>

            <div className="flex space-x-2 pt-2">
                {editingId && (
                    <button 
                      type="button"
                      onClick={handleCancel}
                      className="w-1/3 h-10 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                    >
                      Hủy
                    </button>
                )}
                <button 
                  type="submit"
                  className={`flex-1 h-10 rounded-lg text-white font-medium flex items-center justify-center transition-colors text-sm shadow-sm ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-600 hover:bg-teal-700'}`}
                >
                  <CheckCircle size={16} className="mr-2" /> 
                  {editingId ? 'Cập nhật' : 'Lưu đánh giá'}
                </button>
            </div>
          </form>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2 space-y-4">
          <GenericTable<AnnualEvaluation>
            data={filteredEvaluations}
            columns={[
              { header: 'Nhân viên', accessor: (item) => (
                <div>
                   <div className="font-bold text-gray-800">{item.fullName}</div>
                   <div className="text-xs text-gray-500">{item.position}</div>
                </div>
              )},
              { header: 'Điểm TB', accessor: (item) => <span className="font-bold text-teal-700">{item.averageScore}</span>, className: 'text-center' },
              { 
                header: 'Xếp loại', 
                accessor: (item) => (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    item.rank === EvaluationRank.EXCELLENT ? 'bg-purple-100 text-purple-800 border-purple-200' :
                    item.rank === EvaluationRank.GOOD ? 'bg-green-100 text-green-800 border-green-200' :
                    item.rank === EvaluationRank.COMPLETED ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    item.rank === EvaluationRank.NOT_COMPLETED ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {item.rank}
                  </span>
                )
              },
              { header: 'Khen thưởng', accessor: (item) => (
                <div className="text-xs">
                   {item.rewardProposal !== 'Không' && <div className="text-gray-600">Đề nghị: {item.rewardProposal}</div>}
                   {item.rewardTitle !== 'Không' && <div className="font-bold text-teal-700">{item.rewardTitle}</div>}
                   {item.rewardProposal === 'Không' && item.rewardTitle === 'Không' && <span className="text-gray-400">-</span>}
                </div>
              )},
              { 
                 header: '', 
                 accessor: (item) => item.attachmentUrl ? (
                    <button onClick={() => handleViewFile(item.attachmentUrl!)} className="text-blue-500 hover:bg-blue-50 p-1 rounded" title="Xem đính kèm">
                        <Paperclip size={16}/>
                    </button>
                 ) : null,
                 className: 'w-10'
              },
            ]}
            actions={(item) => (
               <div className="flex space-x-1 justify-end">
                  <button 
                     onClick={() => handleEdit(item)}
                     className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                     title="Sửa"
                  >
                     <Pencil size={16} />
                  </button>
                  <button 
                     onClick={() => handleDelete(item.id)}
                     className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                     title="Xóa"
                  >
                     <Trash2 size={16} />
                  </button>
               </div>
            )}
          />
        </div>
      </div>
      
      {isPreviewOpen && <FilePreviewModal files={[previewFile]} startIndex={0} onClose={() => setIsPreviewOpen(false)} />}
    </div>
  );
};

export default EvaluationManager;
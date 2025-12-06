import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Save, History, QrCode, Scan, Clock, Lock, Sun, Moon } from 'lucide-react';
import { Attendance, Employee, EmployeeStatus } from '../types';
import { dataService } from '../services/dataService';
import { formatDateVN, getCurrentTime } from '../utils/helpers';
import { AppButton } from '../components/AppButton';
// FIX: Added missing import for GenericTable component.
import GenericTable from '../components/GenericTable';

// A type combining Employee and their shift records for the day
type DailyAttendanceRecord = {
  employee: Employee;
  morning: Attendance;
  afternoon: Attendance;
}

const AttendanceManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'history' | 'qr'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyRecords, setDailyRecords] = useState<DailyAttendanceRecord[]>([]);
  const [historyRecords, setHistoryRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qrEmployee, setQrEmployee] = useState<Employee | null>(null);

  const getUser = () => {
    try {
      const saved = localStorage.getItem('pharmahr_user');
      return saved ? JSON.parse(saved) : { role: 'staff', department: 'Khoa Dược' };
    } catch { return { role: 'staff', department: 'Khoa Dược' }; }
  };
  const currentUser = getUser();

  const loadAndPrepareDailyData = useCallback(async () => {
    setLoading(true);
    try {
      const deptFilter = currentUser.role === 'admin' ? 'All' : currentUser.department;
      
      const [allEmployees, allAttendance] = await Promise.all([
        dataService.getEmployees(deptFilter),
        dataService.getAttendance(deptFilter)
      ]);
      
      const activeEmployees = allEmployees.filter(e => e.status === EmployeeStatus.ACTIVE);
      const attendanceForDate = allAttendance.filter(a => a.date === selectedDate);
      
      const preparedData: DailyAttendanceRecord[] = activeEmployees.map(emp => {
        const morningRecord = attendanceForDate.find(a => a.employeeId === emp.id && a.shift === 'Sáng');
        const afternoonRecord = attendanceForDate.find(a => a.employeeId === emp.id && a.shift === 'Chiều');
        
        return {
          employee: emp,
          morning: morningRecord || {
            id: `${emp.id}-${selectedDate}-Sáng`, employeeId: emp.id, employeeName: emp.fullName, department: emp.department,
            date: selectedDate, shift: 'Sáng', status: 'Chưa quét',
          },
          afternoon: afternoonRecord || {
            id: `${emp.id}-${selectedDate}-Chiều`, employeeId: emp.id, employeeName: emp.fullName, department: emp.department,
            date: selectedDate, shift: 'Chiều', status: 'Chưa quét',
          }
        };
      });
      
      setDailyRecords(preparedData);
      setQrEmployee(activeEmployees[0] || null); // Set initial QR
      
    } catch (error) {
      console.error("Error preparing daily data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, currentUser.role, currentUser.department]);
  
  // Load data for the selected date
  useEffect(() => {
    loadAndPrepareDailyData();
  }, [selectedDate, loadAndPrepareDailyData]);
  
  // Load history data once
  useEffect(() => {
    const fetchHistory = async () => {
      const deptFilter = currentUser.role === 'admin' ? 'All' : currentUser.department;
      setHistoryRecords(await dataService.getAttendance(deptFilter));
    };
    fetchHistory();
  }, [currentUser.role, currentUser.department]);

  const handleRecordUpdate = (employeeId: string, shift: 'Sáng' | 'Chiều', updates: Partial<Attendance>) => {
    setDailyRecords(prevRecords => 
      prevRecords.map(rec => {
        if (rec.employee.id === employeeId) {
          const key = shift === 'Sáng' ? 'morning' : 'afternoon';
          return {
            ...rec,
            [key]: { ...rec[key], ...updates }
          };
        }
        return rec;
      })
    );
  };
  
  const saveDailyAttendance = async () => {
    setSaving(true);
    // Flatten the records and filter out the untouched ones
    const recordsToSave = dailyRecords.flatMap(rec => [rec.morning, rec.afternoon])
      .filter(att => att.status !== 'Chưa quét');
      
    if (recordsToSave.length === 0) {
      alert("Không có thay đổi nào để lưu.");
      setSaving(false);
      return;
    }

    const result = await dataService.saveAttendance(recordsToSave);
    if (result.success) {
      alert('Đã lưu chấm công thành công!');
      // Refresh history tab
      const deptFilter = currentUser.role === 'admin' ? 'All' : currentUser.department;
      setHistoryRecords(await dataService.getAttendance(deptFilter));
    } else {
      alert(`Lưu thất bại: ${result.error}\nVui lòng đảm bảo bạn đã chạy lệnh SQL để tạo UNIQUE constraint hoặc PRIMARY KEY.`);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Chấm Công</h2>
           <p className="text-sm text-gray-500">Quản lý thời gian làm việc theo ca Sáng/Chiều</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
           {['daily', 'history', 'qr'].map(tab => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
             >
               {tab === 'daily' && <span className="flex items-center"><Scan size={16} className="mr-2"/> Chấm công ngày</span>}
               {tab === 'history' && <span className="flex items-center"><History size={16} className="mr-2"/> Lịch sử</span>}
               {tab === 'qr' && <span className="flex items-center"><QrCode size={16} className="mr-2"/> Mã QR</span>}
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'daily' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
             <div className="flex items-center space-x-3">
                <span className="text-gray-600 font-medium text-sm">Ngày chấm công:</span>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white shadow-sm" />
             </div>
             <AppButton onClick={saveDailyAttendance} loading={saving} icon={Save}>
               Lưu dữ liệu
             </AppButton>
          </div>

          <div className="overflow-x-auto">
            {loading ? <div className="p-10 text-center">Đang tải dữ liệu...</div> : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4">Nhân viên</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Ca</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">Giờ vào</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {dailyRecords.map((record, idx) => (
                  <React.Fragment key={record.employee.id}>
                    {/* Morning Row */}
                    <tr className="border-t border-gray-100 hover:bg-gray-50/50">
                      <td className="px-6 py-3 whitespace-nowrap" rowSpan={2}>
                        <div className="font-bold text-gray-900">{record.employee.fullName}</div>
                        <div className="text-xs text-gray-400 font-mono">{record.employee.id}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-blue-700 font-semibold flex items-center"><Sun size={14} className="mr-2"/> Sáng</td>
                      <td className="px-4 py-3">
                         {record.morning.timeIn ? (
                           <div className="flex items-center text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-md w-fit border border-emerald-100">
                             <Clock size={14} className="mr-1.5" /> {record.morning.timeIn}
                           </div>
                         ) : (
                           <button onClick={() => handleRecordUpdate(record.employee.id, 'Sáng', { status: 'Đi làm', timeIn: getCurrentTime() })} className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-md hover:bg-blue-100 transition-colors border border-blue-100">
                             <Scan size={14} className="mr-1.5" /> Quét thủ công
                           </button>
                         )}
                      </td>
                      <td className="px-4 py-3">
                        <select 
                          value={record.morning.status} 
                          onChange={(e) => handleRecordUpdate(record.employee.id, 'Sáng', { status: e.target.value as any })}
                          className="block w-full text-sm border-gray-200 rounded-lg shadow-sm py-1.5 pl-2 pr-8 focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                        >
                           <option value="Chưa quét">-- Chọn --</option>
                           <option value="Đi làm">Đi làm</option><option value="Nghỉ phép">Nghỉ phép</option><option value="Nghỉ bệnh">Nghỉ bệnh</option><option value="Trễ">Trễ</option><option value="Khác">Khác</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input type="text" value={record.morning.notes || ''} onChange={(e) => handleRecordUpdate(record.employee.id, 'Sáng', { notes: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-full focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-shadow" placeholder="Ghi chú..." />
                      </td>
                    </tr>
                    {/* Afternoon Row */}
                    <tr className="border-b border-gray-200 hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-sm text-orange-700 font-semibold flex items-center"><Moon size={14} className="mr-2"/> Chiều</td>
                      <td className="px-4 py-3">
                         {record.afternoon.timeIn ? (
                           <div className="flex items-center text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-md w-fit border border-emerald-100">
                             <Clock size={14} className="mr-1.5" /> {record.afternoon.timeIn}
                           </div>
                         ) : (
                           <button onClick={() => handleRecordUpdate(record.employee.id, 'Chiều', { status: 'Đi làm', timeIn: getCurrentTime() })} className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-md hover:bg-blue-100 transition-colors border border-blue-100">
                             <Scan size={14} className="mr-1.5" /> Quét thủ công
                           </button>
                         )}
                      </td>
                      <td className="px-4 py-3">
                        <select 
                          value={record.afternoon.status} 
                          onChange={(e) => handleRecordUpdate(record.employee.id, 'Chiều', { status: e.target.value as any })}
                          className="block w-full text-sm border-gray-200 rounded-lg shadow-sm py-1.5 pl-2 pr-8 focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                        >
                           <option value="Chưa quét">-- Chọn --</option>
                           <option value="Đi làm">Đi làm</option><option value="Nghỉ phép">Nghỉ phép</option><option value="Nghỉ bệnh">Nghỉ bệnh</option><option value="Trễ">Trễ</option><option value="Khác">Khác</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input type="text" value={record.afternoon.notes || ''} onChange={(e) => handleRecordUpdate(record.employee.id, 'Chiều', { notes: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-full focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-shadow" placeholder="Ghi chú..." />
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {currentUser.role !== 'admin' && (
             <div className="bg-amber-50 p-3 border-b border-amber-100 flex items-center text-sm text-amber-800">
               <Lock size={16} className="mr-2" /> Chỉ xem (Quyền hạn chế)
             </div>
          )}
          <GenericTable<Attendance>
            data={historyRecords}
            columns={[
              { header: 'Ngày', accessor: (item) => formatDateVN(item.date) },
              { header: 'Nhân viên', accessor: 'employeeName' },
              { header: 'Ca', accessor: 'shift'},
              { header: 'Giờ vào', accessor: (item) => item.timeIn || '--:--' },
              { header: 'Trạng thái', accessor: (item) => <span className={`px-2 py-1 text-xs rounded-full font-medium ${item.status === 'Đi làm' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>{item.status}</span> },
              { header: 'Ghi chú', accessor: 'notes' },
            ]}
          />
        </div>
      )}

      {activeTab === 'qr' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                 <h3 className="text-lg font-bold mb-4 text-gray-800">Mã QR Nhân viên</h3>
                 <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {dailyRecords.map(rec => (
                       <div key={rec.employee.id} onClick={() => setQrEmployee(rec.employee)} className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${qrEmployee?.id === rec.employee.id ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500' : 'hover:bg-gray-50 border-gray-200'}`}>
                          <div><p className="font-semibold text-gray-800 text-sm">{rec.employee.fullName}</p><p className="text-xs text-gray-500">{rec.employee.id}</p></div>
                          <QrCode size={18} className="text-gray-400" />
                       </div>
                    ))}
                 </div>
              </div>
              <div className="flex flex-col items-center justify-center border-l border-gray-100 pl-4">
                 {qrEmployee ? (
                    <div className="text-center p-8 bg-white shadow-xl rounded-2xl border border-gray-100">
                       <h4 className="font-bold text-lg text-gray-900 mb-1">{qrEmployee.fullName}</h4>
                       <p className="text-gray-500 text-sm mb-6">{qrEmployee.position}</p>
                       <div className="bg-white p-2 inline-block border border-gray-200 rounded-xl shadow-inner">
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({id: qrEmployee.id, name: qrEmployee.fullName}))}`} alt="QR" className="w-48 h-48 rounded-lg" />
                       </div>
                    </div>
                 ) : (
                    <div className="text-center text-gray-400">
                       <QrCode size={64} className="mx-auto mb-4 opacity-20" />
                       <p className="text-sm">Chọn nhân viên để xem mã</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManager;
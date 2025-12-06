
import React, { useState, useEffect } from 'react';
import { Calendar, Save, Printer, ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';
import { Shift, Employee } from '../types';
import { dataService } from '../services/dataService';
import { formatDateVN } from '../utils/helpers';

const ShiftManager: React.FC = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculate start/end of week (Monday to Sunday)
  const getWeekRange = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(date.setDate(diff));
    const sunday = new Date(date.setDate(monday.getDate() + 6));
    return { monday, sunday };
  };

  const { monday, sunday } = getWeekRange(new Date(currentWeek));

  useEffect(() => {
    loadData();
  }, [currentWeek]);

  const loadData = async () => {
    setLoading(true);
    const [empData, shiftData] = await Promise.all([
      dataService.getEmployees(),
      dataService.getShifts()
    ]);
    setEmployees(empData);
    setShifts(shiftData);
    setLoading(false);
  };

  const changeWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const getShiftData = (ca: 'Sáng' | 'Chiều' | 'Đêm' | 'Cả ngày') => {
    const startStr = monday.toISOString().split('T')[0];
    const id = `${startStr}-${ca}`;
    return shifts.find(s => s.id === id) || {
       id, weekStart: startStr, weekEnd: sunday.toISOString().split('T')[0],
       ca, mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: ''
    };
  };

  const handleCellChange = (ca: 'Sáng' | 'Chiều' | 'Đêm' | 'Cả ngày', day: keyof Shift, value: string) => {
    const current = getShiftData(ca);
    const updated = { ...current, [day]: value };
    // Optimistic update logic if needed, or just save immediately
    saveShift(updated);
  };

  const saveShift = async (shift: Shift) => {
     await dataService.saveShift(shift);
     loadData();
  };

  const days = [
    { key: 'mon', label: 'Thứ Hai', date: monday },
    { key: 'tue', label: 'Thứ Ba', date: new Date(monday.getTime() + 86400000) },
    { key: 'wed', label: 'Thứ Tư', date: new Date(monday.getTime() + 86400000*2) },
    { key: 'thu', label: 'Thứ Năm', date: new Date(monday.getTime() + 86400000*3) },
    { key: 'fri', label: 'Thứ Sáu', date: new Date(monday.getTime() + 86400000*4) },
    { key: 'sat', label: 'Thứ Bảy', date: new Date(monday.getTime() + 86400000*5) },
    { key: 'sun', label: 'Chủ Nhật', date: new Date(monday.getTime() + 86400000*6) },
  ];

  const cas = [
    { name: 'Sáng', color: 'bg-blue-100 text-blue-900 border-blue-200', time: '7:00 - 14:00' },
    { name: 'Chiều', color: 'bg-orange-100 text-orange-900 border-orange-200', time: '14:00 - 21:00' },
    { name: 'Đêm', color: 'bg-purple-100 text-purple-900 border-purple-200', time: '21:00 - 7:00' },
    { name: 'Cả ngày', color: 'bg-teal-100 text-teal-900 border-teal-200', time: '7:00 - 17:00' },
  ];

  const EmployeeSelect = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => (
    <div className="relative group h-full">
       <div className={`flex items-center justify-center p-2 rounded cursor-pointer min-h-[50px] h-full transition-colors ${value ? 'hover:bg-black/5' : 'hover:bg-gray-100'}`}>
         {value ? (
           <div className="text-center w-full">
             <div className="font-bold text-sm text-gray-800 break-words leading-tight">{value}</div>
           </div>
         ) : (
           <span className="text-gray-300 text-xs font-medium">+ Chọn</span>
         )}
       </div>
       {/* Simple Dropdown simulation */}
       <select 
         className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
         value={value}
         onChange={(e) => onChange(e.target.value)}
       >
         <option value="">-- Trống --</option>
         {employees.map(e => (
           <option key={e.id} value={e.fullName}>{e.fullName}</option>
         ))}
       </select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
         <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Calendar className="mr-2" /> Lịch trực
         </h2>
         <div className="flex items-center space-x-2">
            <button className="flex items-center px-4 py-2 bg-white border rounded hover:bg-gray-50 text-gray-700 font-medium" onClick={() => window.print()}>
               <Printer size={16} className="mr-2" /> In lịch
            </button>
            <button className="flex items-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 font-medium shadow-sm">
               <Save size={16} className="mr-2" /> Lưu thay đổi
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         {/* Calendar Widget */}
         <div className="lg:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
               <button onClick={() => changeWeek('prev')} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronLeft /></button>
               <span className="font-bold text-lg text-gray-800">
                 {monday.toLocaleDateString('vi-VN', {month: 'long', year: 'numeric'})}
               </span>
               <button onClick={() => changeWeek('next')} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronRight /></button>
            </div>
            {/* Legend */}
            <div className="mt-4 space-y-3">
               <h4 className="font-bold text-sm text-gray-700 uppercase tracking-wide mb-3">Chú thích ca trực</h4>
               {cas.map(c => (
                 <div key={c.name} className={`flex items-center p-2 rounded-lg border ${c.color}`}>
                    <span className="font-bold text-sm w-16">{c.name}</span>
                    <span className="text-xs opacity-80 border-l border-current pl-2 ml-2">{c.time}</span>
                 </div>
               ))}
            </div>
         </div>

         {/* Weekly Grid */}
         <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
            <div className="p-4 border-b flex items-center justify-center font-bold text-gray-700 bg-gray-50/50">
               <button onClick={() => changeWeek('prev')} className="mr-6 p-1 rounded hover:bg-gray-200"><ChevronLeft size={20} /></button>
               <span className="text-lg">Tuần {formatDateVN(monday.toISOString().split('T')[0])} - {formatDateVN(sunday.toISOString().split('T')[0])}</span>
               <button onClick={() => changeWeek('next')} className="ml-6 p-1 rounded hover:bg-gray-200"><ChevronRight size={20} /></button>
            </div>
            
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                   <th className="px-4 py-3 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase w-24 border-r">Ca trực</th>
                   {days.map(d => (
                     <th key={d.key} className="px-2 py-3 bg-gray-50 text-center text-xs font-bold text-gray-500 uppercase border-l min-w-[100px]">
                        {d.label}<br/>
                        <span className="text-gray-400 font-normal">{d.date.getDate()}/{d.date.getMonth()+1}</span>
                     </th>
                   ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                 {cas.map(ca => {
                    const data = getShiftData(ca.name as any);
                    return (
                      <tr key={ca.name}>
                         <td className={`px-4 py-4 whitespace-nowrap text-sm font-bold border-r border-b ${ca.color}`}>
                            {ca.name}
                         </td>
                         {days.map(d => (
                            <td key={d.key} className="px-1 py-1 border-l border-b relative h-24 align-top">
                               <EmployeeSelect 
                                 value={(data as any)[d.key]} 
                                 onChange={(val) => handleCellChange(ca.name as any, d.key as keyof Shift, val)}
                               />
                            </td>
                         ))}
                      </tr>
                    );
                 })}
              </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default ShiftManager;

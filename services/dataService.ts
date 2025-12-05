
import { Employee, FundTransaction, PrescriptionReport, Attendance, AnnualEvaluation, Proposal, User, Shift, TempData } from '../types';
import { MOCK_EMPLOYEES, MOCK_FUNDS, MOCK_REPORTS, MOCK_ATTENDANCE, MOCK_EVALUATIONS, MOCK_PROPOSALS } from './mockData';

// Default URL (can be overwritten)
const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbxkVcJmyvpGKSD7ZJSbtN4xtPBRxj_fQGzdWZRd-ALgWtFVAcNh_Hpjr6MhVhsixmLP3A/exec';

class DataService {
  private apiUrl: string = '';
  private isDemoMode: boolean = false;

  // Cache data
  private employees: Employee[] = [...MOCK_EMPLOYEES];
  private funds: FundTransaction[] = [...MOCK_FUNDS];
  private reports: PrescriptionReport[] = [...MOCK_REPORTS];
  private attendance: Attendance[] = [...MOCK_ATTENDANCE];
  private evaluations: AnnualEvaluation[] = [...MOCK_EVALUATIONS];
  private proposals: Proposal[] = [...MOCK_PROPOSALS];
  private shifts: Shift[] = [];
  private tempData: TempData[] = [
    { type: 'TrinhDo', value: 'Dược sĩ Đại học' },
    { type: 'TrangThai', value: 'Đang làm việc' }
  ];

  constructor() {
    // Try to load URL from local storage
    if (typeof localStorage !== 'undefined') {
      this.apiUrl = localStorage.getItem('pharmahr_api_url') || DEFAULT_API_URL;
    } else {
      this.apiUrl = DEFAULT_API_URL;
    }
  }

  setApiUrl(url: string) {
    this.apiUrl = url;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pharmahr_api_url', url);
    }
  }

  getApiUrl() {
    return this.apiUrl;
  }

  setDemoMode(enabled: boolean) {
    this.isDemoMode = enabled;
  }

  isDemo() {
    return this.isDemoMode;
  }

  async testConnection(): Promise<{success: boolean, message: string}> {
    if (!this.apiUrl) return { success: false, message: 'Chưa cấu hình URL' };
    
    try {
       // Use no-cors mode just to check if request can be sent without network error
       // Note: Google Apps Script with 'text/plain' usually returns opaque response in no-cors, 
       // but we use standard POST here to try and get a result.
       const response = await fetch(`${this.apiUrl}?action=test`, {
          method: 'POST',
          body: JSON.stringify({ action: 'test' }),
          // Important: No headers to trigger Simple Request
       });
       
       // If we get here, network is likely okay even if GAS returns weird stuff
       return { success: true, message: 'Kết nối máy chủ thành công!' };
    } catch (e: any) {
       return { success: false, message: e.message || 'Lỗi kết nối mạng' };
    }
  }

  private async callApi(action: string, data: any = {}) {
    if (this.isDemoMode) return null; // Fallback to mock
    
    try {
      // 1. Prepare Payload
      // We wrap everything in a 'data' param to support the form-data hack if needed, 
      // or just send raw JSON string in body for text/plain
      const payload = {
        action: action,
        ...data
      };

      // 2. Send Request
      // Using POST with NO HEADERS => text/plain (Simple Request) => Bypasses CORS Preflight
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // 3. Handle Response
      const text = await response.text();
      
      try {
        const json = JSON.parse(text);
        if (json.error) {
           console.error("GAS Error:", json.error);
           throw new Error(json.error);
        }
        return json;
      } catch (parseError) {
        console.warn("Non-JSON response:", text);
        // If response is HTML error from Google, throw it
        if (text.includes('<!DOCTYPE html>')) {
           throw new Error("URL sai hoặc Script bị lỗi (Trả về HTML)");
        }
        throw parseError;
      }
    } catch (error) {
      console.error(`API Call Failed [${action}]:`, error);
      throw error; // Re-throw to let caller handle or switch to mock
    }
  }

  // --- Auth ---
  async login(username: string, password: string): Promise<{success: boolean, user?: User, error?: string}> {
    if (this.isDemoMode) {
      // Mock Login
      if (username === 'admin' && password === 'admin') 
        return { success: true, user: { username: 'admin', role: 'admin', name: 'Quản trị viên (Demo)' } };
      return { success: false, error: 'Sai thông tin (Demo: admin/admin)' };
    }

    try {
      const res = await this.callApi('login', { username, password });
      if (res && res.success) return res;
      return { success: false, error: res?.error || 'Đăng nhập thất bại' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Lỗi kết nối Server' };
    }
  }

  // --- Employees ---
  async getEmployees(): Promise<Employee[]> {
    if (!this.isDemoMode) {
      try {
        const data = await this.callApi('getEmployees');
        if (data && Array.isArray(data)) return data;
      } catch(e) { console.warn("Fetch failed, using mock", e); }
    }
    return Promise.resolve([...this.employees]);
  }

  async addEmployee(emp: Employee): Promise<Employee> {
    if (!this.isDemoMode) await this.callApi('addEmployee', emp);
    this.employees.push(emp);
    return emp;
  }

  async updateEmployee(emp: Employee): Promise<Employee> {
    if (!this.isDemoMode) await this.callApi('updateEmployee', emp);
    const index = this.employees.findIndex(e => e.id === emp.id);
    if (index !== -1) this.employees[index] = emp;
    return emp;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    if (!this.isDemoMode) await this.callApi('deleteEmployee', {id});
    this.employees = this.employees.filter(e => e.id !== id);
    return true;
  }

  // --- Common Dropdowns ---
  async getDropdowns(): Promise<TempData[]> {
     if (!this.isDemoMode) {
       try {
         const data = await this.callApi('getDropdowns');
         if (Array.isArray(data)) return data;
       } catch(e) {}
     }
     return this.tempData;
  }

  // --- Funds ---
  async getFunds(): Promise<FundTransaction[]> {
    if (!this.isDemoMode) {
      try {
        const data = await this.callApi('getFunds');
        if (Array.isArray(data)) return data;
      } catch(e) {}
    }
    return Promise.resolve([...this.funds]);
  }

  async addFundTransaction(trans: FundTransaction): Promise<FundTransaction> {
    if (!this.isDemoMode) await this.callApi('addFund', trans);
    const lastBalance = this.funds.length > 0 ? this.funds[this.funds.length - 1].balanceAfter : 0;
    const newBalance = trans.type === 'Thu' ? lastBalance + trans.amount : lastBalance - trans.amount;
    const newTrans = { ...trans, balanceAfter: newBalance };
    this.funds.push(newTrans);
    return newTrans;
  }

  // --- Reports ---
  async getReports(): Promise<PrescriptionReport[]> {
    if (!this.isDemoMode) {
       try {
         const data = await this.callApi('getReports');
         if (Array.isArray(data)) return data;
       } catch(e) {}
    }
    return Promise.resolve([...this.reports]);
  }

  async addReport(report: PrescriptionReport): Promise<PrescriptionReport> {
    if (!this.isDemoMode) await this.callApi('addReport', report);
    const idx = this.reports.findIndex(r => r.id === report.id);
    if(idx >= 0) this.reports[idx] = report;
    else this.reports.push(report);
    return report;
  }

  async deleteReport(id: string): Promise<boolean> {
     if (!this.isDemoMode) await this.callApi('deleteReport', {id});
     this.reports = this.reports.filter(r => r.id !== id);
     return true;
  }

   // --- Attendance ---
   async getAttendance(): Promise<Attendance[]> {
    if (!this.isDemoMode) {
       try {
         const data = await this.callApi('getAttendance');
         if (Array.isArray(data)) return data;
       } catch(e) {}
    }
    return Promise.resolve([...this.attendance]);
   }

   async saveAttendance(records: Attendance[]): Promise<boolean> {
     if (!this.isDemoMode) await this.callApi('saveAttendance', { records });
     records.forEach(newRecord => {
        this.attendance = this.attendance.filter(
          old => !(old.employeeId === newRecord.employeeId && old.date === newRecord.date)
        );
        this.attendance.push(newRecord);
     });
     return true;
   }

   // --- Evaluations ---
   async getEvaluations(): Promise<AnnualEvaluation[]> {
     if (!this.isDemoMode) {
        try {
          const data = await this.callApi('getEvaluations');
          if (Array.isArray(data)) return data;
        } catch(e) {}
     }
     return Promise.resolve([...this.evaluations]);
   }

   async addEvaluation(evalItem: AnnualEvaluation): Promise<AnnualEvaluation> {
     if (!this.isDemoMode) await this.callApi('addEvaluation', evalItem);
     this.evaluations = this.evaluations.filter(e => !(e.year === evalItem.year && e.employeeId === evalItem.employeeId));
     this.evaluations.push(evalItem);
     return evalItem;
   }
   
   async deleteEvaluation(id: string): Promise<boolean> {
      if (!this.isDemoMode) await this.callApi('deleteEvaluation', {id});
      this.evaluations = this.evaluations.filter(e => e.id !== id);
      return true;
   }

   // --- Proposals ---
   async getProposals(): Promise<Proposal[]> {
     if (!this.isDemoMode) {
        try {
           const data = await this.callApi('getProposals');
           if (Array.isArray(data)) return data;
        } catch(e) {}
     }
     return Promise.resolve([...this.proposals]);
   }

   async addProposal(prop: Proposal): Promise<Proposal> {
     if (!this.isDemoMode) await this.callApi('addProposal', prop);
     this.proposals.push(prop);
     return prop;
   }
   
   // --- Shifts ---
   async getShifts(): Promise<Shift[]> {
     if (!this.isDemoMode) {
        try {
           const data = await this.callApi('getShifts');
           if (Array.isArray(data)) return data;
        } catch(e) {}
     }
     return Promise.resolve(this.shifts);
   }
   
   async saveShift(shift: Shift): Promise<boolean> {
     if (!this.isDemoMode) await this.callApi('saveShift', shift);
     this.shifts = this.shifts.filter(s => s.id !== shift.id);
     this.shifts.push(shift);
     return true;
   }
}

export const dataService = new DataService();

import { Employee, FundTransaction, PrescriptionReport, Attendance, AnnualEvaluation, Proposal, User, Shift, TempData } from '../types';
import { MOCK_EMPLOYEES, MOCK_FUNDS, MOCK_REPORTS, MOCK_ATTENDANCE, MOCK_EVALUATIONS, MOCK_PROPOSALS } from './mockData';

// LINK CỨNG WEB APP
const HARDCODED_URL = 'https://script.google.com/macros/s/AKfycbxkVcJmyvpGKSD7ZJSbtN4xtPBRxj_fQGzdWZRd-ALgWtFVAcNh_Hpjr6MhVhsixmLP3A/exec';

class DataService {
  private apiUrl: string = HARDCODED_URL;
  private isDemoMode: boolean = false;

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
    if (typeof localStorage !== 'undefined') {
      const savedUrl = localStorage.getItem('pharmahr_api_url');
      if (savedUrl) this.apiUrl = savedUrl;
    }
  }

  setApiUrl(url: string) {
    this.apiUrl = url;
    localStorage.setItem('pharmahr_api_url', url);
  }

  getApiUrl() { return this.apiUrl; }
  setDemoMode(enabled: boolean) { this.isDemoMode = enabled; }
  isDemo() { return this.isDemoMode; }

  async testConnection(): Promise<{success: boolean, message: string}> {
    if (!this.apiUrl) return { success: false, message: 'Chưa cấu hình URL' };
    try {
       await fetch(`${this.apiUrl}?action=test`, {
          method: 'POST',
          mode: 'no-cors', 
          body: JSON.stringify({ action: 'test' })
       });
       return { success: true, message: 'Đã gửi tín hiệu đến Server' };
    } catch (e: any) {
       return { success: false, message: 'Lỗi mạng: ' + e.message };
    }
  }

  // --- CORE API CALLER (JSON TEXT MODE - FINAL) ---
  private async callApi(action: string, data: any = {}) {
    if (this.isDemoMode) return null;
    
    try {
      const payload = { action, ...data };
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        redirect: 'follow',
        // QUAN TRỌNG: Không gửi Header Content-Type để tránh CORS Preflight
        // Gửi body dạng chuỗi JSON
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      
      try {
        const json = JSON.parse(text);
        if (json.error) throw new Error(json.error);
        return json;
      } catch (parseError) {
        // Phân tích lỗi cụ thể
        if (text.includes('<!DOCTYPE html>')) throw new Error("Lỗi Script Google (HTML Response). Kiểm tra lại Link Web App.");
        
        // Nếu Server trả về chính nội dung gửi lên (Lỗi Echo) -> Backend chưa update
        if (text.includes('action=') || text.includes('"action":')) {
            throw new Error("Backend chưa cập nhật code mới (Vui lòng Deploy lại GAS: New Version)");
        }
        
        console.error("Raw response:", text);
        throw new Error("Dữ liệu trả về không hợp lệ: " + text.substring(0, 50));
      }
    } catch (error: any) {
      console.error(`API Call Failed [${action}]:`, error);
      throw error;
    }
  }

  async login(username: string, password: string): Promise<{success: boolean, user?: User, error?: string}> {
    if (this.isDemoMode) {
      if (username === 'admin' && password === 'admin') 
        return { success: true, user: { username: 'admin', role: 'admin', name: 'Quản trị viên (Demo)' } };
      return { success: false, error: 'Sai thông tin (Demo: admin/admin)' };
    }

    try {
      const res = await this.callApi('login', { username, password });
      if (res && res.success) return res;
      return { success: false, error: res?.error || 'Đăng nhập thất bại' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async getEmployees(): Promise<Employee[]> { if (!this.isDemoMode) { try { const d = await this.callApi('getEmployees'); if(Array.isArray(d)) return d; } catch(e){} } return [...this.employees]; }
  async addEmployee(emp: Employee): Promise<Employee> { if(!this.isDemoMode) await this.callApi('addEmployee', emp); this.employees.push(emp); return emp; }
  async updateEmployee(emp: Employee): Promise<Employee> { if(!this.isDemoMode) await this.callApi('updateEmployee', emp); return emp; }
  async deleteEmployee(id: string): Promise<boolean> { if(!this.isDemoMode) await this.callApi('deleteEmployee', {id}); return true; }
  async getDropdowns(): Promise<TempData[]> { if(!this.isDemoMode) { try { const d = await this.callApi('getDropdowns'); if(Array.isArray(d)) return d; } catch(e){} } return this.tempData; }
  async getFunds(): Promise<FundTransaction[]> { if(!this.isDemoMode) { try { const d = await this.callApi('getFunds'); if(Array.isArray(d)) return d; } catch(e){} } return [...this.funds]; }
  async addFundTransaction(trans: FundTransaction): Promise<FundTransaction> { if(!this.isDemoMode) await this.callApi('addFund', trans); return trans; }
  async getReports(): Promise<PrescriptionReport[]> { if(!this.isDemoMode) { try { const d = await this.callApi('getReports'); if(Array.isArray(d)) return d; } catch(e){} } return [...this.reports]; }
  async addReport(report: PrescriptionReport): Promise<PrescriptionReport> { if(!this.isDemoMode) await this.callApi('addReport', report); return report; }
  async deleteReport(id: string): Promise<boolean> { if(!this.isDemoMode) await this.callApi('deleteReport', {id}); return true; }
  async getAttendance(): Promise<Attendance[]> { if(!this.isDemoMode) { try { const d = await this.callApi('getAttendance'); if(Array.isArray(d)) return d; } catch(e){} } return [...this.attendance]; }
  async saveAttendance(records: Attendance[]): Promise<boolean> { if(!this.isDemoMode) await this.callApi('saveAttendance', { records }); return true; }
  async getEvaluations(): Promise<AnnualEvaluation[]> { if(!this.isDemoMode) { try { const d = await this.callApi('getEvaluations'); if(Array.isArray(d)) return d; } catch(e){} } return [...this.evaluations]; }
  async addEvaluation(evalItem: AnnualEvaluation): Promise<AnnualEvaluation> { if(!this.isDemoMode) await this.callApi('addEvaluation', evalItem); return evalItem; }
  async deleteEvaluation(id: string): Promise<boolean> { if(!this.isDemoMode) await this.callApi('deleteEvaluation', {id}); return true; }
  async getProposals(): Promise<Proposal[]> { if(!this.isDemoMode) { try { const d = await this.callApi('getProposals'); if(Array.isArray(d)) return d; } catch(e){} } return [...this.proposals]; }
  async addProposal(prop: Proposal): Promise<Proposal> { if(!this.isDemoMode) await this.callApi('addProposal', prop); return prop; }
  async getShifts(): Promise<Shift[]> { if(!this.isDemoMode) { try { const d = await this.callApi('getShifts'); if(Array.isArray(d)) return d; } catch(e){} } return this.shifts; }
  async saveShift(shift: Shift): Promise<boolean> { if(!this.isDemoMode) await this.callApi('saveShift', shift); return true; }
}

export const dataService = new DataService();
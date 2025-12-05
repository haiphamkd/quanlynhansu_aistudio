import { supabase } from './supabaseClient';
import { Employee, FundTransaction, PrescriptionReport, Attendance, AnnualEvaluation, Proposal, User, Shift, TempData, UserRole } from '../types';

class DataService {
  private isDemoMode: boolean = false;

  setDemoMode(enabled: boolean) { this.isDemoMode = enabled; }
  isDemo() { return this.isDemoMode; }

  // --- 1. ĐĂNG NHẬP (Bảng: nguoi_dung) ---
  async login(username: string, password: string): Promise<{success: boolean, user?: User, error?: string}> {
    if (this.isDemoMode) return { success: true, user: { username: 'demo', role: 'admin', name: 'Demo Admin' } };

    try {
      const { data, error } = await supabase
        .from('nguoi_dung')
        .select('*')
        .eq('ten_dang_nhap', username)
        .eq('mat_khau', password)
        .single();

      if (error || !data) {
        return { success: false, error: 'Sai tên đăng nhập hoặc mật khẩu' };
      }

      return { 
        success: true, 
        user: { 
          username: data.ten_dang_nhap, 
          // Default to 'user' if role is missing or invalid in DB
          role: (data.vai_tro as UserRole) || 'user', 
          name: data.ho_ten,
          employeeId: data.ma_nhan_vien
        } 
      };
    } catch (e: any) {
      return { success: false, error: 'Lỗi kết nối CSDL Supabase: ' + e.message };
    }
  }

  // --- 2. NHÂN VIÊN (Bảng: nhan_vien) ---
  async getEmployees(): Promise<Employee[]> {
    const { data } = await supabase.from('nhan_vien').select('*').order('ma_nv', { ascending: true });
    if (!data) return [];
    
    return data.map((item: any) => ({
      id: item.ma_nv,
      fullName: item.ho_ten,
      dob: item.ngay_sinh,
      gender: item.gioi_tinh,
      position: item.chuc_vu,
      qualification: item.trinh_do,
      phone: item.sdt,
      email: item.email,
      contractDate: item.ngay_hop_dong,
      joinDate: item.ngay_vao_lam,
      hometown: item.que_quan,
      permanentAddress: item.thuong_tru,
      idCardNumber: item.cccd,
      idCardDate: item.ngay_cap,
      idCardPlace: item.noi_cap,
      status: item.trang_thai,
      avatarUrl: item.anh_dai_dien,
      fileUrl: item.ho_so_url,
      notes: item.ghi_chu
    }));
  }

  async addEmployee(emp: Employee): Promise<Employee> {
    const dbItem = this.mapEmployeeToDb(emp);
    const { error } = await supabase.from('nhan_vien').insert(dbItem);
    if (error) throw new Error(error.message);
    return emp;
  }

  async importEmployees(employees: Employee[]): Promise<{success: boolean, error?: string}> {
    const dbItems = employees.map(emp => this.mapEmployeeToDb(emp));
    const { error } = await supabase.from('nhan_vien').insert(dbItems);
    if (error) {
        console.error("Import error:", error);
        return { success: false, error: error.message };
    }
    return { success: true };
  }

  private mapEmployeeToDb(emp: Employee) {
    return {
      ma_nv: emp.id,
      ho_ten: emp.fullName,
      ngay_sinh: emp.dob,
      gioi_tinh: emp.gender,
      chuc_vu: emp.position,
      trinh_do: emp.qualification,
      sdt: emp.phone,
      email: emp.email,
      ngay_hop_dong: emp.contractDate,
      ngay_vao_lam: emp.joinDate,
      que_quan: emp.hometown,
      thuong_tru: emp.permanentAddress,
      cccd: emp.idCardNumber,
      ngay_cap: emp.idCardDate,
      noi_cap: emp.idCardPlace,
      trang_thai: emp.status,
      anh_dai_dien: emp.avatarUrl,
      ho_so_url: emp.fileUrl,
      ghi_chu: emp.notes
    };
  }

  async updateEmployee(emp: Employee): Promise<Employee> {
    const dbItem = this.mapEmployeeToDb(emp);
    const { error } = await supabase.from('nhan_vien').update(dbItem).eq('ma_nv', emp.id);
    if (error) throw new Error(error.message);
    return emp;
  }

  async deleteEmployee(id: string): Promise<{success: boolean, error?: string}> {
    const { error } = await supabase.from('nhan_vien').delete().eq('ma_nv', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // --- 3. CHẤM CÔNG (Bảng: cham_cong) ---
  async getAttendance(): Promise<Attendance[]> {
    const { data } = await supabase.from('cham_cong').select('*').order('ngay', { ascending: false });
    if (!data) return [];
    return data.map((item: any) => ({
        id: item.id,
        employeeId: item.ma_nv,
        employeeName: item.ten_nv,
        date: item.ngay,
        timeIn: item.gio_vao,
        shift: item.ca_truc,
        status: item.trang_thai,
        notes: item.ghi_chu
    }));
  }

  async saveAttendance(records: Attendance[]): Promise<boolean> {
    const dbRecords = records.map(r => ({
        ma_nv: r.employeeId,
        ten_nv: r.employeeName,
        ngay: r.date,
        gio_vao: r.timeIn,
        ca_truc: r.shift,
        trang_thai: r.status,
        ghi_chu: r.notes
    }));
    const { error } = await supabase.from('cham_cong').upsert(dbRecords); 
    if (error) console.error("Save attendance error:", error);
    return !error;
  }

  // --- 4. QUỸ KHOA (Bảng: quy_khoa) ---
  async getFunds(): Promise<FundTransaction[]> {
    const { data } = await supabase.from('quy_khoa').select('*').order('ngay', { ascending: true });
    if (!data) return [];
    return data.map((item: any) => ({
        id: item.id,
        date: item.ngay,
        type: item.loai,
        content: item.noi_dung,
        performer: item.nguoi_thuc_hien,
        amount: item.so_tien,
        balanceAfter: item.so_du_cuoi
    }));
  }

  async addFundTransaction(trans: FundTransaction): Promise<FundTransaction> {
    const { data: lastTrans } = await supabase.from('quy_khoa').select('so_du_cuoi').order('id', { ascending: false }).limit(1).single();
    const lastBalance = lastTrans ? lastTrans.so_du_cuoi : 0;
    const newBalance = trans.type === 'Thu' ? lastBalance + trans.amount : lastBalance - trans.amount;
    
    const dbItem = {
        ngay: trans.date,
        loai: trans.type,
        noi_dung: trans.content,
        nguoi_thuc_hien: trans.performer,
        so_tien: trans.amount,
        so_du_cuoi: newBalance
    };
    await supabase.from('quy_khoa').insert(dbItem);
    return { ...trans, balanceAfter: newBalance };
  }

  // --- 5. BÁO CÁO (Bảng: bao_cao_don) ---
  async getReports(): Promise<PrescriptionReport[]> {
    const { data } = await supabase.from('bao_cao_don').select('*').order('ngay', { ascending: false });
    if (!data) return [];
    return data.map((item: any) => ({
        id: item.id,
        date: item.ngay,
        totalIssued: item.da_cap,
        notReceived: item.chua_nhan,
        reason: item.ly_do,
        reporter: item.nguoi_bao_cao,
        reporterId: item.ma_nguoi_bao_cao,
        attachmentUrls: item.dinh_kem
    }));
  }

  async addReport(report: PrescriptionReport): Promise<PrescriptionReport> {
    const dbItem = {
        ngay: report.date,
        da_cap: report.totalIssued,
        chua_nhan: report.notReceived,
        ly_do: report.reason,
        nguoi_bao_cao: report.reporter,
        ma_nguoi_bao_cao: report.reporterId,
        dinh_kem: report.attachmentUrls
    };
    if (typeof report.id === 'number') {
        await supabase.from('bao_cao_don').update(dbItem).eq('id', report.id);
    } else {
        await supabase.from('bao_cao_don').insert(dbItem);
    }
    return report;
  }

  async deleteReport(id: string): Promise<boolean> {
    const { error } = await supabase.from('bao_cao_don').delete().eq('id', id);
    return !error;
  }

  // --- 6. ĐÁNH GIÁ (Bảng: danh_gia) ---
  async getEvaluations(): Promise<AnnualEvaluation[]> {
    const { data } = await supabase.from('danh_gia').select('*');
    if (!data) return [];
    return data.map((item: any) => ({
        id: item.id,
        year: item.nam,
        employeeId: item.ma_nv,
        fullName: item.ho_ten,
        position: item.chuc_vu,
        scoreProfessional: item.diem_chuyen_mon,
        scoreAttitude: item.diem_thai_do,
        scoreDiscipline: item.diem_ky_luat,
        averageScore: item.diem_trung_binh,
        rank: item.xep_loai,
        rewardProposal: item.de_nghi_khen,
        rewardTitle: item.danh_hieu,
        notes: item.ghi_chu
    }));
  }

  async addEvaluation(evalItem: AnnualEvaluation): Promise<AnnualEvaluation> {
    const dbItem = {
        nam: evalItem.year,
        ma_nv: evalItem.employeeId,
        ho_ten: evalItem.fullName,
        chuc_vu: evalItem.position,
        diem_chuyen_mon: evalItem.scoreProfessional,
        diem_thai_do: evalItem.scoreAttitude,
        diem_ky_luat: evalItem.scoreDiscipline,
        diem_trung_binh: evalItem.averageScore,
        xep_loai: evalItem.rank,
        de_nghi_khen: evalItem.rewardProposal,
        danh_hieu: evalItem.rewardTitle,
        ghi_chu: evalItem.notes
    };
    await supabase.from('danh_gia').insert(dbItem);
    return evalItem;
  }

  async deleteEvaluation(id: string): Promise<boolean> {
    const { error } = await supabase.from('danh_gia').delete().eq('id', id);
    return !error;
  }

  // --- 7. TỜ TRÌNH (Bảng: to_trinh) ---
  async getProposals(): Promise<Proposal[]> {
    const { data } = await supabase.from('to_trinh').select('*').order('ngay', { ascending: false });
    if (!data) return [];
    return data.map((item: any) => ({
        id: item.id,
        date: item.ngay,
        title: item.tieu_de,
        content: item.noi_dung,
        submitter: item.nguoi_trinh,
        fileUrl: item.file_url,
        status: item.trang_thai
    }));
  }

  async addProposal(prop: Proposal): Promise<Proposal> {
    const dbItem = {
        ngay: prop.date,
        tieu_de: prop.title,
        noi_dung: prop.content,
        nguoi_trinh: prop.submitter,
        file_url: prop.fileUrl,
        trang_thai: prop.status
    };
    await supabase.from('to_trinh').insert(dbItem);
    return prop;
  }

  // --- 8. LỊCH TRỰC (Bảng: lich_truc) ---
  async getShifts(): Promise<Shift[]> {
    const { data } = await supabase.from('lich_truc').select('*');
    if (!data) return [];
    return data.map((item: any) => ({
        id: item.id,
        weekStart: item.tuan_bat_dau,
        weekEnd: item.tuan_ket_thuc,
        ca: item.ca,
        mon: item.thu_2,
        tue: item.thu_3,
        wed: item.thu_4,
        thu: item.thu_5,
        fri: item.thu_6,
        sat: item.thu_7,
        sun: item.cn
    }));
  }

  async saveShift(shift: Shift): Promise<boolean> {
    const dbItem = {
        id: shift.id,
        tuan_bat_dau: shift.weekStart,
        tuan_ket_thuc: shift.weekEnd,
        ca: shift.ca,
        thu_2: shift.mon,
        thu_3: shift.tue,
        thu_4: shift.wed,
        thu_5: shift.thu,
        thu_6: shift.fri,
        thu_7: shift.sat,
        cn: shift.sun
    };
    const { error } = await supabase.from('lich_truc').upsert(dbItem);
    return !error;
  }

  // --- 9. DROPDOWNS (Bảng: danh_muc) ---
  async getDropdowns(): Promise<TempData[]> {
    const { data } = await supabase.from('danh_muc').select('*');
    if (!data || data.length === 0) {
        return [
            { type: 'TrinhDo', value: 'Dược sĩ Đại học' },
            { type: 'TrangThai', value: 'Đang làm việc' }
        ];
    }
    return data.map((item: any) => ({
        type: item.loai,
        value: item.gia_tri
    }));
  }
  
  // Account Creation
  async createAccount(user: User): Promise<{success: boolean, error?: string}> {
    const { error } = await supabase.from('nguoi_dung').insert({
      ten_dang_nhap: user.username,
      mat_khau: user.password,
      vai_tro: user.role,
      ho_ten: user.name,
      ma_nhan_vien: user.employeeId
    });
    
    if (error) {
      if (error.code === '23505') return { success: false, error: 'Tên đăng nhập đã tồn tại' };
      return { success: false, error: error.message };
    }
    return { success: true };
  }
}

export const dataService = new DataService();

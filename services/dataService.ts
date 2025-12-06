
import { supabase } from './supabaseClient';
import { Employee, FundTransaction, PrescriptionReport, Attendance, AnnualEvaluation, Proposal, User, Shift, TempData, Category } from '../types';

class DataService {
  private isDemoMode: boolean = false;

  setDemoMode(enabled: boolean) { this.isDemoMode = enabled; }
  isDemo() { return this.isDemoMode; }

  // --- HELPER: Apply Department Filter ---
  private applyDepartmentFilter(query: any, userDept?: string) {
    if (userDept && userDept !== 'All') { 
      return query.eq('khoa_phong', userDept);
    }
    return query;
  }

  // --- 1. ĐĂNG NHẬP & NGƯỜI DÙNG (Bảng: nguoi_dung) ---
  async login(username: string, password: string): Promise<{success: boolean, user?: User, error?: string}> {
    if (this.isDemoMode) return { success: true, user: { username: 'demo', role: 'admin', name: 'Demo Admin', department: 'Khoa Dược' } };

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
          role: data.vai_tro as 'admin' | 'staff' | 'manager', 
          name: data.ho_ten,
          department: data.khoa_phong,
          employeeId: data.ma_nhan_vien,
          mustChangePassword: data.can_doi_mat_khau
        } 
      };
    } catch (e: any) {
      return { success: false, error: 'Lỗi kết nối CSDL Supabase: ' + e.message };
    }
  }

  async createUser(user: User): Promise<{success: boolean, error?: string}> {
    if (this.isDemoMode) return { success: true };

    try {
        const payload = {
            ten_dang_nhap: user.username,
            mat_khau: user.password,
            vai_tro: user.role,
            ho_ten: user.name,
            khoa_phong: user.department,
            ma_nhan_vien: user.employeeId,
            can_doi_mat_khau: true
        };

        const { error } = await supabase.from('nguoi_dung').insert(payload);

        if (error) {
            // Fallback for missing column
            if (error.message.includes('can_doi_mat_khau')) {
                 const { can_doi_mat_khau, ...retryPayload } = payload;
                 const { error: retryError } = await supabase.from('nguoi_dung').insert(retryPayload);
                 if (retryError) return { success: false, error: retryError.message };
                 return { success: true };
            }
            if (error.code === '23505') return { success: false, error: 'Tên đăng nhập đã tồn tại' };
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
  }

  // Get simple list of users to check existence
  async getUsers(): Promise<User[]> {
    const { data } = await supabase.from('nguoi_dung').select('ten_dang_nhap, ma_nhan_vien, ho_ten, vai_tro, khoa_phong');
    if (!data) return [];
    return data.map((u: any) => ({
        username: u.ten_dang_nhap,
        name: u.ho_ten,
        role: u.vai_tro,
        employeeId: u.ma_nhan_vien,
        department: u.khoa_phong
    }));
  }

  async changePassword(username: string, newPass: string): Promise<{success: boolean, error?: string}> {
    if (this.isDemoMode) return { success: true };

    const { error } = await supabase
      .from('nguoi_dung')
      .update({ mat_khau: newPass, can_doi_mat_khau: false })
      .eq('ten_dang_nhap', username);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  async adminResetPassword(username: string): Promise<{success: boolean, error?: string}> {
      // Try to reset with flag
      const { error } = await supabase
        .from('nguoi_dung')
        .update({ mat_khau: '1', can_doi_mat_khau: true })
        .eq('ten_dang_nhap', username);
      
      if (error) {
          // Fallback if column missing
          if (error.message.includes('can_doi_mat_khau')) {
             const { error: retryError } = await supabase
                .from('nguoi_dung')
                .update({ mat_khau: '1' })
                .eq('ten_dang_nhap', username);
             if (retryError) return { success: false, error: retryError.message };
             return { success: true };
          }
          return { success: false, error: error.message };
      }
      return { success: true };
  }

  // --- 2. NHÂN VIÊN (Bảng: nhan_vien) ---
  async getEmployees(departmentFilter?: string): Promise<Employee[]> {
    let query = supabase.from('nhan_vien').select('*').order('ma_nv', { ascending: true });
    query = this.applyDepartmentFilter(query, departmentFilter);

    const { data } = await query;
    if (!data) return [];
    
    return data.map((item: any) => ({
      id: item.ma_nv,
      fullName: item.ho_ten,
      department: item.khoa_phong,
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

  private mapEmployeeToDb(emp: Employee) {
    return {
      ma_nv: emp.id,
      ho_ten: emp.fullName,
      khoa_phong: emp.department,
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

  // --- 3. CHẤM CÔNG ---
  async getAttendance(departmentFilter?: string): Promise<Attendance[]> {
    let query = supabase.from('cham_cong').select('*').order('ngay', { ascending: false });
    query = this.applyDepartmentFilter(query, departmentFilter);

    const { data } = await query;
    if (!data) return [];
    return data.map((item: any) => ({
        id: item.id,
        employeeId: item.ma_nv,
        employeeName: item.ten_nv,
        department: item.khoa_phong,
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
        khoa_phong: r.department,
        ngay: r.date,
        gio_vao: r.timeIn,
        ca_truc: r.shift,
        trang_thai: r.status,
        ghi_chu: r.notes
    }));
    const { error } = await supabase.from('cham_cong').upsert(dbRecords); 
    return !error;
  }

  // --- 4. QUỸ KHOA ---
  async getFunds(departmentFilter?: string): Promise<FundTransaction[]> {
    let query = supabase.from('quy_khoa').select('*').order('ngay', { ascending: true });
    query = this.applyDepartmentFilter(query, departmentFilter);

    const { data } = await query;
    if (!data) return [];
    return data.map((item: any) => ({
        id: item.id,
        date: item.ngay,
        department: item.khoa_phong,
        type: item.loai,
        content: item.noi_dung,
        performer: item.nguoi_thuc_hien,
        amount: item.so_tien,
        balanceAfter: item.so_du_cuoi
    }));
  }

  async addFundTransaction(trans: FundTransaction): Promise<FundTransaction> {
    let query = supabase.from('quy_khoa').select('so_du_cuoi').order('id', { ascending: false }).limit(1);
    if (trans.department) query = query.eq('khoa_phong', trans.department);
    
    const { data: lastTrans } = await query.single();
    const lastBalance = lastTrans ? lastTrans.so_du_cuoi : 0;
    const newBalance = trans.type === 'Thu' ? lastBalance + trans.amount : lastBalance - trans.amount;
    
    const dbItem = {
        ngay: trans.date,
        khoa_phong: trans.department,
        loai: trans.type,
        noi_dung: trans.content,
        nguoi_thuc_hien: trans.performer,
        so_tien: trans.amount,
        so_du_cuoi: newBalance
    };
    await supabase.from('quy_khoa').insert(dbItem);
    return { ...trans, balanceAfter: newBalance };
  }

  async updateFundTransaction(trans: FundTransaction): Promise<boolean> {
    const dbItem = {
        ngay: trans.date,
        khoa_phong: trans.department,
        loai: trans.type,
        noi_dung: trans.content,
        nguoi_thuc_hien: trans.performer,
        so_tien: trans.amount,
    };
    const { error } = await supabase.from('quy_khoa').update(dbItem).eq('id', trans.id);
    return !error;
  }

  // --- 5. BÁO CÁO ---
  async getReports(departmentFilter?: string): Promise<PrescriptionReport[]> {
    let query = supabase.from('bao_cao_don').select('*').order('ngay', { ascending: false });
    query = this.applyDepartmentFilter(query, departmentFilter);

    const { data } = await query;
    if (!data) return [];
    return data.map((item: any) => ({
        id: item.id,
        date: item.ngay,
        department: item.khoa_phong,
        totalIssued: item.da_cap,
        notReceived: item.chua_nhan,
        reason: item.ly_do,
        reporter: item.nguoi_bao_cao,
        reporterId: item.ma_nguoi_bao_cao,
        dinh_kem: item.dinh_kem
    }));
  }

  async addReport(report: PrescriptionReport): Promise<PrescriptionReport> {
    const dbItem = {
        ngay: report.date,
        khoa_phong: report.department,
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

  // --- 6. ĐÁNH GIÁ ---
  async getEvaluations(departmentFilter?: string): Promise<AnnualEvaluation[]> {
    let query = supabase.from('danh_gia').select('*');
    query = this.applyDepartmentFilter(query, departmentFilter);
    
    const { data } = await query;
    if (!data) return [];
    return data.map((item: any) => ({
        id: item.id,
        year: item.nam,
        employeeId: item.ma_nv,
        fullName: item.ho_ten,
        department: item.khoa_phong,
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
        khoa_phong: evalItem.department,
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

  async updateEvaluation(evalItem: AnnualEvaluation): Promise<boolean> {
    const dbItem = {
        nam: evalItem.year,
        ma_nv: evalItem.employeeId,
        ho_ten: evalItem.fullName,
        khoa_phong: evalItem.department,
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
    const { error } = await supabase.from('danh_gia').update(dbItem).eq('id', evalItem.id);
    return !error;
  }

  async deleteEvaluation(id: string): Promise<boolean> {
    const { error } = await supabase.from('danh_gia').delete().eq('id', id);
    return !error;
  }

  // --- 7. TỜ TRÌNH ---
  async getProposals(departmentFilter?: string): Promise<Proposal[]> {
    let query = supabase.from('to_trinh').select('*').order('ngay', { ascending: false });
    query = this.applyDepartmentFilter(query, departmentFilter);

    const { data } = await query;
    if (!data) return [];
    return data.map((item: any) => ({
        id: item.id,
        date: item.ngay,
        department: item.khoa_phong,
        title: item.tieu_de,
        proposalNumber: item.so_to_trinh, 
        content: item.noi_dung,
        submitter: item.nguoi_trinh,
        fileUrl: item.file_url,
        status: item.trang_thai
    }));
  }

  async addProposal(prop: Proposal): Promise<Proposal> {
    const dbItem = {
        ngay: prop.date,
        khoa_phong: prop.department,
        tieu_de: prop.title,
        so_to_trinh: prop.proposalNumber,
        noi_dung: prop.content,
        nguoi_trinh: prop.submitter,
        file_url: prop.fileUrl,
        trang_thai: prop.status
    };
    await supabase.from('to_trinh').insert(dbItem);
    return prop;
  }

  async updateProposal(prop: Proposal): Promise<boolean> {
    const dbItem = {
        ngay: prop.date,
        khoa_phong: prop.department,
        tieu_de: prop.title,
        so_to_trinh: prop.proposalNumber || '',
        noi_dung: prop.content,
        nguoi_trinh: prop.submitter,
        file_url: prop.fileUrl,
        trang_thai: prop.status
    };
    const { error } = await supabase.from('to_trinh').update(dbItem).eq('id', prop.id);
    return !error;
  }

  // --- 8. LỊCH TRỰC ---
  async getShifts(departmentFilter?: string): Promise<Shift[]> {
    let query = supabase.from('lich_truc').select('*');
    query = this.applyDepartmentFilter(query, departmentFilter);

    const { data } = await query;
    if (!data) return [];
    return data.map((item: any) => ({
        id: item.id,
        department: item.khoa_phong,
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
        khoa_phong: shift.department,
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

  // --- 9. DANH MỤC (Bảng: danh_muc) ---
  async getDropdowns(): Promise<TempData[]> {
    // Legacy support: map categories to TempData
    const cats = await this.getCategories();
    return cats.map(c => ({ type: c.type, value: c.value }));
  }

  async getCategories(): Promise<Category[]> {
    const { data } = await supabase.from('danh_muc').select('*').order('loai');
    if (!data) return [];
    return data.map((item: any) => ({
      id: item.id,
      type: item.loai,
      value: item.gia_tri,
      notes: item.ghi_chu // undefined if column missing, which is fine for read
    }));
  }

  async addCategory(cat: Omit<Category, 'id'>): Promise<{success: boolean, error?: string}> {
    const payload = {
      loai: cat.type,
      gia_tri: cat.value,
      ghi_chu: cat.notes
    };
    
    const { error } = await supabase.from('danh_muc').insert(payload);
    
    if (error) {
      // Retry without ghi_chu if column is missing
      if (error.message.includes('ghi_chu') && (error.message.includes('Could not find') || error.message.includes('does not exist'))) {
          const { ghi_chu, ...safePayload } = payload;
          const { error: retryError } = await supabase.from('danh_muc').insert(safePayload);
          if (retryError) return { success: false, error: retryError.message };
          return { success: true };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  async updateCategory(cat: Category): Promise<{success: boolean, error?: string}> {
    const payload = {
      loai: cat.type,
      gia_tri: cat.value,
      ghi_chu: cat.notes
    };

    const { error } = await supabase.from('danh_muc').update(payload).eq('id', cat.id);
    
    if (error) {
      // Retry without ghi_chu if column is missing
      if (error.message.includes('ghi_chu') && (error.message.includes('Could not find') || error.message.includes('does not exist'))) {
          const { ghi_chu, ...safePayload } = payload;
          const { error: retryError } = await supabase.from('danh_muc').update(safePayload).eq('id', cat.id);
          if (retryError) return { success: false, error: retryError.message };
          return { success: true };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  async deleteCategory(id: number): Promise<{success: boolean, error?: string}> {
    const { error } = await supabase.from('danh_muc').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }
}

export const dataService = new DataService();

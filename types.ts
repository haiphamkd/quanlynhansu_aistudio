// Enum definitions
export enum EmployeeStatus {
  ACTIVE = "Đang làm việc",
  LEAVE = "Nghỉ phép",
  SICK = "Nghỉ bệnh",
  RESIGNED = "Đã nghỉ việc"
}

export enum TransactionType {
  INCOME = "Thu",
  EXPENSE = "Chi"
}

export enum EvaluationRank {
  EXCELLENT = "Hoàn thành xuất sắc nhiệm vụ",
  GOOD = "Hoàn thành tốt nhiệm vụ",
  COMPLETED = "Hoàn thành nhiệm vụ",
  LIMITED = "Hoàn thành nhiệm vụ nhưng còn hạn chế"
}

export type UserRole = 'admin' | 'manager' | 'user';

export interface User {
  username: string; // ten_dang_nhap
  password?: string; // mat_khau (chỉ dùng khi login/create)
  role: UserRole; // vai_tro
  name: string; // ho_ten
  employeeId?: string; // ma_nhan_vien
}

// Data Models
export interface Employee {
  id: string; // ma_nv
  fullName: string; // ho_ten
  dob: string; // ngay_sinh
  gender: 'Nam' | 'Nữ'; // gioi_tinh
  position: string; // chuc_vu
  qualification: string; // trinh_do
  phone: string; // sdt
  email: string; // email
  contractDate: string; // ngay_hop_dong
  joinDate: string; // ngay_vao_lam
  hometown: string; // que_quan
  permanentAddress: string; // thuong_tru
  idCardNumber: string; // cccd
  idCardDate: string; // ngay_cap
  idCardPlace: string; // noi_cap
  status: string; // trang_thai
  avatarUrl?: string; // anh_dai_dien
  fileUrl?: string; // ho_so_url
  notes?: string; // ghi_chu
}

export interface Attendance {
  id: string;
  employeeId: string; // ma_nv
  employeeName: string; // ten_nv
  date: string; // ngay
  timeIn?: string; // gio_vao
  shift: string; // ca_truc
  status: string; // trang_thai
  notes?: string; // ghi_chu
}

export interface FundTransaction {
  id: string;
  date: string; // ngay
  type: string; // loai
  content: string; // noi_dung
  performer: string; // nguoi_thuc_hien
  amount: number; // so_tien
  balanceAfter: number; // so_du_cuoi
}

export interface PrescriptionReport {
  id: string | number;
  date: string; // ngay
  totalIssued: number; // da_cap
  notReceived: number; // chua_nhan
  reason?: string; // ly_do
  reporter: string; // nguoi_bao_cao
  reporterId: string; // ma_nguoi_bao_cao
  attachmentUrls?: string[]; // dinh_kem
}

export interface AnnualEvaluation {
  id: string | number;
  year: number; // nam
  employeeId: string; // ma_nv
  fullName: string; // ho_ten
  position: string; // chuc_vu
  scoreProfessional: number; // diem_chuyen_mon
  scoreAttitude: number; // diem_thai_do
  scoreDiscipline: number; // diem_ky_luat
  averageScore: number; // diem_trung_binh
  rank: string; // xep_loai
  rewardProposal: string; // de_nghi_khen
  rewardTitle: string; // danh_hieu
  notes?: string; // ghi_chu
}

export interface Proposal {
  id: string | number;
  date: string; // ngay
  title: string; // tieu_de
  content: string; // noi_dung
  submitter: string; // nguoi_trinh
  fileUrl?: string; // file_url
  status: string; // trang_thai
}

export interface Shift {
  id: string;
  weekStart: string; // tuan_bat_dau
  weekEnd: string; // tuan_ket_thuc
  ca: string; // ca
  mon: string; // thu_2
  tue: string; // thu_3
  wed: string; // thu_4
  thu: string; // thu_5
  fri: string; // thu_6
  sat: string; // thu_7
  sun: string; // cn
}

export interface TempData {
  type: string; // loai
  value: string; // gia_tri
}

export interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  allowedRoles?: UserRole[];
}
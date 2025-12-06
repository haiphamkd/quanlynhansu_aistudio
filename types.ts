
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

// Updated based on VN Hospital standards
export enum EvaluationRank {
  EXCELLENT = "Hoàn thành xuất sắc nhiệm vụ",
  GOOD = "Hoàn thành tốt nhiệm vụ",
  COMPLETED = "Hoàn thành nhiệm vụ",
  LIMITED = "Hoàn thành nhiệm vụ nhưng còn hạn chế"
}

export const DEPARTMENTS = [
  "Khoa Dược",
  "Khoa Nội",
  "Khoa Ngoại",
  "Khoa Hồi sức cấp cứu",
  "Khoa Khám bệnh",
  "Phòng Kế hoạch tổng hợp",
  "Phòng Tổ chức cán bộ",
  "Phòng Tài chính kế toán",
  "Ban Giám đốc"
];

// Data Models
export interface Category {
  id: number;
  type: string; // 'ChucVu', 'TrinhDo', 'LyDo', etc.
  value: string;
  notes?: string;
}

export interface Employee {
  id: string; // Mã nhân viên
  fullName: string;
  department: string; // Khoa/Phòng
  dob: string; // Ngày sinh
  gender: 'Nam' | 'Nữ';
  position: string; // Chức vụ
  qualification: string; // Trình độ chuyên môn
  phone: string;
  email: string;
  
  // New fields
  contractDate: string; // Ngày hợp đồng
  joinDate: string; // Ngày vào làm
  hometown: string; // Quê quán
  permanentAddress: string; // Thường trú
  idCardNumber: string; // CCCD/CMND
  idCardDate: string; // Ngày cấp
  idCardPlace: string; // Nơi cấp
  
  status: EmployeeStatus | string; // Can be dynamic from Temp
  avatarUrl?: string; // Base64 or URL
  fileUrl?: string; // Hồ sơ drive
  notes?: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  department?: string;
  date: string; // YYYY-MM-DD
  timeIn?: string; // HH:mm:ss - Giờ quét thực tế
  shift: 'Sáng' | 'Chiều' | 'Cả ngày';
  status: 'Đi làm' | 'Nghỉ phép' | 'Nghỉ bệnh' | 'Trễ' | 'Khác' | 'Chưa quét';
  notes?: string;
}

export interface FundTransaction {
  id: string;
  date: string;
  department?: string;
  type: TransactionType;
  content: string;
  performer: string; // Người thực hiện
  amount: number;
  balanceAfter: number; // Số dư cuối (calculated)
}

export interface PrescriptionReport {
  id: string;
  date: string;
  department?: string;
  totalIssued: number; // Đã cấp
  notReceived: number; // Chưa nhận
  reason?: string;
  reporter: string; // Username/Name
  reporterId: string; // To check permission
  attachmentUrls?: string[]; // Nhiều file, stored as string separated by semicolon
}

export interface AnnualEvaluation {
  id: string;
  year: number;
  employeeId: string;
  fullName: string;
  department?: string;
  position: string; // Chức vụ tại thời điểm đánh giá
  
  // Scores
  scoreProfessional: number; 
  scoreAttitude: number; 
  scoreDiscipline: number; 
  averageScore: number;
  
  rank: EvaluationRank;
  
  // Rewards
  rewardProposal: 'Sở Y tế' | 'Bệnh viện' | 'Không' | string;
  rewardTitle: 'Chiến sĩ thi đua' | 'Giấy khen' | 'Lao động tiên tiến' | 'Không' | string;
  
  notes?: string;
}

export interface Proposal {
  id: string;
  date: string;
  department?: string;
  title: string; 
  proposalNumber?: string; // Số tờ trình
  content: string;
  submitter: string; 
  fileUrl?: string; // Link drive or Base64
  status: 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối';
  notes?: string;
}

export type UserRole = 'admin' | 'staff' | 'manager';

export interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  allowedRoles?: UserRole[]; // If undefined, allow all
}

export interface User {
  username: string;
  password?: string; // Only for backend logic
  role: UserRole; 
  name: string;
  department?: string; // Khoa/Phòng
  employeeId?: string; // Link to employee record
  mustChangePassword?: boolean; // Force change password on first login
}

// New Types
export interface Shift {
  id: string; // Format: TuanStart-Ca (e.g., 2023-10-02-Sang)
  department?: string;
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string; // YYYY-MM-DD (Sunday)
  ca: 'Sáng' | 'Chiều' | 'Đêm' | 'Cả ngày';
  mon: string; // Employee Name(s) or ID
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
}

export interface TempData {
  type: string; // 'TrinhDo', 'TrangThai', 'NoiCap'
  value: string;
}

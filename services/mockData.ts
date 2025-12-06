
import { Employee, EmployeeStatus, FundTransaction, TransactionType, PrescriptionReport, Attendance, AnnualEvaluation, EvaluationRank, Proposal } from '../types';

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: "NV001",
    fullName: "Nguyễn Văn A",
    department: "Khoa Dược",
    dob: "1990-05-15",
    gender: "Nam",
    position: "Trưởng khoa",
    qualification: "Dược sĩ CKII",
    phone: "0909123456",
    email: "nguyenvana@hospital.com",
    contractDate: "2014-12-01",
    joinDate: "2015-01-01",
    hometown: "Hà Nội",
    permanentAddress: "123 Đường Láng, Hà Nội",
    idCardNumber: "001090000001",
    idCardDate: "2021-01-01",
    idCardPlace: "Cục CS QLHC",
    status: EmployeeStatus.ACTIVE,
    avatarUrl: "https://ui-avatars.com/api/?name=Nguyen+Van+A&background=0D9488&color=fff",
    notes: "Quản lý chung"
  },
  {
    id: "NV002",
    fullName: "Trần Thị B",
    department: "Khoa Dược",
    dob: "1995-08-20",
    gender: "Nữ",
    position: "Dược sĩ lâm sàng",
    qualification: "Dược sĩ đại học",
    phone: "0909654321",
    email: "tranthib@hospital.com",
    contractDate: "2018-06-01",
    joinDate: "2018-06-15",
    hometown: "Nam Định",
    permanentAddress: "456 Giải Phóng, Hà Nội",
    idCardNumber: "001195000002",
    idCardDate: "2021-05-01",
    idCardPlace: "Cục CS QLHC",
    status: EmployeeStatus.ACTIVE,
    avatarUrl: "https://ui-avatars.com/api/?name=Tran+Thi+B&background=DB2777&color=fff"
  }
];

export const MOCK_FUNDS: FundTransaction[] = [
  {
    id: "T001",
    date: "2023-10-01",
    type: TransactionType.INCOME,
    content: "Thu quỹ hàng tháng T10",
    performer: "Nguyễn Văn A",
    amount: 5000000,
    balanceAfter: 5000000
  },
  {
    id: "T002",
    date: "2023-10-05",
    type: TransactionType.EXPENSE,
    content: "Mua văn phòng phẩm",
    performer: "Trần Thị B",
    amount: 1200000,
    balanceAfter: 3800000
  }
];

export const MOCK_REPORTS: PrescriptionReport[] = [
  { id: "R001", date: "2023-10-20", totalIssued: 150, notReceived: 5, reason: "Bệnh nhân vắng", reporter: "Trần Thị B", reporterId: "NV002" },
  { id: "R002", date: "2023-10-21", totalIssued: 165, notReceived: 2, reason: "Hết thuốc lẻ", reporter: "Trần Thị B", reporterId: "NV002" },
];

export const MOCK_ATTENDANCE: Attendance[] = [
  { id: "A001", employeeId: "NV001", employeeName: "Nguyễn Văn A", date: "2023-10-24", timeIn: "07:30:00", shift: "Cả ngày", status: "Đi làm" },
  { id: "A002", employeeId: "NV002", employeeName: "Trần Thị B", date: "2023-10-24", timeIn: "07:35:00", shift: "Cả ngày", status: "Đi làm" },
];

export const MOCK_EVALUATIONS: AnnualEvaluation[] = [
  { 
    id: "E001", year: 2023, employeeId: "NV001", fullName: "Nguyễn Văn A", position: "Trưởng khoa",
    scoreProfessional: 95, scoreAttitude: 90, scoreDiscipline: 95, 
    averageScore: 93.3, rank: EvaluationRank.EXCELLENT,
    rewardProposal: "Sở Y tế", rewardTitle: "Chiến sĩ thi đua",
    notes: "Hoàn thành xuất sắc" 
  }
];

export const MOCK_PROPOSALS: Proposal[] = [
  { 
    id: "P001", date: "2023-10-10", title: "Xin mua máy in mới", 
    content: "Máy in cũ đã hỏng drum, chi phí sửa chữa cao.", 
    submitter: "Nguyễn Văn A", status: "Đã duyệt", 
    fileUrl: "#" 
  }
];
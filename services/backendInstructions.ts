export const GOOGLE_APPS_SCRIPT_CODE = `
/**
 * PHARMA HR BACKEND - JSON MODE (FINAL)
 * ID: 1QiPcqn--e7XH2pQDgth_rJM6fLNpmJGZ
 */
const DRIVE_FOLDER_ID = "1QiPcqn--e7XH2pQDgth_rJM6fLNpmJGZ"; 

const SHEETS_CONFIG = {
  'NhanVien': ['ID', 'HoTen', 'NgaySinh', 'GioiTinh', 'ChucVu', 'TrinhDo', 'SDT', 'Email', 'NgayHopDong', 'NgayVaoLam', 'QueQuan', 'ThuongTru', 'CCCD', 'NgayCap', 'NoiCap', 'TrangThai', 'AvatarURL', 'HoSoURL', 'GhiChu'],
  'ChamCong': ['ID', 'MaNV', 'TenNV', 'Ngay', 'GioVao', 'Ca', 'TrangThai', 'GhiChu'],
  'QuyKhoa': ['ID', 'Ngay', 'Loai', 'NoiDung', 'NguoiThucHien', 'SoTien', 'SoDuCuoi'],
  'DonThuoc': ['ID', 'Ngay', 'DaCap', 'ChuaNhan', 'LyDo', 'NguoiBaoCao', 'MaNguoiBaoCao', 'DinhKemURL'],
  'DanhGiaNam': ['ID', 'Nam', 'MaNV', 'HoTen', 'ChucVu', 'DiemCM', 'DiemTD', 'DiemKL', 'DiemTB', 'XepLoai', 'DeNghiKH', 'DanhHieu', 'GhiChu'],
  'ToTrinh': ['ID', 'Ngay', 'TieuDe', 'NoiDung', 'NguoiTrinh', 'TrangThai', 'FileDinhKem'],
  'Users': ['Username', 'Password', 'Role', 'FullName', 'EmployeeID'],
  'LichTruc': ['ID', 'TuanBatDau', 'TuanKetThuc', 'Ca', 'Thu2', 'Thu3', 'Thu4', 'Thu5', 'Thu6', 'Thu7', 'CN'],
  'Temp': ['Loai', 'GiaTri']
};

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  for (let sheetName in SHEETS_CONFIG) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(SHEETS_CONFIG[sheetName]);
      sheet.setFrozenRows(1);
      if (sheetName === 'Users') sheet.appendRow(['admin', 'admin', 'admin', 'Quản trị viên', '']);
    }
  }
}

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(5000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let postData = {};

    // 1. Cố gắng parse JSON từ postData.contents (Text/Plain)
    if (e.postData && e.postData.contents) {
       try {
         postData = JSON.parse(e.postData.contents);
       } catch (err) {}
    } 
    // 2. Fallback: Nếu gửi form data
    else if (e.parameter.data) {
       try {
         postData = JSON.parse(e.parameter.data);
       } catch (err) {}
    }

    // 3. Lấy action
    let action = e.parameter.action || postData.action;
    let result = {};

    if (action === 'test') {
       result = { success: true, message: 'Kết nối thành công tới Google Apps Script (JSON Mode)' };
    }
    else if (action === 'login') {
       const users = getData(ss, 'Users');
       const user = users.find(u => String(u.username).trim() == String(postData.username).trim() && String(u.password).trim() == String(postData.password).trim());
       if (user) {
         result = { success: true, user: { username: user.username, role: user.role, name: user.fullName, employeeId: user.employeeId } };
       } else {
         result = { error: 'Tên đăng nhập hoặc mật khẩu không đúng' };
       }
    }
    // GETTERS
    else if (action === 'getEmployees') result = getData(ss, 'NhanVien');
    else if (action === 'getFunds') result = getData(ss, 'QuyKhoa');
    else if (action === 'getReports') result = getData(ss, 'DonThuoc');
    else if (action === 'getAttendance') result = getData(ss, 'ChamCong');
    else if (action === 'getEvaluations') result = getData(ss, 'DanhGiaNam');
    else if (action === 'getProposals') result = getData(ss, 'ToTrinh');
    else if (action === 'getShifts') result = getData(ss, 'LichTruc');
    else if (action === 'getDropdowns') result = getData(ss, 'Temp');
    else if (action === 'getUsers') result = getData(ss, 'Users');

    // SETTERS
    else if (action === 'addEmployee') addRow(ss, 'NhanVien', postData);
    else if (action === 'updateEmployee') updateRow(ss, 'NhanVien', postData, 0);
    else if (action === 'deleteEmployee') deleteRow(ss, 'NhanVien', postData.id, 0);
    else if (action === 'saveAttendance') saveAttendanceBatch(ss, postData.records);
    else if (action === 'addFund') {
      const sheet = ss.getSheetByName('QuyKhoa');
      const lastRow = sheet.getLastRow();
      let lastBalance = 0;
      if (lastRow > 1) lastBalance = parseFloat(sheet.getRange(lastRow, 7).getValue()) || 0;
      const amount = parseFloat(postData.amount);
      const newBalance = postData.type === 'Thu' ? lastBalance + amount : lastBalance - amount;
      postData.balanceAfter = newBalance;
      addRow(ss, 'QuyKhoa', postData);
    }
    else if (action === 'addReport') {
       if (postData.id && String(postData.id).startsWith('R-')) {
          const res = updateRow(ss, 'DonThuoc', postData, 0);
          if (res.error) addRow(ss, 'DonThuoc', postData);
       } else addRow(ss, 'DonThuoc', postData);
    }
    else if (action === 'deleteReport') deleteRow(ss, 'DonThuoc', postData.id, 0);
    else if (action === 'addEvaluation') addRow(ss, 'DanhGiaNam', postData);
    else if (action === 'deleteEvaluation') deleteRow(ss, 'DanhGiaNam', postData.id, 0);
    else if (action === 'addProposal') addRow(ss, 'ToTrinh', postData);
    else if (action === 'saveShift') {
       deleteRow(ss, 'LichTruc', postData.id, 0); 
       addRow(ss, 'LichTruc', postData);
    }

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({error: e.toString()})).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function getData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  return rows.map(row => {
    let obj = {};
    SHEETS_CONFIG[sheetName].forEach((key, index) => { obj[mapKeyToApp(sheetName, key)] = row[index]; });
    return obj;
  });
}
function addRow(ss, sheetName, data) {
  const sheet = ss.getSheetByName(sheetName);
  let row = [];
  if (data.avatarUrl && String(data.avatarUrl).startsWith('data:')) data.avatarUrl = uploadFile(data.avatarUrl, data.fullName + "_avatar");
  if (data.fileUrl && String(data.fileUrl).startsWith('data:')) data.fileUrl = uploadFile(data.fileUrl, "File_" + Date.now());
  if (data.attachmentUrls && Array.isArray(data.attachmentUrls)) data.attachmentUrls = data.attachmentUrls.join(';');
  SHEETS_CONFIG[sheetName].forEach(key => { row.push(data[mapKeyToApp(sheetName, key)] || ''); });
  sheet.appendRow(row);
  return {success: true};
}
function updateRow(ss, sheetName, data, idColIndex) {
  const sheet = ss.getSheetByName(sheetName);
  const rows = sheet.getDataRange().getValues();
  if (data.avatarUrl && String(data.avatarUrl).startsWith('data:')) data.avatarUrl = uploadFile(data.avatarUrl, data.fullName + "_avatar");
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idColIndex] == data.id) {
       let newRow = [];
       SHEETS_CONFIG[sheetName].forEach(key => { newRow.push(data[mapKeyToApp(sheetName, key)] || ''); });
       sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
       return {success: true};
    }
  }
  return {error: "Not found"};
}
function deleteRow(ss, sheetName, id, idColIndex) {
  const sheet = ss.getSheetByName(sheetName);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idColIndex] == id) { sheet.deleteRow(i + 1); return {success: true}; }
  }
  return {error: "Not found"};
}
function saveAttendanceBatch(ss, records) {
   const sheet = ss.getSheetByName('ChamCong');
   let dataToAdd = [];
   records.forEach(rec => { dataToAdd.push([rec.id, rec.employeeId, rec.employeeName, rec.date, rec.timeIn, rec.shift, rec.status, rec.notes]); });
   if (dataToAdd.length > 0) sheet.getRange(sheet.getLastRow() + 1, 1, dataToAdd.length, 8).setValues(dataToAdd);
   return {success: true};
}
function uploadFile(base64Data, fileName) {
  try {
    let folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    let contentType = base64Data.substring(5, base64Data.indexOf(';'));
    let bytes = Utilities.base64Decode(base64Data.substring(base64Data.indexOf(',') + 1));
    let blob = Utilities.newBlob(bytes, contentType, fileName);
    let file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getDownloadUrl();
  } catch (e) { return "Error Upload"; }
}
function mapKeyToApp(sheet, key) {
  const MAP = {
    'ID': 'id', 'HoTen': 'fullName', 'NgaySinh': 'dob', 'GioiTinh': 'gender', 'ChucVu': 'position',
    'TrinhDo': 'qualification', 'SDT': 'phone', 'Email': 'email', 'NgayHopDong': 'contractDate',
    'NgayVaoLam': 'joinDate', 'QueQuan': 'hometown', 'ThuongTru': 'permanentAddress', 'CCCD': 'idCardNumber',
    'NgayCap': 'idCardDate', 'NoiCap': 'idCardPlace', 'TrangThai': 'status', 'AvatarURL': 'avatarUrl',
    'HoSoURL': 'fileUrl', 'GhiChu': 'notes',
    'MaNV': 'employeeId', 'TenNV': 'employeeName', 'Ngay': 'date', 'GioVao': 'timeIn', 'Ca': 'shift',
    'Loai': 'type', 'NoiDung': 'content', 'NguoiThucHien': 'performer', 'SoTien': 'amount', 'SoDuCuoi': 'balanceAfter',
    'DaCap': 'totalIssued', 'ChuaNhan': 'notReceived', 'LyDo': 'reason', 'NguoiBaoCao': 'reporter', 'MaNguoiBaoCao': 'reporterId', 'DinhKemURL': 'attachmentUrls',
    'Nam': 'year', 'DiemCM': 'scoreProfessional', 'DiemTD': 'scoreAttitude', 'DiemKL': 'scoreDiscipline', 'DiemTB': 'averageScore', 'XepLoai': 'rank', 'DeNghiKH': 'rewardProposal', 'DanhHieu': 'rewardTitle',
    'TieuDe': 'title', 'NguoiTrinh': 'submitter', 'FileDinhKem': 'fileUrl',
    'Username': 'username', 'Password': 'password', 'Role': 'role', 'FullName': 'name', 'EmployeeID': 'employeeId',
    'TuanBatDau': 'weekStart', 'TuanKetThuc': 'weekEnd', 'Thu2': 'mon', 'Thu3': 'tue', 'Thu4': 'wed', 'Thu5': 'thu', 'Thu6': 'fri', 'Thu7': 'sat', 'CN': 'sun',
    'GiaTri': 'value'
  };
  return MAP[key] || key.toLowerCase();
}
`;
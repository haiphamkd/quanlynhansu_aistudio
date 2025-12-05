// 1. DATE FORMATTING (dd/mm/yyyy)
export const formatDateVN = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date); // Output: 01/01/2024
  } catch (e) {
    return String(dateString);
  }
};

// 2. NUMBER FORMATTING (1.234.567)
export const formatNumberInput = (value: number | string | undefined): string => {
  if (value === undefined || value === null || value === '') return '';
  const numStr = String(value).replace(/\D/g, ''); // Chỉ giữ lại số
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const parseNumberInput = (value: string): number => {
  if (!value) return 0;
  return Number(value.replace(/\./g, ''));
};

export const formatCurrencyVN = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// 3. USERNAME GENERATOR
// "Phạm Phi Hải" -> "haipp"
export const generateUsername = (fullName: string): string => {
  if (!fullName) return '';
  
  // Xóa dấu tiếng Việt
  const nonAccentName = fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase();

  // Tách từ
  const parts = nonAccentName.trim().split(/\s+/);
  if (parts.length === 0) return '';

  // Lấy tên (từ cuối cùng)
  const lastName = parts[parts.length - 1];

  // Lấy chữ cái đầu của họ và tên đệm
  const initials = parts.slice(0, parts.length - 1).map(p => p.charAt(0)).join('');

  return `${lastName}${initials}`;
};

export const getCurrentTime = (): string => {
  const now = new Date();
  return now.toLocaleTimeString('vi-VN', { hour12: false });
};
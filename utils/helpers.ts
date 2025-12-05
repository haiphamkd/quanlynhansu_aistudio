
export const formatDateVN = (isoDateString: string): string => {
  if (!isoDateString) return '';
  
  // Check if already in dd/mm/yyyy format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoDateString)) return isoDateString;

  try {
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) return isoDateString;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (e) {
    return isoDateString;
  }
};

export const formatDateTimeVN = (isoDateString: string): string => {
   if (!isoDateString) return '';
   const date = new Date(isoDateString);
   if (isNaN(date.getTime())) return isoDateString;
   
   const day = date.getDate().toString().padStart(2, '0');
   const month = (date.getMonth() + 1).toString().padStart(2, '0');
   const year = date.getFullYear();
   const hours = date.getHours().toString().padStart(2, '0');
   const minutes = date.getMinutes().toString().padStart(2, '0');

   return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export const formatCurrencyVN = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const formatNumberInput = (value: number | string): string => {
  if (value === undefined || value === null || value === '') return '';
  // Remove non-digits
  const cleanVal = String(value).replace(/\D/g, '');
  // Format with dots for thousands (standard Vietnamese format)
  return cleanVal.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const parseNumberInput = (value: string): number => {
  if (!value) return 0;
  // Remove dots to parse back to number
  return Number(String(value).replace(/\./g, ''));
};

export const getCurrentTime = (): string => {
  const now = new Date();
  return now.toLocaleTimeString('vi-VN', { hour12: false });
};

import { GoogleGenerativeAI } from "@google/generative-ai";
import { FundTransaction, PrescriptionReport } from "../types";

export const analyzeDepartmentData = async (
  funds: FundTransaction[],
  reports: PrescriptionReport[]
): Promise<string> => {
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';

  if (!apiKey) return "Vui lòng cấu hình API Key để sử dụng tính năng AI.";

  const fundSummary = funds.map(f => `${f.date}: ${f.type} ${f.amount} (${f.content})`).join('\n');
  const reportSummary = reports.map(r => `${r.date}: Cấp ${r.totalIssued}, Chưa nhận ${r.notReceived}, Lý do: ${r.reason}`).join('\n');

  const prompt = `
    Đóng vai trò là trợ lý ảo quản lý Khoa Dược. Hãy phân tích dữ liệu ngắn gọn dưới đây và đưa ra nhận xét, cảnh báo hoặc xu hướng quan trọng (dưới 150 từ):
    
    Tài chính:
    ${fundSummary}

    Cấp phát thuốc:
    ${reportSummary}
    
    Hãy tập trung vào sự bất thường hoặc xu hướng tăng giảm.
  `;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "Không thể phân tích dữ liệu.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Đã xảy ra lỗi khi gọi AI.";
  }
};

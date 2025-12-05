import { GoogleGenAI } from "@google/genai";
import { FundTransaction, PrescriptionReport } from "../types";

export const analyzeDepartmentData = async (
  funds: FundTransaction[],
  reports: PrescriptionReport[]
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Không thể phân tích dữ liệu.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Đã xảy ra lỗi khi gọi AI.";
  }
};

import { GoogleGenAI } from "@google/genai";
import { QuizQuestion, ChatMessage } from "../types";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SAFETY_SYSTEM_INSTRUCTION = `
    Bạn là một Giáo viên Lịch sử Việt Nam chuyên nghiệp và uy tín, đang giảng dạy theo bộ sách giáo khoa "Chân trời sáng tạo".
    
    NGUYÊN TẮC CỐT LÕI (BẮT BUỘC TUÂN THỦ):
    1. Tuyệt đối trung thực với lịch sử, bám sát Sách Giáo Khoa Lịch Sử của Bộ Giáo dục & Đào tạo Việt Nam.
    2. Trả lời chi tiết, mạch lạc, dễ hiểu, phù hợp với học sinh. Các đoạn văn phải được tách dòng rõ ràng (xuống dòng giữa các ý) để dễ đọc, không viết dính chùm. In đậm các **từ khóa quan trọng**.
    3. KHÔNG bịa đặt, KHÔNG xuyên tạc, KHÔNG đưa thông tin chưa kiểm chứng hoặc nhạy cảm chính trị đi ngược lại quan điểm chính thống của Nhà nước Việt Nam.
    4. Nếu gặp câu hỏi nhạy cảm không phù hợp giáo dục hoặc xuyên tạc lịch sử, hãy từ chối lịch sự và hướng về bài học chính thống.
    5. Nếu cần thiết, hãy tự kiểm chứng lại dữ liệu (ngày tháng, nhân vật) thêm một lần nữa trước khi trả lời.
    6. Trả lời với phong cách Sư phạm, nghiêm túc nhưng gần gũi. Xưng hô là "mình" hoặc xưng tên "Gemini", KHÔNG tự xưng là "giáo viên Lịch sử" hay "thầy/cô" để tránh hiểu lầm là người thật.
`;

export const askHistoryTutor = async (question: string, context?: string): Promise<string> => {
  try {
    // FIX: Updated deprecated model 'gemini-2.5-flash' to 'gemini-3-flash-preview' as per Gemini API guidelines.
    const model = 'gemini-3-flash-preview';
    
    // Construct the message content
    let content = "";
    if (context) {
      content += `Ngữ cảnh từ SGK/Tư liệu: ${context}\n\n`;
    }
    content += `Câu hỏi của học sinh: ${question}`;

    const response = await ai.models.generateContent({
      model: model,
      contents: content,
      config: {
        systemInstruction: SAFETY_SYSTEM_INSTRUCTION,
      }
    });

    // FIX: Access the 'text' property directly instead of calling a method.
    return response.text || "Xin lỗi, hệ thống đang kiểm tra lại dữ liệu, bạn vui lòng thử lại sau nhé.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Hệ thống AI đang bảo trì hoặc chưa cấu hình API Key.";
  }
};

// Hàm tổng hợp kiến thức theo chủ đề tùy chọn
export const synthesizeHistoryTopic = async (topic: string): Promise<string> => {
    try {
        // FIX: Updated deprecated model 'gemini-2.5-flash' to 'gemini-3-flash-preview' as per Gemini API guidelines.
        const model = 'gemini-3-flash-preview';
        const prompt = `
            Học sinh muốn tìm hiểu về chủ đề: "${topic}".
            
            NHIỆM VỤ CỦA BẠN:
            Dựa trên kiến thức Sách Giáo Khoa Lịch Sử (đặc biệt là chương trình Lớp 12 - Chân trời sáng tạo), hãy tổng hợp thông tin về chủ đề này.
            
            CẤU TRÚC BÀI TRẢ LỜI (Sử dụng Markdown):
            1. **Giới thiệu/Bối cảnh**: Tóm tắt ngắn gọn.
            2. **Nội dung chính**: Các sự kiện, mốc thời gian, hoặc diễn biến quan trọng nhất (gạch đầu dòng).
            3. **Kết quả & Ý nghĩa**: Tác động lịch sử.
            
            Lưu ý: Tự động xuống dòng giữa các đoạn văn. In đậm các sự kiện quan trọng.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: SAFETY_SYSTEM_INSTRUCTION,
            }
        });

        // FIX: Access the 'text' property directly instead of calling a method.
        return response.text || "Không thể tổng hợp thông tin lúc này.";
    } catch (error) {
        console.error("Synthesis Error:", error);
        return "Lỗi kết nối khi tổng hợp kiến thức.";
    }
};

// Hàm mới hỗ trợ Chat hội thoại liên tục
export const sendMessageToHistoryTutor = async (
    history: ChatMessage[], 
    newMessage: string, 
    attachment?: { data: string, mimeType: string }
): Promise<string> => {
    try {
        // FIX: Updated deprecated model 'gemini-3-flash-preview' to 'gemini-3-flash-preview' (already correct)
        const model = 'gemini-3-flash-preview';
        
        // Convert internal ChatMessage type to Gemini Content type
        const contents = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text || msg.content || "" }]
        }));

        // Construct the new message parts
        const parts: any[] = [{ text: newMessage }];
        
        // Add attachment if present
        if (attachment) {
            parts.push({
                inlineData: {
                    data: attachment.data,
                    mimeType: attachment.mimeType
                }
            });
        }

        // Add the new message
        contents.push({
            role: 'user',
            parts: parts
        });

        const response = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: {
                systemInstruction: SAFETY_SYSTEM_INSTRUCTION,
            }
        });

        // FIX: Access the 'text' property directly instead of calling a method.
        return response.text || "Xin lỗi, mình chưa nghe rõ, bạn nhắc lại được không?";
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        return "Kết nối AI bị gián đoạn. Vui lòng thử lại sau.";
    }
}

export const generateQuizQuestions = async (topic: string, count: number, mode: string): Promise<QuizQuestion[]> => {
  try {
    let mcqCount = count, tfCount = 0;
    if (mode === 'mix') { mcqCount = Math.round(count * 0.7); tfCount = count - mcqCount; }
    else if (mode === 'tf_group') { mcqCount = 0; tfCount = count; }

    const prompt = `
        Tạo bộ câu hỏi lịch sử về chủ đề: "${topic}".
        Tổng: ${count} câu.
        - ${mcqCount} câu Trắc nghiệm (4 chọn 1).
        - ${tfCount} câu Đúng/Sai Chùm.
        
        QUY TẮC BẮT BUỘC (QUAN TRỌNG):
        1. Nội dung chính xác tuyệt đối theo SGK Lịch Sử Việt Nam (Chân trời sáng tạo).
        2. Đối với câu trắc nghiệm (mcq):
           - BẮT BUỘC phải có đủ 4 đáp án (options).
           - Nội dung đáp án CHỈ chứa chữ cái nội dung, KHÔNG bao gồm tiền tố như "A.", "B.", "1.", "2.".
           - TUYỆT ĐỐI KHÔNG tạo câu hỏi dạng "Cả A, B, C đều đúng", "Tất cả các đáp án trên", "Không có đáp án nào đúng". Các phương án nhiễu phải là nội dung lịch sử cụ thể.
        3. Đối với câu Đúng/Sai Chùm (tf_group):
           - "context" phải là một đoạn thông tin hoặc tình huống có thật trong lịch sử (độ dài khoảng 50-100 từ) để cung cấp đủ dữ kiện. KHÔNG đặt context trong dấu nháy kép "".
           - "subQuestions" BẮT BUỘC phải có đúng 4 mệnh đề.
           - "text" của mệnh đề chỉ chứa nội dung, TUYỆT ĐỐI KHÔNG chứa tiền tố như "Mệnh đề 1:", "Mệnh đề 2:".
           - Các mệnh đề phải bao gồm 3 mức độ: Nhận biết (thông tin có trong context), Thông hiểu (suy luận từ context) và Vận dụng (liên hệ kiến thức bên ngoài).
        
        Output JSON Array format: 
        [
          { "type": "mcq", "question": "...", "options": ["Nội dung A", "Nội dung B", "Nội dung C", "Nội dung D"], "correctIndex": 0, "explanation": "..." }, 
          { 
            "type": "tf_group", 
            "context": "Đoạn văn bản lịch sử...", 
            "subQuestions": [
                {"text": "Nội dung mệnh đề 1", "answer": true},
                {"text": "Nội dung mệnh đề 2", "answer": false},
                {"text": "Nội dung mệnh đề 3", "answer": true},
                {"text": "Nội dung mệnh đề 4", "answer": false}
            ], 
            "explanation": "..."
          }
        ]
    `;

    const response = await ai.models.generateContent({
      // FIX: Updated deprecated model 'gemini-2.5-flash' to 'gemini-3-flash-preview' as per Gemini API guidelines.
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: SAFETY_SYSTEM_INSTRUCTION
      }
    });

    // FIX: Access the 'text' property directly instead of calling a method.
    if (response.text) {
      const cleanJson = response.text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson) as QuizQuestion[];
    }
    return [];
  } catch (error) {
    console.error("Generate Quiz Error:", error);
    throw error;
  }
};

export const checkQuizReport = async (questionData: string, userReport: string): Promise<string> => {
    const prompt = `
        Đóng vai là một Thẩm định viên Lịch sử uy tín.
        Người dùng báo cáo lỗi về câu hỏi sau:
        
        [DỮ LIỆU CÂU HỎI HIỆN TẠI]
        ${questionData}

        [BÁO CÁO CỦA NGƯỜI DÙNG]
        "${userReport}"

        NHIỆM VỤ:
        1. Xác minh xem báo cáo của người dùng là ĐÚNG hay SAI dựa trên SGK.
        2. Giải thích ngắn gọn lý do, chia đoạn rõ ràng.
        3. Nếu câu hỏi gốc của hệ thống sai, hãy đưa ra thông tin đính chính.
        
        Trả lời ngắn gọn, format Markdown, in đậm từ khóa.
    `;
    return await askHistoryTutor(prompt);
};

export const explainQuizDeeply = async (content: string): Promise<string> => {
    const prompt = `
    Dựa trên dữ liệu câu hỏi, đáp án đúng và giải thích ngắn gọn được cung cấp dưới đây, hãy viết một bài phân tích chuyên sâu hơn về các khía cạnh lịch sử liên quan.
    
    [DỮ LIỆU GỐC]
    ${content}
    
    [YÊU CẦU PHÂN TÍCH]
    1. Phân tích sâu hơn về **bối cảnh**, **nguyên nhân**, và **diễn biến** của sự kiện.
    2. Mở rộng về **kết quả** và **ý nghĩa lịch sử** của sự kiện đó.
    3. Nếu có nhân vật liên quan, hãy nói thêm về vai trò của họ.
    
    [QUY TẮC TRÌNH BÀY]
    - Bám sát SGK Lịch sử 12 (Chân trời sáng tạo).
    - Chia nội dung thành các đoạn nhỏ, xuống dòng rõ ràng để dễ đọc.
    - In đậm các **thuật ngữ, tên riêng, hoặc sự kiện quan trọng**.
    - Trả lời như một người bạn học giỏi Lịch sử đang chia sẻ kiến thức (xưng "mình" - "bạn").
    `;
    return await askHistoryTutor(prompt);
};

export const generateTHPTExam = async (matrixJson: any): Promise<QuizQuestion[]> => {
    try {
        let allQuestions: QuizQuestion[] = [];
        const topics = matrixJson.matrix_data || [];

        for (const topicData of topics) {
            const numMcq = Object.values(topicData.part_1 as Record<string, number>).reduce((a: number, b: number) => a + b, 0);
            const numTf = Object.values(topicData.part_2 as Record<string, number>).reduce((a: number, b: number) => a + b, 0) / 4;
            
            if (topicData.total_questions === 0) continue;

            const prompt = `
                Hãy đóng vai một chuyên gia ra đề thi Tốt nghiệp THPT Quốc gia môn Lịch sử.
                Dựa vào YÊU CẦU CHỦ ĐỀ dưới đây, hãy tạo ra các câu hỏi trắc nghiệm.
                
                [YÊU CẦU CHỦ ĐỀ]
                ${JSON.stringify(topicData)}

                YÊU CẦU NGHIÊM NGẶT VỀ OUTPUT JSON:
                Output trả về MỘT mảng JSON chứa các câu hỏi.
                
                1. Dạng Trắc nghiệm nhiều lựa chọn (Phần I - mcq):
                {
                    "type": "mcq",
                    "context": "Tùy chọn: Một đoạn văn bản lịch sử ngắn nếu câu hỏi cần bối cảnh...",
                    "question": "Nội dung câu hỏi đầy đủ...",
                    "options": ["Phương án 1", "Phương án 2", "Phương án 3", "Phương án 4"],
                    "correctIndex": 0,
                    "explanation": "Giải thích chi tiết..."
                }
                *Lưu ý: "options" không chứa A, B, C, D ở đầu.

                2. Dạng Trắc nghiệm Đúng/Sai (Phần II - tf_group):
                {
                    "type": "tf_group",
                    "context": "Đoạn tư liệu lịch sử cụ thể (khoảng 50-100 chữ). Có thể là văn bản, bảng biểu, hoặc trích dẫn nghị quyết. BẮT BUỘC PHẢI CÓ NỘI DUNG, KHÔNG ĐỂ TRỐNG.",
                    "subQuestions": [
                        {"text": "Nội dung mệnh đề 1...", "answer": true},
                        {"text": "Nội dung mệnh đề 2...", "answer": false},
                        {"text": "Nội dung mệnh đề 3...", "answer": true},
                        {"text": "Nội dung mệnh đề 4...", "answer": false}
                    ],
                    "explanation": "Giải thích..."
                }
                *Lưu ý: "text" trong "subQuestions" chỉ chứa nội dung mệnh đề, TUYỆT ĐỐI KHÔNG chứa tiền tố như "Mệnh đề 1:", "1.", v.v.

                *** QUY TẮC QUAN TRỌNG NHẤT VỀ SỐ LƯỢNG ***
                1. Tổng số câu hỏi (question objects) trong mảng JSON đầu ra phải là ${topicData.total_questions}.
                2. Cụ thể: Tạo đúng ${numMcq} câu dạng "mcq" và ${numTf} câu dạng "tf_group".
                3. Mỗi câu "tf_group" BẮT BUỘC phải có 4 "subQuestions".
                4. Nội dung bám sát chương trình GDPT môn Lịch sử (Lớp ${topicData.grade}, Bộ Chân trời sáng tạo).
                5. Đảm bảo tính chính xác khoa học.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    systemInstruction: SAFETY_SYSTEM_INSTRUCTION
                }
            });

            if (response.text) {
                const cleanJson = response.text.replace(/```json|```/g, '').trim();
                const questions = JSON.parse(cleanJson) as QuizQuestion[];
                
                const processedQuestions = questions.map(q => {
                    if (q.type === 'tf_group' && (!q.context || q.context.trim() === "")) {
                        q.context = "Dựa vào kiến thức lịch sử đã học, hãy xác định tính đúng sai của các mệnh đề sau:";
                    }
                    return q;
                });
                allQuestions = [...allQuestions, ...processedQuestions];
            }
        }
        
        // Sort questions: mcq first, then tf_group
        const mcqQuestions = allQuestions.filter(q => q.type === 'mcq');
        const tfQuestions = allQuestions.filter(q => q.type === 'tf_group');
        return [...mcqQuestions, ...tfQuestions];
    } catch (error) {
        console.error("Generate THPT Exam Error:", error);
        throw error;
    }
};

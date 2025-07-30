// functions/text-to-speech.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
    // Lấy Key và Region từ biến môi trường của Netlify
    const SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
    const SPEECH_REGION = process.env.AZURE_SPEECH_REGION;

    // Lấy văn bản và ngôn ngữ từ yêu cầu của client
    const { text, lang } = event.queryStringParameters;

    // Kiểm tra đầu vào
    if (!SPEECH_KEY || !SPEECH_REGION) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Chưa cấu hình API Key hoặc Region trên Netlify.' }) };
    }
    if (!text || !lang) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Thiếu tham số text hoặc lang.' }) };
    }

    // URL của Azure API sẽ thay đổi tùy theo khu vực
    const endpoint = `https://${SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

    // Chọn giọng đọc cho từng ngôn ngữ
    let voiceName = '';
    if (lang === 'en-US') {
        voiceName = 'en-US-JennyNeural'; // Giọng nữ US chất lượng cao
    } else if (lang === 'vi-VN') {
        voiceName = 'vi-VN-HoaiMyNeural'; // Giọng nữ VN chất lượng cao
    }

    // Azure sử dụng định dạng SSML (Speech Synthesis Markup Language)
    const ssml = `
        <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${lang}'>
            <voice name='${voiceName}'>
                ${text}
            </voice>
        </speak>
    `;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': SPEECH_KEY,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', // Định dạng âm thanh đầu ra
            },
            body: ssml,
        });

        if (!response.ok) {
            // Nếu có lỗi từ Azure, trả về thông báo lỗi
            const errorBody = await response.text();
            console.error('Azure API Error:', errorBody);
            return { statusCode: response.status, body: JSON.stringify({ error: errorBody }) };
        }

        // Azure trả về dữ liệu âm thanh thô (binary), không phải JSON
        const audioBuffer = await response.buffer();
        // Chuyển nó thành chuỗi base64 để gửi về client
        const base64Audio = audioBuffer.toString('base64');

        // Trả về một đối tượng JSON có cấu trúc giống hệt Google API
        // để client không cần thay đổi code
        return {
            statusCode: 200,
            body: JSON.stringify({ audioContent: base64Audio }),
        };

    } catch (error) {
        console.error('Netlify Function Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Lỗi trong Netlify Function.' }) };
    }
};
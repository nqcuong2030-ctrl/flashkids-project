const fetch = require('node-fetch');

exports.handler = async (event) => {
    // Bọc toàn bộ logic trong try...catch để bắt tất cả lỗi
    try {
        const SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
        const SPEECH_REGION = process.env.AZURE_SPEECH_REGION;

        if (!SPEECH_KEY || !SPEECH_REGION) {
            throw new Error('Chưa cấu hình API Key hoặc Region trên Netlify.');
        }

        // --- PHẦN SỬA LỖI QUAN TRỌNG ---
        let bodyData;
        if (typeof event.body === 'string') {
            // Nếu body là string, parse nó
            bodyData = JSON.parse(event.body);
        } else {
            // Nếu không phải string (đã là object), dùng trực tiếp
            bodyData = event.body || {};
        }
        const { text, lang, voice } = bodyData;
        // --- KẾT THÚC PHẦN SỬA LỖI ---

        if (!text || !lang) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Thiếu tham số text hoặc lang.' }) };
        }

        const endpoint = `https://${SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
        const voiceName = voice || (lang === 'vi-VN' ? 'vi-VN-HoaiMyNeural' : 'en-US-JennyNeural');
        const ssml = `
            <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${lang}'>
                <voice name='${voiceName}'>
                    ${text}
                </voice>
            </speak>
        `;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': SPEECH_KEY,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
            },
            body: ssml,
        });

        const contentType = response.headers.get('content-type');
        if (!response.ok || !contentType || !contentType.startsWith('audio/mpeg')) {
            const errorBody = await response.text();
            throw new Error(`Lỗi từ Azure: ${errorBody}`);
        }

        const audioBuffer = await response.buffer();
        const base64Audio = audioBuffer.toString('base64');
        
        return {
            statusCode: 200,
            body: JSON.stringify({ audioContent: base64Audio }),
        };

    } catch (error) {
        console.error('LỖI TRIỆT ĐỂ TRONG FUNCTION:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Function bị lỗi nghiêm trọng.', 
                details: error.message 
            }),
        };
    }
};
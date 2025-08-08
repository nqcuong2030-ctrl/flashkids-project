const fetch = require('node-fetch');

exports.handler = async (event) => {
    const SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
    const SPEECH_REGION = process.env.AZURE_SPEECH_REGION;
    const { text, lang, voice } = event.queryStringParameters;

    if (!SPEECH_KEY || !SPEECH_REGION) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Chưa cấu hình API Key hoặc Region trên Netlify.' }) };
    }
    if (!text || !lang) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Thiếu tham số text hoặc lang.' }) };
    }

    const endpoint = `https://${SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

    // Nếu không có giọng đọc được chỉ định, dùng giọng mặc định
    let voiceName = voice || (lang === 'vi-VN' ? 'vi-VN-HoaiMyNeural' : 'en-US-JennyNeural');

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
                'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
            },
            body: ssml,
        });

        // >>> PHẦN SỬA LỖI BẮT ĐẦU <<<
        // 1. Kiểm tra mã trạng thái trả về
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Azure API Error (Status Code):', errorBody);
            return { statusCode: response.status, body: JSON.stringify({ error: `Azure Error: ${errorBody}` }) };
        }

        // 2. Kiểm tra loại nội dung trả về. Nó phải là audio/mpeg.
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('audio/mpeg')) {
            const errorBody = await response.text();
            console.error('Azure API Error (Invalid Content-Type):', errorBody);
            return { statusCode: 500, body: JSON.stringify({ error: `Expected audio/mpeg but received ${contentType}. Response: ${errorBody}` }) };
        }
        // >>> PHẦN SỬA LỖI KẾT THÚC <<<

        const audioBuffer = await response.buffer();
        const base64Audio = audioBuffer.toString('base64');

        return {
            statusCode: 200,
            body: JSON.stringify({ audioContent: base64Audio }),
        };

    } catch (error) {
        console.error('Netlify Function Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Lỗi trong Netlify Function.' }) };
    }
};
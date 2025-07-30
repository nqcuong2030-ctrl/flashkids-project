// functions/text-to-speech.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
    // Lấy API key từ biến môi trường đã lưu trên Netlify
    const API_KEY = process.env.GOOOGLE_TTS_APl_KEY;

    // Lấy text và lang từ query params
    const { text, lang } = event.queryStringParameters;

    if (!text || !lang) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Thiếu text hoặc lang.' }) };
    }

    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;

    let voiceName = '';
    if (lang === 'en-US') {
        voiceName = 'en-US-Wavenet-D';
    } else if (lang === 'vi-VN') {
        voiceName = 'vi-VN-Wavenet-A';
    }

    const payload = {
        input: { text },
        voice: { languageCode: lang, name: voiceName },
        audioConfig: { audioEncoding: 'MP3' },
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        const data = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Lỗi khi gọi Google API.' }) };
    }
};
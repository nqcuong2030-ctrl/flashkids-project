const fetch = require('node-fetch');

exports.handler = async (event) => {
    const SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
    const SPEECH_REGION = process.env.AZURE_SPEECH_REGION;
    const { text, lang, voice } = JSON.parse(event.body);

    if (!SPEECH_KEY || !SPEECH_REGION) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Chưa cấu hình API Key hoặc Region trên Netlify.' }) };
    }
    if (!text || !lang) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Thiếu tham số text hoặc lang.' }) };
    }

    const endpoint = `https://${SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const voiceName = voice || (lang === 'vi-VN' ? 'vi-VN-HoaiMyNeural' : 'en-US-JennyNeural');

    // Hàm gửi request 1 đoạn text
    async function synthesizeChunk(chunkText) {
        const ssml = `
            <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${lang}'>
                <voice name='${voiceName}'>
                    ${chunkText}
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
            console.error('Azure TTS error:', {
                status: response.status,
                headers: Object.fromEntries(response.headers),
                body: errorBody
            });
            throw new Error(`Azure TTS failed: ${response.status} - ${errorBody}`);
        }

        const audioBuffer = await response.buffer();
        return audioBuffer.toString('base64');
    }

    try {
        // Cắt văn bản nếu quá dài
        const chunks = [];
        const maxLen = 9000; // dưới ngưỡng 10.000 ký tự của Azure
        let remainingText = text;

        while (remainingText.length > 0) {
            chunks.push(remainingText.slice(0, maxLen));
            remainingText = remainingText.slice(maxLen);
        }

        // Gọi Azure cho từng chunk và ghép kết quả
        const audioParts = [];
        for (const chunk of chunks) {
            const audioBase64 = await synthesizeChunk(chunk);
            audioParts.push(audioBase64);
        }

        // Ghép Base64 lại (client sẽ xử lý nối file mp3)
        return {
            statusCode: 200,
            body: JSON.stringify({ audioParts })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

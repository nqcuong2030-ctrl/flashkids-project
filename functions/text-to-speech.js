// text-to-speech.js

const fetch = require('node-fetch');

// <<< BẮT ĐẦU THAY ĐỔI >>>

// Hàm mới để chia nhỏ văn bản thông minh
function splitTextIntoChunks(text, maxLength = 2800) {
    const chunks = [];
    let remainingText = text;

    // Ưu tiên ngắt ở dấu chấm, chấm than, chấm hỏi
    const sentenceEnders = /(?<=[.?!])\s+/;
    const sentences = remainingText.split(sentenceEnders);

    let currentChunk = "";
    for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > maxLength) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence;
        } else {
            currentChunk += (currentChunk ? " " : "") + sentence;
        }
    }
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }
    
    // Nếu vẫn còn chunk quá dài, cắt cứng
    const finalChunks = [];
    for (const chunk of chunks) {
        if (chunk.length > maxLength) {
            for (let i = 0; i < chunk.length; i += maxLength) {
                finalChunks.push(chunk.substring(i, i + maxLength));
            }
        } else {
            finalChunks.push(chunk);
        }
    }

    return finalChunks;
}

// Hàm để gọi Azure cho một chunk duy nhất
async function getSpeechForChunk(text, lang, voice, key, region) {
    const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const voiceName = voice || (lang === 'vi-VN' ? 'vi-VN-HoaiMyNeural' : 'en-US-JennyNeural');
    const ssml = `
        <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${lang}'>
            <voice name='${voiceName}'>
                ${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
            </voice>
        </speak>
    `;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': key,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        },
        body: ssml,
    });

    const contentType = response.headers.get('content-type');
    if (!response.ok || !contentType || !contentType.startsWith('audio/mpeg')) {
        const errorBody = await response.text();
        // Ném lỗi với thông tin rõ ràng hơn
        throw new Error(`Lỗi từ Azure (Status: ${response.status}): ${errorBody}`);
    }

    const audioBuffer = await response.buffer();
    return audioBuffer.toString('base64');
}


// <<< KẾT THÚC THAY ĐỔI >>>


exports.handler = async (event) => {
    try {
        const SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
        const SPEECH_REGION = process.env.AZURE_SPEECH_REGION;

        if (!SPEECH_KEY || !SPEECH_REGION) {
            throw new Error('Chưa cấu hình API Key hoặc Region trên Netlify.');
        }

        let bodyData;
        if (typeof event.body === 'string') {
            bodyData = JSON.parse(event.body);
        } else {
            bodyData = event.body || {};
        }
        const { text, lang, voice } = bodyData;

        if (!text || !lang) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Thiếu tham số text hoặc lang.' }) };
        }

        // <<< BẮT ĐẦU THAY ĐỔI >>>
        const TEXT_LENGTH_LIMIT = 2800; // Giới hạn an toàn cho một yêu cầu

        // Nếu văn bản dài, thực hiện chia nhỏ
        if (text.length > TEXT_LENGTH_LIMIT) {
            console.log("Văn bản dài, đang thực hiện chia nhỏ...");
            const chunks = splitTextIntoChunks(text, TEXT_LENGTH_LIMIT);
            console.log(`Đã chia thành ${chunks.length} phần.`);

            // Gọi API cho từng phần và chờ tất cả hoàn thành
            const audioPromises = chunks.map(chunk => getSpeechForChunk(chunk, lang, voice, SPEECH_KEY, SPEECH_REGION));
            const audioParts = await Promise.all(audioPromises);

            return {
                statusCode: 200,
                // Trả về một mảng các file âm thanh base64
                body: JSON.stringify({ audioParts: audioParts }),
            };
        } else {
            // Nếu văn bản ngắn, giữ nguyên logic cũ
            const audioContent = await getSpeechForChunk(text, lang, voice, SPEECH_KEY, SPEECH_REGION);
            return {
                statusCode: 200,
                body: JSON.stringify({ audioContent: audioContent }),
            };
        }
        // <<< KẾT THÚC THAY ĐỔI >>>

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
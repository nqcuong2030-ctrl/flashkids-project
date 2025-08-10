// functions/text-to-speech.js

const fetch = require('node-fetch');

// Hàm chia nhỏ văn bản (không thay đổi)
function splitTextIntoChunks(text, maxLength = 2800) {
    const chunks = [];
    let remainingText = text;
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
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
}

// <<< THAY ĐỔI QUAN TRỌNG: Hàm này giờ sẽ trả về Buffer thay vì Base64 >>>
async function getSpeechBufferForChunk(text, lang, voice, key, region) {
    const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const voiceName = voice || (lang === 'vi-VN' ? 'vi-VN-HoaiMyNeural' : 'en-US-JennyNeural');
    const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${lang}'><voice name='${voiceName}'>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</voice></speak>`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': key,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        },
        body: ssml,
    });

    if (!response.ok || !response.headers.get('content-type')?.startsWith('audio/mpeg')) {
        const errorBody = await response.text();
        throw new Error(`Lỗi từ Azure (Status: ${response.status}): ${errorBody}`);
    }

    // Trả về thẳng đối tượng Buffer
    return await response.buffer();
}


exports.handler = async (event) => {
    try {
        const SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
        const SPEECH_REGION = process.env.AZURE_SPEECH_REGION;

        if (!SPEECH_KEY || !SPEECH_REGION) {
            throw new Error('Chưa cấu hình API Key hoặc Region trên Netlify.');
        }

        const bodyData = JSON.parse(event.body || '{}');
        const { text, lang, voice } = bodyData;

        if (!text || !lang) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Thiếu tham số text hoặc lang.' }) };
        }

        const TEXT_LENGTH_LIMIT = 2800; // Giới hạn an toàn
        let finalAudioBuffer;

        if (text.length > TEXT_LENGTH_LIMIT) {
            // <<< LOGIC MỚI: CHIA NHỎ, LẤY BUFFER VÀ GHÉP LẠI >>>
            console.log(`Văn bản siêu dài (${text.length} ký tự). Đang chia nhỏ và ghép file...`);
            const chunks = splitTextIntoChunks(text, TEXT_LENGTH_LIMIT);
            
            // Lấy về một mảng các Buffer âm thanh
            const audioBuffers = await Promise.all(
                chunks.map(chunk => getSpeechBufferForChunk(chunk, lang, voice, SPEECH_KEY, SPEECH_REGION))
            );
            
            // Ghép các Buffer lại thành một Buffer duy nhất
            finalAudioBuffer = Buffer.concat(audioBuffers);
            console.log("Đã ghép các file âm thanh thành công.");

        } else {
            // Logic cũ cho văn bản ngắn/trung bình
            finalAudioBuffer = await getSpeechBufferForChunk(text, lang, voice, SPEECH_KEY, SPEECH_REGION);
        }

        // Chuyển đổi Buffer tổng thể cuối cùng sang Base64
        const finalBase64Audio = finalAudioBuffer.toString('base64');
        
        // Luôn trả về một đối tượng audioContent duy nhất
        return {
            statusCode: 200,
            body: JSON.stringify({ audioContent: finalBase64Audio }),
        };

    } catch (error) {
        console.error('LỖI TRIỆT ĐỂ TRONG FUNCTION:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Function bị lỗi nghiêm trọng.', details: error.message }),
        };
    }
};
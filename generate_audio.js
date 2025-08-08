const fs = require('fs');
const path = require('path');
const sdk = require("microsoft-cognitiveservices-speech-sdk");
require('dotenv').config(); // Tải các biến môi trường từ file .env

// --- CẤU HÌNH ---
const SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const SPEECH_REGION = process.env.AZURE_SPEECH_REGION;
const VOCAB_FILE = './data/flashcards-all.json'; // SỬA TÊN FILE NÀY NẾU CẦN
const OUTPUT_DIR = 'audio'; // Tên thư mục đầu ra

/**
 * Hàm gọi Azure để tạo 1 file MP3.
 * @param {string} text - Văn bản cần đọc.
 * @param {string} voiceName - Tên giọng đọc (ví dụ: "en-US-JennyNeural").
 * @param {string} outputPath - Đường dẫn để lưu file MP3.
 */
async function textToSpeech(text, voiceName, outputPath) {
    return new Promise((resolve, reject) => {
        // Tự động bỏ qua nếu file đã tồn tại. Giúp bạn có thể chạy lại script mà không cần tải lại từ đầu.
        if (fs.existsSync(outputPath)) {
            console.log(`- Bỏ qua (đã tồn tại): ${path.basename(outputPath)}`);
            resolve();
            return;
        }

        const speechConfig = sdk.SpeechConfig.fromSubscription(SPEECH_KEY, SPEECH_REGION);
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
		speechConfig.speechSynthesisVoiceName = voiceName;
        const audioConfig = sdk.AudioConfig.fromAudioFileOutput(outputPath);
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

        synthesizer.speakTextAsync(
            text,
            result => {
                synthesizer.close();
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                    console.log(`+ Tải thành công: ${path.basename(outputPath)}`);
                    resolve();
                } else {
                    console.error(`Lỗi khi tạo file cho "${text}": ${result.errorDetails}`);
                    reject(new Error(result.errorDetails));
                }
            },
            error => {
                synthesizer.close();
                console.error(`Lỗi nghiêm trọng cho "${text}": ${error}`);
                reject(error);
            }
        );
    });
}

// Hàm chính để chạy toàn bộ quá trình
async function main() {
    if (!SPEECH_KEY || !SPEECH_REGION) {
        return console.error("Lỗi: Vui lòng cung cấp khóa và vùng Azure trong file .env");
    }

    // Đọc file dữ liệu từ vựng
    const vocabData = JSON.parse(fs.readFileSync(VOCAB_FILE, 'utf-8'));
    const flashcards = vocabData.flashcards;

    // Tạo các thư mục đầu ra nếu chưa có
    fs.mkdirSync(path.join(OUTPUT_DIR, 'en-US'), { recursive: true });
    fs.mkdirSync(path.join(OUTPUT_DIR, 'vi-VN'), { recursive: true });

    console.log(`Bắt đầu tải ${flashcards.length * 2} file âm thanh...`);

    // Lặp qua từng thẻ từ vựng để tạo file
    for (const card of flashcards) {
        try {
            // Tạo file tiếng Anh
            // Đảm bảo tên file là chữ thường và xử lý các ký tự không hợp lệ nếu có
            const englishFilename = card.english.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_');
            const englishPath = path.join(OUTPUT_DIR, 'en-US', `${englishFilename}.mp3`);
            await textToSpeech(card.english, "en-US-JennyNeural", englishPath);
            
            // Tạm dừng 200ms để tránh gửi quá nhiều yêu cầu cùng lúc lên Azure
            await new Promise(resolve => setTimeout(resolve, 200)); 

            // Tạo file tiếng Việt
            const vietnameseFilename = card.vietnamese.toLowerCase().replace(/[^a-z0-9\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, '').replace(/\s+/g, '_');
            const vietnamesePath = path.join(OUTPUT_DIR, 'vi-VN', `${vietnameseFilename}.mp3`);
            await textToSpeech(card.vietnamese, "vi-VN-HoaiMyNeural", vietnamesePath);
            
            await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
            console.error(`=> Không thể xử lý từ "${card.english}". Bỏ qua.`);
        }
    }
    console.log("🎉 Hoàn tất! Tất cả các file âm thanh đã được tải về.");
}

main();
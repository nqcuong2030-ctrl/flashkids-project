// File: public/js/audio.js
// Nhiệm vụ: Quản lý tất cả logic liên quan đến âm thanh.

import { fetchAudio } from './api.js';

let currentAudio = null; // Biến cục bộ để theo dõi âm thanh đang phát
let soundEnabled = true; // Trạng thái âm thanh, mặc định là bật

// Đối tượng chứa các hiệu ứng âm thanh đã được tải trước
const soundEffects = {
    click: new Audio('/sound/click.mp3'),
    success: new Audio('/sound/success.mp3'),
    success_2: new Audio('/sound/success_2.mp3'),
    fail: new Audio('/sound/fail.mp3'),
    error: new Audio('/sound/error.mp3'),
    tada: new Audio('/sound/tada.mp3')
};

/**
 * Hàm tạm thời để dọn dẹp cache, sẽ được thay thế bởi hàm trong dom.js
 */
function pruneAudioCache(itemsToRemove = 50) {
    console.warn(`LocalStorage is full! Pruning ${itemsToRemove} oldest audio files...`);
    // Logic chi tiết sẽ được viết trong dom.js
}

/**
 * Bật hoặc tắt tất cả âm thanh trong ứng dụng.
 * @param {boolean} enabled Trạng thái bật/tắt.
 */
export function setSoundEnabled(enabled) {
    soundEnabled = enabled;
}

/**
 * Phát một hiệu ứng âm thanh ngắn.
 * @param {string} soundName Tên của hiệu ứng (ví dụ: 'click', 'success').
 */
export function playSound(soundName) {
    if (soundEnabled && soundEffects[soundName]) {
        soundEffects[soundName].currentTime = 0;
        const playPromise = soundEffects[soundName].play();
        if (playPromise !== undefined) {
            playPromise.catch(error => console.error(`Lỗi phát âm thanh "${soundName}":`, error));
        }
    }
}

/**
 * Hàm dự phòng, sử dụng giọng đọc của trình duyệt.
 * @param {string} word Từ cần đọc.
 * @param {string} lang Ngôn ngữ.
 */
function speakWordDefault(word, lang) {
    if ('speechSynthesis' in window && soundEnabled) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterterance(word);
        utterance.lang = lang;
        window.speechSynthesis.speak(utterance);
    }
}

/**
 * Chuyển đổi chuỗi tiếng Việt có dấu thành không dấu, dạng slug.
 * @param {string} text Chuỗi tiếng Việt.
 * @returns {string} Chuỗi đã được slugify.
 */
function slugifyVietnamese(text) {
    text = text.toLowerCase();
    text = text.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a");
    text = text.replace(/[èéẹẻẽêềếệểễ]/g, "e");
    text = text.replace(/[ìíịỉĩ]/g, "i");
    text = text.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o");
    text = text.replace(/[ùúụủũưừứựửữ]/g, "u");
    text = text.replace(/[ỳýỵỷỹ]/g, "y");
    text = text.replace(/đ/g, "d");
    text = text.replace(/[^a-z0-9\s]/g, '');
    text = text.replace(/\s+/g, '_');
    return text;
}

/**
 * Phát âm một từ, theo luồng: file cục bộ -> cache -> API -> giọng đọc trình duyệt.
 * @param {string} word Từ cần đọc.
 * @param {string} lang Ngôn ngữ ('en-US' hoặc 'vi-VN').
 */
export async function speakWord(word, lang) {
    if (!soundEnabled) return;

    // Dừng bất kỳ âm thanh nào đang phát
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    // 1. Cố gắng tìm và phát file âm thanh có sẵn trong thư mục /audio
    const filename = (lang === 'en-US')
        ? word.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_')
        : slugifyVietnamese(word);
    
    const localAudioUrl = `/audio/${lang}/${filename}.mp3`;

    try {
        const response = await fetch(localAudioUrl);
        if (!response.ok) throw new Error('File cục bộ không tồn tại.');
        currentAudio = new Audio(localAudioUrl);
        await currentAudio.play();
        return; // Kết thúc nếu phát thành công
    } catch (error) {
        // Nếu không tìm thấy file cục bộ, tiếp tục luồng xử lý bên dưới
    }

    // 2. Nếu không có file cục bộ, kiểm tra cache trong localStorage
    const cacheKey = `audio_${lang}_${word.toLowerCase()}`;
    const cachedItem = localStorage.getItem(cacheKey);
    let audioSrc = null;

    if (cachedItem) {
        try {
            audioSrc = `data:audio/mp3;base64,${JSON.parse(cachedItem).audioContent}`;
        } catch (e) {
            localStorage.removeItem(cacheKey); // Xóa cache nếu dữ liệu bị lỗi
        }
    }
    
    // 3. Nếu không có trong cache, gọi API
    if (!audioSrc) {
        const data = await fetchAudio(word, lang);
        if (data && data.audioContent) {
            audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
            try {
                const itemToCache = { audioContent: data.audioContent, timestamp: Date.now() };
                localStorage.setItem(cacheKey, JSON.stringify(itemToCache));
            } catch (e) {
                pruneAudioCache(); // Dọn dẹp nếu localStorage đầy
                try { 
                    const itemToCache = { audioContent: data.audioContent, timestamp: Date.now() };
                    localStorage.setItem(cacheKey, JSON.stringify(itemToCache)); 
                }
                catch (e2) { console.error("Vẫn lỗi sau khi dọn dẹp.", e2); }
            }
        }
    }

    // 4. Phát âm thanh từ cache/API hoặc dùng giọng đọc trình duyệt làm phương án cuối
    if (audioSrc) {
        currentAudio = new Audio(audioSrc);
        await currentAudio.play();
    } else {
        speakWordDefault(word, lang);
    }
}
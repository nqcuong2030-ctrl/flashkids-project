// File: public/js/api.js
// Nhiệm vụ: Xử lý tất cả các yêu cầu mạng (API calls) đến server.

import { APP_VERSION } from './config.js';

// Các hàm show/hide loading sẽ được import từ dom.js sau,
// nhưng chúng ta khai báo sẵn ở đây để tiện cho việc gọi hàm.
function showLoading() {
    const loader = document.getElementById('loading-indicator');
    if (loader) loader.classList.remove('hidden');
}

function hideLoading() {
    const loader = document.getElementById('loading-indicator');
    if (loader) loader.classList.add('hidden');
}

// Hàm dọn dẹp cache (sẽ được định nghĩa đầy đủ trong dom.js)
function pruneAudioCache(itemsToRemove = 50) {
    // Logic dọn dẹp cache sẽ được thêm vào sau.
    console.warn(`LocalStorage is full! Pruning ${itemsToRemove} oldest audio files...`);
}

/**
 * Kiểm tra phiên bản ứng dụng và xóa cache nếu cần.
 */
function checkAppVersion() {
    const storedVersion = localStorage.getItem('flashkids_app_version');
    if (storedVersion !== APP_VERSION) {
        console.log(`Updating version: ${storedVersion} -> ${APP_VERSION}. Clearing cache...`);
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key.startsWith('flashkids_level_') || key.startsWith('audio_')) {
                localStorage.removeItem(key);
            }
        }
        localStorage.setItem('flashkids_app_version', APP_VERSION);
    }
}

/**
 * Chạy kiểm tra phiên bản định kỳ (mỗi 24 giờ).
 */
export function runPeriodicVersionCheck() {
    const lastCheck = parseInt(localStorage.getItem('last_version_check') || '0');
    const oneDay = 24 * 60 * 60 * 1000;
    if (Date.now() - lastCheck > oneDay) {
        checkAppVersion();
        localStorage.setItem('last_version_check', Date.now().toString());
    }
}

/**
 * Tải dữ liệu từ vựng cho một level, ưu tiên cache.
 * @param {string} level - Level cần tải (ví dụ: 'a1').
 * @param {object} flashcardCache - Đối tượng cache trong bộ nhớ.
 * @returns {Promise<object>} Dữ liệu từ vựng.
 */
export async function fetchLevelData(level, flashcardCache) {
    // 1. Kiểm tra cache trong bộ nhớ
    if (flashcardCache[level]) {
        return flashcardCache[level];
    }
    // 2. Kiểm tra cache trong localStorage
    const savedData = localStorage.getItem(`flashkids_level_${level}`);
    if (savedData) {
        const parsed = JSON.parse(savedData);
        flashcardCache[level] = parsed; // Cập nhật cache bộ nhớ
        return parsed;
    }
    
    // 3. Tải từ server
    showLoading();
    try {
        const response = await fetch(`/.netlify/functions/get-words?level=${level}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        try {
            localStorage.setItem(`flashkids_level_${level}`, JSON.stringify(data));
        } catch (e) {
            console.error("Lỗi lưu cache level:", e);
            pruneAudioCache(50); // Dọn dẹp cache audio
            try {
                // Thử lưu lại sau khi dọn dẹp
                localStorage.setItem(`flashkids_level_${level}`, JSON.stringify(data));
            } catch (e2) {
                console.error("Vẫn lỗi sau khi dọn dẹp:", e2);
            }
        }
        
        flashcardCache[level] = data; // Cập nhật cache bộ nhớ
        return data;
    } finally {
        hideLoading();
    }
}

/**
 * Gọi API để lấy file âm thanh (base64).
 * @param {string} word - Từ cần phát âm.
 * @param {string} lang - Ngôn ngữ ('en-US' hoặc 'vi-VN').
 * @returns {Promise<object|null>} Dữ liệu audio hoặc null nếu lỗi.
 */
export async function fetchAudio(word, lang) {
    try {
        const response = await fetch(`/.netlify/functions/text-to-speech`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: word, lang: lang })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.details || err.error || 'Lỗi không xác định từ server TTS');
        }
        return await response.json();
    } catch (error) {
        console.error('Lỗi khi gọi Netlify Function TTS:', error);
        return null;
    }
}
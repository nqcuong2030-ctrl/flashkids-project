// public/js/api.js
import { showLoading, hideLoading, pruneAudioCache } from './dom.js';

// --- QUẢN LÝ VERSION & CACHE ---
const APP_VERSION = '1.2_1';

function checkAppVersion() {
    const storedVersion = localStorage.getItem('flashkids_app_version');
    if (storedVersion !== APP_VERSION) {
        console.log(`Cập nhật phiên bản: ${storedVersion} -> ${APP_VERSION}. Xóa cache...`);
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key.startsWith('flashkids_level_') || key.startsWith('audio_')) {
                localStorage.removeItem(key);
            }
        }
        localStorage.setItem('flashkids_app_version', APP_VERSION);
    }
}

export function runPeriodicVersionCheck() {
    const lastCheck = parseInt(localStorage.getItem('last_version_check') || '0');
    const oneDay = 24 * 60 * 60 * 1000;
    if (Date.now() - lastCheck > oneDay) {
        checkAppVersion();
        localStorage.setItem('last_version_check', Date.now().toString());
    }
}

// --- API CALLS ---
export async function fetchLevelData(level, flashcardCache) {
    if (flashcardCache[level]) {
        return flashcardCache[level];
    }
    const savedData = localStorage.getItem(`flashkids_level_${level}`);
    if (savedData) {
        const parsed = JSON.parse(savedData);
        flashcardCache[level] = parsed;
        return parsed;
    }
    showLoading();
    try {
        const response = await fetch(`/.netlify/functions/get-words?level=${level}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        try {
            localStorage.setItem(`flashkids_level_${level}`, JSON.stringify(data));
        } catch (e) {
            console.error("Lỗi lưu cache level:", e);
            pruneAudioCache(50);
            try {
                localStorage.setItem(`flashkids_level_${level}`, JSON.stringify(data));
            } catch (e2) {
                console.error("Vẫn lỗi sau khi dọn dẹp:", e2);
            }
        }
        flashcardCache[level] = data;
        return data;
    } finally {
        hideLoading();
    }
}

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
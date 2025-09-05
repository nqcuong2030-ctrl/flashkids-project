// public/js/audio.js
import { fetchAudio } from './api.js';
import { pruneAudioCache } from './dom.js';

let currentAudio = null;
let soundEnabled = true;

const soundEffects = {
    click: new Audio('/sound/click.mp3'),
    success: new Audio('/sound/success.mp3'),
    success_2: new Audio('/sound/success_2.mp3'),
    fail: new Audio('/sound/fail.mp3'),
    error: new Audio('/sound/error.mp3'),
    tada: new Audio('/sound/tada.mp3')
};

export function setSoundEnabled(enabled) {
    soundEnabled = enabled;
}

export function playSound(soundName) {
    if (soundEnabled && soundEffects[soundName]) {
        soundEffects[soundName].currentTime = 0;
        const playPromise = soundEffects[soundName].play();
        if (playPromise !== undefined) {
            playPromise.catch(error => console.error(`Lỗi phát âm thanh "${soundName}":`, error));
        }
    }
}

function speakWordDefault(word, lang) {
    if ('speechSynthesis' in window && soundEnabled) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = lang;
        window.speechSynthesis.speak(utterance);
    }
}

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

export async function speakWord(word, lang) {
    if (!soundEnabled) return;
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    const filename = lang === 'en-US'
        ? word.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_')
        : slugifyVietnamese(word.toLowerCase());
    
    const localAudioUrl = `/audio/${lang}/${filename}.mp3`;

    try {
        const response = await fetch(localAudioUrl);
        if (!response.ok) throw new Error('File cục bộ không tồn tại.');
        currentAudio = new Audio(localAudioUrl);
        await currentAudio.play();
    } catch (error) {
        console.warn(`Không tìm thấy file cục bộ "${word}". Dùng cache/API.`);
        const cacheKey = `audio_${lang}_${word.toLowerCase()}`;
        const cachedItem = localStorage.getItem(cacheKey);
        let audioSrc = null;

        if (cachedItem) {
            try {
                audioSrc = `data:audio/mp3;base64,${JSON.parse(cachedItem).audioContent}`;
            } catch (e) { localStorage.removeItem(cacheKey); }
        }
        
        if (!audioSrc) {
            const data = await fetchAudio(word, lang);
            if (data && data.audioContent) {
                audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
                try {
                    localStorage.setItem(cacheKey, JSON.stringify({ audioContent: data.audioContent, timestamp: Date.now() }));
                } catch (e) {
                    pruneAudioCache();
                    try { localStorage.setItem(cacheKey, JSON.stringify({ audioContent: data.audioContent, timestamp: Date.now() })); }
                    catch (e2) { console.error("Vẫn lỗi sau khi dọn dẹp.", e2); }
                }
            }
        }

        if (audioSrc) {
            currentAudio = new Audio(audioSrc);
            await currentAudio.play();
        } else {
            speakWordDefault(word, lang);
        }
    }
}
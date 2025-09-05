// ===================================================================================
// ===== Siêu Đối Tác Lập Trình: action.js (Refactored Version)
// ===================================================================================

// I. CẤU HÌNH & TRẠNG THÁI TẬP TRUNG
// ===================================================================================

/**
 * @description Chứa các hằng số và cấu hình không thay đổi trong suốt quá trình chạy.
 */
const config = {
    APP_VERSION: '1.1_09082025_5',
    MASTERY_THRESHOLD: 4,
    INACTIVITY_DELAY: 10000, // 10 giây
    LOCAL_STORAGE_KEYS: {
        APP_VERSION: 'flashkids_app_version',
        PROGRESS: 'flashkids_progress',
        LAST_VERSION_CHECK: 'last_version_check',
        CURRENT_LEVEL: 'flashkids_currentLevel',
        LEVEL_DATA_PREFIX: 'flashkids_level_',
        AUDIO_CACHE_PREFIX: 'audio_'
    },
    // Dữ liệu tĩnh
    categoryColors: [
        'from-blue-400 to-blue-600', 'from-purple-400 to-purple-600', 'from-pink-400 to-pink-600',
        'from-green-400 to-green-600', 'from-yellow-400 to-yellow-600', 'from-red-400 to-red-600',
        'from-indigo-400 to-indigo-600', 'from-teal-400 to-teal-600', 'from-orange-400 to-orange-600',
        'from-cyan-400 to-cyan-600', 'from-lime-400 to-lime-600', 'from-amber-400 to-amber-600',
        'from-emerald-400 to-emerald-600', 'from-fuchsia-400 to-fuchsia-600', 'from-rose-400 to-rose-600',
        'from-sky-400 to-sky-600', 'from-violet-400 to-violet-600'
    ],
    games: [
        { id: 1, name: 'Ghép từ', description: 'Ghép từ tiếng Anh với nghĩa tiếng Việt tương ứng', difficulty: 'Dễ', color: 'blue', icon: 'puzzle' },
        { id: 2, name: 'Chọn từ', description: 'Chọn từ vựng tương ứng với hình ảnh minh họa', difficulty: 'Trung bình', color: 'purple', icon: 'image' },
        { id: 4, name: 'Ghép Âm thanh & Từ', description: 'Lắng nghe và ghép cặp âm thanh với từ vựng đúng', difficulty: 'Trung bình', color: 'emerald', icon: 'volume-up' },
        { id: 3, name: 'Điền từ', description: 'Chọn chữ cái đúng để hoàn thành từ', difficulty: 'Khó', color: 'red', icon: 'question' }
    ],
    quizTypes: [
        { id: 1, name: 'Trắc nghiệm (+1 điểm)', description: 'Chọn đáp án đúng cho từng câu hỏi.', time: 10, difficulty: 3, icon: 'document' },
        { id: 3, name: 'Đọc hiểu (+2 điểm)', description: 'Đọc câu và chọn từ đúng để điền vào chỗ trống.', time: 5, difficulty: 4, icon: 'book-open' },
        { id: 2, name: 'Xếp chữ (+3 điểm)', description: 'Sắp xếp các chữ cái thành từ đúng.', time: 5, difficulty: 5, icon: 'question' }
    ],
    badges: [
        { id: 1, name: 'Siêu sao', description: 'Học 7 ngày liên tục', achieved: true, icon: 'star', color: 'yellow' },
        { id: 2, name: 'Nhà từ vựng', description: 'Học 100 từ mới', achieved: true, icon: 'badge', color: 'green' },
        { id: 3, name: 'Học sinh giỏi', description: 'Hoàn thành 5 bài kiểm tra', achieved: true, icon: 'book', color: 'blue' },
        { id: 4, name: 'Chuyên gia', description: 'Hoàn thành 10 bài kiểm tra', achieved: false, progress: '5/10', icon: 'play', color: 'gray' }
    ]
};

/**
 * @description Chứa toàn bộ trạng thái động của ứng dụng. Mọi thay đổi về dữ liệu và UI đều nên bắt nguồn từ đây.
 */
const state = {
    // Dữ liệu chính
    categories: [],
    flashcards: [],
    flashcardCache: {},

    // Trạng thái điều hướng & UI
    isCardInteractable: true,
    currentCategoryId: null,
    currentCardIndex: 0,
    soundEnabled: true,
    isFlashcardsTabActive: false,
    currentLevel: 'a1',
    lastFlipState: false,
    currentActivity: null,
    currentAudio: null,
    ttsToolAudio: null,
    lastGeneratedAudioKey: null,
    lastSpokenAudio: { lang: null, text: null },

    // Trạng thái các game
    games: {
        matching: {
            selectedEnglishWord: null,
            selectedVietnameseWord: null,
            matchedPairs: [],
        },
        imageQuiz: {
            questions: [],
            currentQuestionIndex: 0,
            score: 0,
        },
        unscramble: {
            targetWord: '',
            targetWordId: null,
            wordPool: [],
            lastWordId: null,
        },
        soundMatch: {
            selectedCards: [],
            isChecking: false,
            wordPool: [],
        },
        fillBlank: {
            targetWord: '',
            wordPool: [],
            currentWord: null,
            missingLetters: [],
            lastWordId: null,
        }
    },

    // Đồng hồ
    timer: {
        interval: null,
        timeRemaining: 600, // 10 phút
        isRunning: false,
        inactivityTimeout: null
    },

    // Biểu đồ
    charts: {
        activity: null,
        mastery: null,
    }
};

/**
 * @description Lưu trữ các tham chiếu đến các phần tử DOM thường xuyên sử dụng để tối ưu hiệu năng.
 */
const dom = {};

/**
 * @description Cache các phần tử DOM vào đối tượng `dom` để tránh truy vấn lặp lại.
 */
function cacheDOMElements() {
    // Main App
    dom.loadingIndicator = document.getElementById('loading-indicator');
    dom.tabs = document.querySelectorAll('.tab-content');
    dom.navButtons = document.querySelectorAll('nav button');

    // Home Tab
    dom.welcomeMessage = document.getElementById('welcome-message');
    dom.dailyTimerDisplay = document.getElementById('daily-timer-display');
    dom.timerStatusText = document.getElementById('timer-status-text');
    dom.categoriesContainer = document.getElementById('categories-container');
    dom.levelBadges = document.querySelectorAll('.level-badge');
    
    // Flashcards Tab
    dom.categoryFilters = document.getElementById('category-filters');
    dom.currentFlashcard = document.getElementById('current-flashcard');
    dom.englishWord = document.getElementById('english-word');
    dom.vietnameseWord = document.getElementById('vietnamese-word');
    dom.phoneticText = document.getElementById('phonetic-text');
    dom.cardImage = document.getElementById('card-image');
    dom.flashcardBack = document.querySelector('.flashcard-back');
    dom.cardCounter = document.getElementById('card-counter');
    dom.prevCardBtn = document.getElementById('prev-card');
    dom.nextCardBtn = document.getElementById('next-card');
    dom.markLearnedBtn = document.getElementById('mark-learned-btn');

    // Games & Quizzes
    dom.gamesContainer = document.getElementById('games-container');
    dom.quizTypesContainer = document.getElementById('quiz-types');
    dom.categorySelectionContainer = document.getElementById('category-selection-container');
    
    // Rewards Tab
    dom.xpLevel = document.getElementById('xp-level');
    dom.xpText = document.getElementById('xp-text');
    dom.xpBar = document.getElementById('xp-bar');
    dom.badgesContainer = document.getElementById('badges-container');
    
    // Stats Tab
    dom.wordsLearned = document.getElementById('words-learned');
    dom.streakDays = document.getElementById('streak-days');
    dom.masteryChartCanvas = document.getElementById('mastery-chart');
    dom.activityHeatmap = document.getElementById('activity-heatmap');
    dom.categoryProgressContainer = document.getElementById('category-progress-container');

    // Settings Tab
    dom.soundToggle = document.getElementById('sound-toggle');
    dom.usernameInput = document.getElementById('username');
    dom.ageInput = document.getElementById('age');
    dom.ttsInput = document.getElementById('text-to-speech-input');
    dom.ttsLangToggleBtn = document.getElementById('tts-lang-toggle-btn');
    dom.ttsSpeakBtn = document.getElementById('speak-text-btn');
    dom.ttsSpeakIcon = document.getElementById('tts-speak-icon');
    dom.ttsStopIcon = document.getElementById('tts-stop-icon');
    dom.ttsDownloadBtn = document.getElementById('download-speech-btn');
    dom.ttsSpeedSlider = document.getElementById('tts-speed-slider');
    dom.ttsSpeedValue = document.getElementById('tts-speed-value');
    
    // Modals
    dom.modals = document.querySelectorAll('.modal');
}


// II. CÁC MODULE QUẢN LÝ LOGIC
// ===================================================================================

const soundManager = {
    effects: {
        click: new Audio('/sound/click.mp3'),
        success: new Audio('/sound/success.mp3'),
        success_2: new Audio('/sound/success_2.mp3'),
        fail: new Audio('/sound/fail.mp3'),
        error: new Audio('/sound/error.mp3'),
        tada: new Audio('/sound/tada.mp3')
    },

    play: function(soundName) {
        if (state.soundEnabled && this.effects[soundName]) {
            this.effects[soundName].currentTime = 0;
            const playPromise = this.effects[soundName].play();
            if (playPromise !== undefined) {
                playPromise.catch(error => console.error(`Không thể phát âm thanh "${soundName}":`, error));
            }
        }
    },

    speakDefault: function(word, lang) {
        if ('speechSynthesis' in window && state.soundEnabled) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = lang;
            utterance.onerror = (e) => console.error("SpeechSynthesis Error:", e);
            window.speechSynthesis.speak(utterance);
        }
    },

    speak: async function(word, lang) {
        if (state.currentAudio) {
            state.currentAudio.pause();
            state.currentAudio.src = '';
        }
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        let filename = '';
        const lowerCaseWord = word.toLowerCase();
        if (lang === 'en-US') {
            filename = lowerCaseWord.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_');
        } else {
            filename = util.slugifyVietnamese(lowerCaseWord);
        }
        const localAudioUrl = `/audio/${lang}/${filename}.mp3`;

        try {
            const response = await fetch(localAudioUrl);
            if (!response.ok) throw new Error(`File cục bộ không tồn tại: ${response.statusText}`);
            
            state.currentAudio = new Audio(localAudioUrl);
            await state.currentAudio.play();
        } catch (error) {
            console.warn(`Không phát được file cục bộ cho "${word}". Chuyển sang Cache/API.`);
            const voiceName = lang === 'vi-VN' ? 'vi-VN-HoaiMyNeural' : 'en-US-JennyNeural';
            const cacheKey = `${config.LOCAL_STORAGE_KEYS.AUDIO_CACHE_PREFIX}${lang}_${word.toLowerCase()}`;
            const cachedItem = localStorage.getItem(cacheKey);
            let audioSrc = null;

            if (cachedItem) {
                try {
                    console.log(`Đang phát "${word}" từ localStorage.`);
                    audioSrc = `data:audio/mp3;base64,${JSON.parse(cachedItem).audioContent}`;
                } catch (e) {
                    localStorage.removeItem(cacheKey);
                }
            }

            if (!audioSrc) {
                try {
                    const funcResponse = await fetch(`/.netlify/functions/text-to-speech`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: word, lang: lang, voice: voiceName })
                    });
                    const data = await funcResponse.json();
                    if (data.audioContent) {
                        audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
                        const itemToCache = { audioContent: data.audioContent, timestamp: Date.now() };
                        try {
                            localStorage.setItem(cacheKey, JSON.stringify(itemToCache));
                        } catch (e) {
                            dataManager.pruneAudioCache();
                            try {
                                localStorage.setItem(cacheKey, JSON.stringify(itemToCache));
                            } catch (e2) {
                                console.error("Vẫn không thể lưu cache audio sau khi dọn dẹp.", e2);
                            }
                        }
                    }
                } catch (fetchError) {
                    console.error('Lỗi khi gọi Netlify Function:', fetchError);
                }
            }

            if (audioSrc) {
                state.currentAudio = new Audio(audioSrc);
                await state.currentAudio.play();
            } else {
                this.speakDefault(word, lang);
            }
        }
    }
};

const dataManager = {
    loadLevel: async function(level) {
        if (state.flashcardCache[level]) {
            console.log(`Loading ${level} from memory cache.`);
            return state.flashcardCache[level];
        }

        const savedData = localStorage.getItem(`${config.LOCAL_STORAGE_KEYS.LEVEL_DATA_PREFIX}${level}`);
        if (savedData) {
            console.log(`Loading ${level} from localStorage.`);
            const parsedData = JSON.parse(savedData);
            state.flashcardCache[level] = parsedData;
            return parsedData;
        }

        console.log(`Fetching ${level} from server...`);
        uiManager.showLoading();
        try {
            const response = await fetch(`/.netlify/functions/get-words?level=${level}`);
            if (!response.ok) throw new Error(`Không thể tải dữ liệu cho level ${level}`);
            const data = await response.json();
            const storageKey = `${config.LOCAL_STORAGE_KEYS.LEVEL_DATA_PREFIX}${level}`;

            try {
                localStorage.setItem(storageKey, JSON.stringify(data));
            } catch (e) {
                console.error("Lỗi khi lưu cache level:", e);
                this.pruneAudioCache(50);
                try {
                    localStorage.setItem(storageKey, JSON.stringify(data));
                } catch (e2) {
                    console.error("Vẫn không thể lưu cache level sau khi dọn dẹp.", e2);
                }
            }
            state.flashcardCache[level] = data;
            return data;
        } finally {
            uiManager.hideLoading();
        }
    },

    pruneAudioCache: function(itemsToRemove = 50) {
        console.warn(`LocalStorage đầy! Đang tiến hành xóa ${itemsToRemove} file âm thanh cũ nhất...`);
        const audioKeys = Object.keys(localStorage).filter(key => key.startsWith(config.LOCAL_STORAGE_KEYS.AUDIO_CACHE_PREFIX));

        if (audioKeys.length < itemsToRemove) {
            console.error("Không đủ file âm thanh trong cache để xóa.");
            return;
        }

        const timedKeys = audioKeys.map(key => {
            try {
                const item = JSON.parse(localStorage.getItem(key));
                return { key: key, timestamp: item.timestamp || 0 };
            } catch (e) {
                return { key: key, timestamp: 0 };
            }
        });

        timedKeys.sort((a, b) => a.timestamp - b.timestamp);
        const keysToRemove = timedKeys.slice(0, itemsToRemove);
        keysToRemove.forEach(item => {
            console.log(`Đang xóa cache cũ: ${item.key}`);
            localStorage.removeItem(item.key);
        });
    }
};

const progressManager = {
    initUserProgress: function() {
        const defaultProgress = {
            categories: {}, masteryScores: {}, completedGames: {}, completedQuizzes: {},
            dailyActivities: 0, lastActivityDate: new Date().toDateString(), streakDays: 0,
            dailyActivitiesHistory: {},
            userProfile: {
                username: 'Bạn nhỏ', age: '', avatar: 'https://upload.wikimedia.org/wikipedia/commons/1/14/H%C6%B0%C6%A1u_cao_c%E1%BB%95.png',
                level: 1, xp: 0, xpToNextLevel: 100,
            }
        };
        const savedProgressString = localStorage.getItem(config.LOCAL_STORAGE_KEYS.PROGRESS);
        if (savedProgressString) {
            try {
                const savedProgress = JSON.parse(savedProgressString);
                const combinedUserProfile = { ...defaultProgress.userProfile, ...savedProgress.userProfile };
                const combinedProgress = { ...defaultProgress, ...savedProgress };
                combinedProgress.userProfile = combinedUserProfile;
                return combinedProgress;
            } catch (e) {
                console.error("Lỗi đọc progress:", e);
                return defaultProgress;
            }
        }
        return defaultProgress;
    }, // SỬA LỖI: Thêm dấu phẩy

    saveUserProgress: function(progress) {
        localStorage.setItem(config.LOCAL_STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
    }, // SỬA LỖI: Thêm dấu phẩy

    getUserProgress: function() {
        // SỬA LỖI: Phải dùng 'this' để gọi hàm trong cùng đối tượng
        return this.initUserProgress();
    }, // SỬA LỖI: Thêm dấu phẩy

    // LOGIC MỚI: Hàm này không còn tồn tại, logic được tích hợp vào updateMasteryScore
    // Tôi để lại đây dưới dạng bình luận để bạn tham khảo.
    /*
    markWordAsLearned: function(wordId) {
        // Logic cũ này dùng completedWords, không còn phù hợp.
        // Thay vào đó, chúng ta sẽ dùng updateMasteryScore.
    },
    */

    markCurrentWordAsLearned: function() {
        // SỬA LỖI: Gọi hàm và truy cập biến đúng phạm vi
        const filteredCards = util.getFilteredCards();
        if (filteredCards.length === 0) return;
        
        const card = filteredCards[state.currentCardIndex];
        // LOGIC MỚI: Gọi updateMasteryScore để đánh dấu từ đã học (đạt ngưỡng tối đa)
        this.updateMasteryScore(card.id, config.MASTERY_THRESHOLD);
        
        // TỐI ƯU: Sử dụng biến dom đã cache
        const button = dom.markLearnedBtn;
        const originalText = button.innerHTML;
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            Đã thuộc!`;
        button.disabled = true;
        button.classList.add('bg-gray-400', 'cursor-not-allowed');
        button.classList.remove('btn-success');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
            button.classList.remove('bg-gray-400', 'cursor-not-allowed');
            button.classList.add('btn-success');
            // Cập nhật lại trạng thái nút sau khi hiệu ứng kết thúc
            uiManager.updateMarkLearnedButton(card.id);
        }, 2000);
        
        setTimeout(() => {
            // SỬA LỖI: Gọi hàm nextCard từ module app
            app.nextCard();
        }, 1000);
    }, // SỬA LỖI: Thêm dấu phẩy

    updateGameProgress: function(gameId, categoryId, score) {
        const progress = this.getUserProgress();
        progress.completedGames[`${gameId}_${categoryId}`] = {
            score: score,
            timestamp: Date.now()
        };
        this.updateDailyActivity(progress);
        this.saveUserProgress(progress);
        uiManager.updateUserStats();
        // uiManager.updateDailyProgress(); // Hàm này không tồn tại, có thể bạn muốn cập nhật thứ khác
    }, // SỬA LỖI: Thêm dấu phẩy

    updateQuizProgress: function(quizId, categoryId, score) {
        const progress = this.getUserProgress();
        progress.completedQuizzes[`${quizId}_${categoryId}`] = {
            score: score,
            timestamp: Date.now()
        };
        this.updateDailyActivity(progress);
        this.saveUserProgress(progress);
        uiManager.updateUserStats();
        // uiManager.updateDailyProgress();
    }, // SỬA LỖI: Thêm dấu phẩy

    getCategoryProgress: function(categoryId) {
        const progress = this.getUserProgress();
        // SỬA LỖI: Truy cập state và config
        const wordsInCat = state.flashcards.filter(card => card.categoryId === categoryId);
        if (wordsInCat.length === 0) return 0;

        let masteredCount = 0;
        wordsInCat.forEach(word => {
            const score = progress.masteryScores[word.id] || 0;
            if (score >= config.MASTERY_THRESHOLD) {
                masteredCount++;
            }
        });
        
        return Math.round((masteredCount / wordsInCat.length) * 100);
    }, // SỬA LỖI: Thêm dấu phẩy

    updateCategoryProgress: function(progress) {
        if (!progress) return;
        // SỬA LỖI: Truy cập state và config
        state.categories.forEach(category => {
            const wordsInCat = state.flashcards.filter(card => card.categoryId === category.id);
            if (wordsInCat.length === 0) {
                progress.categories[`${state.currentLevel}_${category.id}`] = 0;
                return;
            }
            let masteredCount = 0;
            wordsInCat.forEach(word => {
                const score = progress.masteryScores[word.id] || 0;
                if (score >= config.MASTERY_THRESHOLD) {
                    masteredCount++;
                }
            });
            const percentComplete = Math.round((masteredCount / wordsInCat.length) * 100);
            progress.categories[`${state.currentLevel}_${category.id}`] = percentComplete;
        });
    }, // SỬA LỖI: Thêm dấu phẩy
    
    updateDailyActivity: function(progress) {
        const today = new Date().toDateString();
        if (!progress.dailyActivitiesHistory) {
            progress.dailyActivitiesHistory = {};
        }
        const currentActivities = progress.dailyActivitiesHistory[today] || 0;
        progress.dailyActivitiesHistory[today] = currentActivities + 1;

        if (progress.lastActivityDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (progress.lastActivityDate === yesterday.toDateString()) {
                progress.streakDays = (progress.streakDays || 0) + 1;
                this.addXp(progress, 50); // SỬA LỖI: Gọi hàm addXp qua this
            } else {
                progress.streakDays = 1;
            }
            progress.lastActivityDate = today;
        }
    }, // SỬA LỖI: Thêm dấu phẩy

    updateMasteryScore: function(wordId, pointsToAdd) {
        const progress = this.getUserProgress();
        const oldScore = progress.masteryScores[wordId] || 0;

        if (oldScore < config.MASTERY_THRESHOLD) {
            const newScore = Math.min(config.MASTERY_THRESHOLD, oldScore + pointsToAdd);
            progress.masteryScores[wordId] = newScore;
            
            if (newScore >= config.MASTERY_THRESHOLD && oldScore < config.MASTERY_THRESHOLD) {
                this.updateDailyActivity(progress);
                console.log(`Từ ${wordId} đã đạt mức thông thạo!`);
                this.addXp(progress, 20); // SỬA LỖI: Gọi hàm addXp qua this
            }
        }
        
        this.updateCategoryProgress(progress);
        this.saveUserProgress(progress);
        uiManager.updateUserStats();

        const activeButton = document.querySelector('nav button.tab-active');
        if (activeButton && activeButton.dataset.tab === 'stats') {
            uiManager.renderMasteryChart();
        }
    }, // SỬA LỖI: Thêm dấu phẩy
    
    addXp: function(progress, amount) {
        const profile = progress.userProfile;
        if (!profile) return;
        profile.xp += amount;
        if (profile.xp >= profile.xpToNextLevel) {
            this.levelUp(profile);
        }
        // Lưu lại tiến trình sau khi thay đổi
        this.saveUserProgress(progress);
        uiManager.updateXpDisplay(progress);
    }, // SỬA LỖI: Thêm dấu phẩy

    levelUp: function(profile) {
        soundManager.play('tada');
        uiManager.createConfetti();
        
        profile.level += 1;
        profile.xp -= profile.xpToNextLevel;
        profile.xpToNextLevel = profile.level * 100; 
        
        uiManager.showCompletionMessage(
            100, // score
            null, // activityId
            null, // categoryId
            false, // isQuiz
            `🎉 Lên Cấp! 🎉`, 
            `Chúc mừng bạn đã đạt đến Cấp độ ${profile.level}! Hãy tiếp tục phát huy nhé!`
        );
    }, // SỬA LỖI: Thêm dấu phẩy

    saveUserSettings: function() {
		const progress = this.getUserProgress();
        progress.userProfile.settings = {
			soundEnabled: dom.soundToggle.checked,
		};
        this.saveUserProgress(progress);
        soundManager.play('click');
	}
};

const uiManager = {
    showLoading: function() {
        dom.loadingIndicator.classList.remove('hidden');
    },

    hideLoading: function() {
        dom.loadingIndicator.classList.add('hidden');
    },

    openModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('show');
    },

    closeModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('show');
        this.loadCategories(); // Cập nhật lại giao diện trang chủ sau khi đóng modal
    },

    updateCardCounter: function() {
        const filteredCards = util.getFilteredCards();
        dom.cardCounter.textContent = filteredCards.length > 0
            ? `${state.currentCardIndex + 1} / ${filteredCards.length}`
            : '0 / 0';
    },

    updateLevelBadges: function(activeLevel) {
        dom.levelBadges.forEach(badge => {
            // Tạm thời lấy level từ onclick cũ, cần chuyển sang data-attribute để tối ưu
            const onclickAttr = badge.getAttribute('onclick');
            if (onclickAttr) {
                const levelMatch = onclickAttr.match(/'([^']+)'/);
                if (levelMatch && levelMatch[1]) {
                    const level = levelMatch[1];
                    badge.classList.toggle('active', level === activeLevel);
                }
            }
        });
    },

    loadCategories: function() {
        const container = dom.categoriesContainer;
        container.innerHTML = '';

        if (state.categories.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center col-span-3">Không có chủ đề nào cho cấp độ này.</p>';
            return;
        }

        state.categories.forEach(category => {
            const colorClass = util.getCategoryColorClass(category.color);
            const progress = progressManager.getCategoryProgress(category.id);
            const iconSVG = util.getIcon('category', category.name); // Giả sử getIcon thay thế getCategoryIcon

            const categoryElement = document.createElement('div');
            categoryElement.className = `category-card bg-gradient-to-br ${colorClass} rounded-2xl p-5 text-white shadow-lg lift-on-hover`;
            categoryElement.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <h4 class="text-lg font-bold">${category.name}</h4>
                    <span class="bg-white text-gray-700 text-xs font-bold px-2 py-1 rounded-full">${category.wordCount} từ</span>
                </div>
                <div class="flex justify-between items-end">
                    <div>
                        <div class="text-sm mb-1">Tiến độ: ${progress}%</div>
                        <div class="w-32 bg-white bg-opacity-30 rounded-full h-2">
                            <div class="bg-white h-2 rounded-full" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-white opacity-80" viewBox="0 0 20 20" fill="currentColor">
                        ${iconSVG}
                    </svg>
                </div>`;
            
            categoryElement.addEventListener('click', () => {
                app.runPeriodicVersionCheck();
                soundManager.play('click');
                state.currentCategoryId = category.id;
                state.currentCardIndex = 0;
                app.changeTab('flashcards');
            });
            container.appendChild(categoryElement);
        });
    },

    loadCategoryFilters: function() {
        const container = dom.categoryFilters;
        container.innerHTML = '';
        
        const allButton = document.createElement('button');
        allButton.className = 'bg-blue-500 text-white py-2 px-4 rounded-full shadow-md flex-shrink-0';
        allButton.textContent = 'Tất cả';
        allButton.addEventListener('click', () => this.filterByCategory(null));
        container.appendChild(allButton);

        state.categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'bg-white text-gray-700 py-2 px-4 rounded-full shadow-md flex-shrink-0';
            button.textContent = category.name;
            button.addEventListener('click', () => this.filterByCategory(category.id));
            container.appendChild(button);
        });
        this.updateCategoryFilters();
    },

    updateCategoryFilters: function() {
        const buttons = dom.categoryFilters.querySelectorAll('button');
        buttons.forEach((button, index) => {
            let isActive = false;
            if (index === 0 && state.currentCategoryId === null) {
                isActive = true;
            } else if (index > 0) {
                const category = state.categories[index - 1];
                if (category && category.id === state.currentCategoryId) {
                    isActive = true;
                }
            }
            button.classList.toggle('bg-blue-500', isActive);
            button.classList.toggle('text-white', isActive);
            button.classList.toggle('bg-white', !isActive);
            button.classList.toggle('text-gray-700', !isActive);
        });
    },

    filterByCategory: function(categoryId) {
        soundManager.play('click');
        state.currentCategoryId = categoryId;
        state.currentCardIndex = 0;
        this.updateFlashcard();
        this.updateCategoryFilters();
    },

    updateFlashcard: function() {
        const filteredCards = util.getFilteredCards();
        if (filteredCards.length === 0) {
            dom.englishWord.textContent = 'Không có từ';
            dom.vietnameseWord.textContent = 'Vui lòng chọn chủ đề';
            dom.phoneticText.textContent = '';
            dom.cardImage.innerHTML = '';
            this.updateCardCounter();
            return;
        }

        const card = filteredCards[state.currentCardIndex];
        dom.englishWord.textContent = card.english;
        dom.phoneticText.textContent = card.phonetic || '';
        dom.vietnameseWord.textContent = card.vietnamese;

        const isUrl = card.image && (card.image.startsWith('http') || card.image.startsWith('/'));
        dom.vietnameseWord.classList.toggle('hidden', isUrl);
        dom.flashcardBack.classList.toggle('no-padding', isUrl);
        dom.flashcardBack.classList.toggle('justify-center', !isUrl);
        dom.cardImage.classList.toggle('h-full', isUrl);
        dom.cardImage.classList.toggle('mb-4', !isUrl);

        if (isUrl) {
            dom.cardImage.innerHTML = `<img src="${card.image}" alt="${card.english}" class="w-full h-full object-contain">`;
        } else {
            dom.cardImage.innerHTML = ''; // Không hiển thị icon nếu không phải URL
        }

        dom.currentFlashcard.classList.remove('flipped');
        state.lastFlipState = false;
        this.updateMarkLearnedButton(card.id);
        this.updateCardCounter();

        if (state.isFlashcardsTabActive && state.soundEnabled) {
            setTimeout(() => {
                soundManager.speak(card.english, 'en-US');
            }, 100);
        }
    },

    updateMarkLearnedButton: function(wordId) {
        const progress = progressManager.getUserProgress();
        const score = progress.masteryScores[wordId] || 0;
        const isMastered = score >= config.MASTERY_THRESHOLD;
        
        dom.markLearnedBtn.disabled = isMastered;
        dom.markLearnedBtn.classList.toggle('bg-gray-400', isMastered);
        dom.markLearnedBtn.classList.toggle('cursor-not-allowed', isMastered);
        dom.markLearnedBtn.classList.toggle('btn-success', !isMastered);
    },

    updateUserStats: function() {
        const progress = progressManager.getUserProgress();
        const totalLearned = Object.values(progress.masteryScores).filter(score => score >= config.MASTERY_THRESHOLD).length;
        dom.wordsLearned.textContent = totalLearned;
        dom.streakDays.textContent = progress.streakDays || 0;
    },

    updateXpDisplay: function(progress) {
        const profile = progress.userProfile;
        if (profile) {
            const percent = Math.min(100, Math.round((profile.xp / profile.xpToNextLevel) * 100));
            dom.xpLevel.textContent = profile.level;
            dom.xpText.textContent = `${profile.xp}/${profile.xpToNextLevel}`;
            dom.xpBar.style.width = `${percent}%`;
        }
    },

    renderMasteryChart: function() {
        const progress = progressManager.getUserProgress();
        const ctx = dom.masteryChartCanvas?.getContext('2d');
        if (!ctx) return;

        const currentLevelData = state.flashcardCache[state.currentLevel];
        if (!currentLevelData || !currentLevelData.flashcards) return;

        const wordIdsInCurrentLevel = new Set(currentLevelData.flashcards.map(word => word.id));
        let masteredCount = 0, learningCount = 0;

        for (const wordId in progress.masteryScores) {
            if (wordIdsInCurrentLevel.has(parseInt(wordId))) {
                const score = progress.masteryScores[wordId];
                if (score >= config.MASTERY_THRESHOLD) masteredCount++;
                else if (score > 0) learningCount++;
            }
        }
        
        const totalWordsInLevel = currentLevelData.flashcards.length;
        const unlearnedCount = totalWordsInLevel - masteredCount - learningCount;

        if (state.charts.mastery) state.charts.mastery.destroy();
        
        state.charts.mastery = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Thông thạo', 'Đang học', 'Chưa học'],
                datasets: [{
                    data: [masteredCount, learningCount, unlearnedCount],
                    backgroundColor: ['#10B981', '#F59E0B', '#E5E7EB'],
                    hoverOffset: 4
                }]
            }
        });
    },

    renderActivityHeatmap: function() {
        const container = dom.activityHeatmap;
        if (!container) return;
        container.innerHTML = '';
        
        const history = progressManager.getUserProgress().dailyActivitiesHistory || {};
        const daysToShow = 91;

        for (let i = daysToShow - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toDateString();
            const activities = history[dateString] || 0;
            
            let level = 0;
            if (activities > 0 && activities <= 2) level = 1;
            else if (activities > 2 && activities <= 5) level = 2;
            else if (activities > 5 && activities <= 10) level = 3;
            else if (activities > 10) level = 4;

            const dayElement = document.createElement('div');
            dayElement.className = `heatmap-day heatmap-level-${level}`;
            const tooltipText = activities > 0 
                ? `${activities} hoạt động - ${date.toLocaleDateString('vi-VN')}`
                : `Không hoạt động - ${date.toLocaleDateString('vi-VN')}`;
            dayElement.innerHTML = `<span class="tooltip">${tooltipText}</span>`;
            container.appendChild(dayElement);
        }
    },

    updateCategoryProgressDisplay: function() {
        const container = dom.categoryProgressContainer;
        if (!container) return;
        container.innerHTML = '';

        if (state.categories.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center">Không có dữ liệu.</p>';
            return;
        }

        state.categories.forEach(category => {
            const progress = progressManager.getCategoryProgress(category.id);
            const baseColor = category.color || 'blue';
            const categoryElement = document.createElement('div');
            categoryElement.className = 'mb-4';
            categoryElement.innerHTML = `
                <div class="flex justify-between items-center mb-1">
                    <span class="font-semibold text-gray-700">${category.name}</span>
                    <span class="text-sm text-${baseColor}-600 font-bold">${progress}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-${baseColor}-500 h-2 rounded-full" style="width: ${progress}%"></div>
                </div>`;
            container.appendChild(categoryElement);
        });
    },

    showCompletionMessage: function(score, activityId, categoryId, isQuiz = false, overrideTitle = null, overrideMessage = null) {
        let title, message;

        if (overrideTitle && overrideMessage) {
            title = overrideTitle;
            message = overrideMessage;
        } else {
            const category = state.categories.find(c => c.id === categoryId);
            const activity = isQuiz 
                ? config.quizTypes.find(q => q.id === activityId) 
                : config.games.find(g => g.id === activityId);
            
            if (score >= 90) title = "Xuất sắc!";
            else if (score >= 70) title = "Tốt!";
            else title = "Hoàn thành!";
            
            message = `Bạn đã hoàn thành ${isQuiz ? 'bài kiểm tra' : 'trò chơi'} "${activity.name}" với chủ đề "${category.name}" và đạt ${score}% điểm.`;
        }
        
        document.getElementById('completion-title').textContent = title;
        document.getElementById('completion-message').textContent = message;
        
        this.openModal('completionModal');
        this.loadCategories();
        this.updateCategoryProgressDisplay();
    },

    createConfetti: function() {
        const confettiCount = 100;
        const colors = ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f'];
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = `${Math.random() * 10 + 5}px`;
            confetti.style.height = `${Math.random() * 10 + 5}px`;
            confetti.style.animationDuration = `${Math.random() * 2 + 2}s`;
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4000);
        }
    },
    
    updateWelcomeMessage: function(progress) {
        const username = progress.userProfile.username;
        if (dom.welcomeMessage) {
            dom.welcomeMessage.textContent = `Xin chào, ${username || 'Bạn nhỏ'}!`;
        }
    },

    loadGames: function() {
        const container = dom.gamesContainer;
        container.innerHTML = '';
        config.games.forEach(game => {
            const colorClass = util.getGameColorClass(game.color);
            const iconSVG = util.getIcon('game', game.icon);
            const gameElement = document.createElement('div');
            gameElement.className = `game-card bg-gradient-to-br ${colorClass} rounded-2xl p-5 text-white shadow-lg cursor-pointer lift-on-hover`;
            gameElement.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <h4 class="text-lg font-bold">${game.name}</h4>
                    <span class="bg-white text-${game.color}-600 text-xs font-bold px-2 py-1 rounded-full">${game.difficulty}</span>
                </div>
                <p class="text-sm text-white text-opacity-90 mb-4">${game.description}</p>
                <div class="flex justify-between items-end">
                    <div class="bg-white text-${game.color}-600 font-bold py-2 px-4 rounded-lg shadow-md">Chơi ngay</div>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-white opacity-80" viewBox="0 0 20 20" fill="currentColor">
                        ${iconSVG}
                    </svg>
                </div>`;
            gameElement.addEventListener('click', () => gameManager.startGame(game.id));
            container.appendChild(gameElement);
        });
    },

    loadQuizTypes: function() {
        const container = dom.quizTypesContainer;
        container.innerHTML = '';
        config.quizTypes.forEach(quiz => {
            const iconSVG = util.getIcon('quiz', quiz.icon);
            const quizElement = document.createElement('div');
            quizElement.className = 'bg-white rounded-2xl p-6 shadow-md';
            quizElement.innerHTML = `
                <div class="flex items-center mb-4">
                    <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                            ${iconSVG}
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-gray-800">${quiz.name}</h3>
                </div>
                <p class="text-gray-600 mb-6">${quiz.description}</p>
                <div class="flex justify-between items-center">
                    <div>
                        <span class="text-sm text-gray-500">Thời gian: ${quiz.time} phút</span>
                        ${util.getRatingStars(quiz.difficulty)}
                    </div>
                    <button class="btn-primary text-white py-2 px-6 rounded-full shadow-md">Bắt đầu</button>
                </div>`;
            quizElement.querySelector('button').addEventListener('click', () => gameManager.startQuiz(quiz.id));
            container.appendChild(quizElement);
        });
    },

    loadBadges: function() {
        const container = dom.badgesContainer;
        if (!container) return;
        container.innerHTML = '';
        const progress = progressManager.getUserProgress();

        // Cập nhật trạng thái huy hiệu (logic này có thể cần điều chỉnh)
        const badgeStates = config.badges.map(badge => ({...badge})); // Clone để không thay đổi config gốc
        const totalLearned = Object.values(progress.masteryScores).filter(score => score >= config.MASTERY_THRESHOLD).length;
        const completedQuizzes = Object.keys(progress.completedQuizzes).length;
        
        badgeStates[0].achieved = progress.streakDays >= 7;
        badgeStates[1].achieved = totalLearned >= 100;
        badgeStates[1].progress = `${totalLearned}/100`;
        badgeStates[2].achieved = completedQuizzes >= 5;
        badgeStates[2].progress = `${completedQuizzes}/5`;
        badgeStates[3].achieved = completedQuizzes >= 10;
        badgeStates[3].progress = `${completedQuizzes}/10`;
        
        badgeStates.forEach(badge => {
            const iconSVG = util.getIcon('badge', badge.icon);
            const badgeElement = document.createElement('div');
            badgeElement.className = 'bg-white rounded-2xl p-5 shadow-md text-center';
            badgeElement.innerHTML = `
                <div class="w-20 h-20 mx-auto rounded-full bg-${badge.color}-100 flex items-center justify-center mb-4 ${badge.achieved ? 'badge' : ''}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-${badge.color}-500" viewBox="0 0 20 20" fill="currentColor">
                        ${iconSVG}
                    </svg>
                </div>
                <h4 class="text-lg font-bold text-gray-800 mb-1">${badge.name}</h4>
                <p class="text-gray-600 text-sm mb-2">${badge.description}</p>
                ${badge.achieved 
                    ? `<span class="bg-green-100 text-green-600 text-xs font-bold px-2 py-1 rounded-full">Đã đạt</span>`
                    : `<span class="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">${badge.progress || ''}</span>`
                }`;
            container.appendChild(badgeElement);
        });
    }
};

const gameManager = {
    // --- BỘ ĐIỀU PHỐI CHÍNH (MAIN DISPATCHERS) ---
    startGame: function(gameId) {
        soundManager.play('click');
        state.currentActivity = { type: 'game', id: gameId };
        this.showCategorySelectionModal();
    },

    startQuiz: function(quizId) {
        soundManager.play('click');
        state.currentActivity = { type: 'quiz', id: quizId };
        this.showCategorySelectionModal();
    },

    playGame: function(gameId, categoryId) {
        const categoryWords = state.flashcards.filter(card => card.categoryId === categoryId);
        
        switch (gameId) {
            case 1: // Ghép từ
                if (categoryWords.length < 5) {
                    alert('Cần ít nhất 5 từ vựng để chơi trò chơi này.'); return;
                }
                this.startMatchingGame(categoryWords);
                break;
            case 2: // Chọn từ
                if (categoryWords.length < 4) {
                    alert('Cần ít nhất 4 từ vựng để chơi.'); return;
                }
                this.startImageQuiz(categoryWords);
                break;
            case 3: // Điền từ
                const suitableWords = categoryWords.filter(w => w.english.length >= 3 && w.english.length <= 15);
                if (suitableWords.length < 1) {
                    alert('Không có từ phù hợp trong chủ đề này.'); return;
                }
                this.startFillBlankGame(suitableWords);
                break;
            case 4: // Ghép Âm thanh & Từ
                if (categoryWords.length < 3) {
                    alert('Cần ít nhất 3 từ vựng để chơi.'); return;
                }
                this.startSoundMatchGame(categoryWords, 9);
                break;
            default:
                alert('Trò chơi này đang được phát triển.');
        }
    },

    startQuizWithCategory: function(quizId, categoryId) {
        // timerManager.start();
        const categoryWords = state.flashcards.filter(card => card.categoryId === categoryId);

        switch (quizId) {
            case 1: // Trắc nghiệm
                if (categoryWords.length < 4) {
                    alert('Cần ít nhất 4 từ vựng để làm bài kiểm tra này.'); return;
                }
                this.startMultipleChoiceQuiz(categoryWords);
                break;
            case 2: // Xếp chữ
                const suitableWords = categoryWords.filter(w => w.english.length > 3 && w.english.length < 8);
                if (suitableWords.length < 1) {
                    alert('Không có từ vựng phù hợp trong chủ đề này.'); return;
                }
                this.startUnscrambleGame(suitableWords);
                break;
            case 3: // Đọc hiểu
                const suitableWordsWithSentence = categoryWords.filter(w => w.exampleSentence);
                if (suitableWordsWithSentence.length < 1) {
                    alert('Chủ đề này không có từ vựng phù hợp (có câu ví dụ) để làm bài kiểm tra đọc hiểu.'); return;
                }
                this.startReadingQuiz(suitableWordsWithSentence);
                break;
            default:
                alert('Bài kiểm tra này đang được phát triển.');
        }
    },

    showCategorySelectionModal: function() {
        const container = dom.categorySelectionContainer;
        container.innerHTML = '';
        
        state.categories.forEach(category => {
            const progress = progressManager.getCategoryProgress(category.id);
            const colorClass = util.getCategoryColorClass(category.color);
            const categoryElement = document.createElement('div');
            categoryElement.className = `bg-gradient-to-br ${colorClass} rounded-xl p-4 text-white cursor-pointer hover:shadow-lg transition duration-300 lift-on-hover`;
            categoryElement.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-bold">${category.name}</h4>
                    <span class="bg-white text-gray-700 text-xs font-bold px-2 py-1 rounded-full">${category.wordCount} từ</span>
                </div>
                <div class="mt-2">
                    <div class="text-sm mb-1">Tiến độ: ${progress}%</div>
                    <div class="w-full bg-white bg-opacity-30 rounded-full h-2">
                        <div class="bg-white h-2 rounded-full" style="width: ${progress}%"></div>
                    </div>
                </div>`;
            
            categoryElement.addEventListener('click', () => {
                soundManager.play('click');
                uiManager.closeModal('categorySelectionModal');
                state.currentActivity.categoryId = category.id;

                if (state.currentActivity.type === 'game') {
                    this.playGame(state.currentActivity.id, category.id);
                } else if (state.currentActivity.type === 'quiz') {
                    this.startQuizWithCategory(state.currentActivity.id, category.id);
                }
            });
            container.appendChild(categoryElement);
        });
        uiManager.openModal('categorySelectionModal');
    },

    // --- GAME 1: GHÉP TỪ (MATCHING GAME) ---
    startMatchingGame: function(words) {
        const s = state.games.matching;
        s.selectedEnglishWord = null;
        s.selectedVietnameseWord = null;
        s.matchedPairs = [];
        
        const gameWords = [...words].sort(() => 0.5 - Math.random()).slice(0, 5);
        const englishContainer = document.getElementById('english-words');
        const vietnameseContainer = document.getElementById('vietnamese-words');
        englishContainer.innerHTML = '';
        vietnameseContainer.innerHTML = '';

        gameWords.forEach(word => {
            const wordElement = document.createElement('div');
            wordElement.className = 'word-card bg-blue-100 p-3 rounded-lg text-blue-800 font-semibold cursor-pointer';
            wordElement.dataset.wordId = word.id;
            wordElement.textContent = word.english;
            wordElement.addEventListener('click', (e) => this.selectMatchingWord(e.target, word.id, 'en'));
            englishContainer.appendChild(wordElement);
        });

        const shuffledVietnamese = [...gameWords].sort(() => 0.5 - Math.random());
        shuffledVietnamese.forEach(word => {
            const wordElement = document.createElement('div');
            wordElement.className = 'word-card bg-gray-100 p-3 rounded-lg text-gray-800 cursor-pointer';
            wordElement.dataset.wordId = word.id;
            wordElement.textContent = word.vietnamese;
            wordElement.addEventListener('click', (e) => this.selectMatchingWord(e.target, word.id, 'vi'));
            vietnameseContainer.appendChild(wordElement);
        });
        
        document.getElementById('restart-matching-game').onclick = () => this.restartMatchingGame();
        uiManager.openModal('matchingGameModal');
    },

    selectMatchingWord: function(element, wordId, lang) {
        soundManager.speak(element.textContent, lang === 'en' ? 'en-US' : 'vi-VN');
        if (element.classList.contains('matched')) return;

        const s = state.games.matching;
        const containerId = lang === 'en' ? '#english-words' : '#vietnamese-words';
        
        const currentlySelected = document.querySelector(`${containerId} .word-card.selected`);
        if (currentlySelected) currentlySelected.classList.remove('selected');
        
        element.classList.add('selected');

        if (lang === 'en') s.selectedEnglishWord = wordId;
        else s.selectedVietnameseWord = wordId;

        if (s.selectedEnglishWord && s.selectedVietnameseWord) {
            this.checkWordMatch();
        }
    },

    checkWordMatch: function() {
        const s = state.games.matching;
        const englishElement = document.querySelector(`#english-words .word-card[data-word-id="${s.selectedEnglishWord}"]`);
        const vietnameseElement = document.querySelector(`#vietnamese-words .word-card[data-word-id="${s.selectedVietnameseWord}"]`);
        if (!englishElement || !vietnameseElement) return;

        if (s.selectedEnglishWord === s.selectedVietnameseWord) {
            soundManager.play('success_2');
            englishElement.classList.remove('selected');
            vietnameseElement.classList.remove('selected');
            englishElement.classList.add('matched');
            vietnameseElement.classList.add('matched');
            s.matchedPairs.push(s.selectedEnglishWord);
        } else {
            soundManager.play('fail');
            englishElement.classList.add('error');
            vietnameseElement.classList.add('error');
            setTimeout(() => {
                englishElement.classList.remove('selected', 'error');
                vietnameseElement.classList.remove('selected', 'error');
            }, 800);
        }

        s.selectedEnglishWord = null;
        s.selectedVietnameseWord = null;

        const totalPairs = document.querySelectorAll('#english-words .word-card').length;
        if (s.matchedPairs.length === totalPairs && totalPairs > 0) {
            setTimeout(() => {
                const { id, categoryId } = state.currentActivity;
                progressManager.updateGameProgress(id, categoryId, 100);
                uiManager.closeModal('matchingGameModal');
                uiManager.showCompletionMessage(100, id, categoryId);
                uiManager.createConfetti();
            }, 1000);
        }
    },

    restartMatchingGame: function() {
        soundManager.play('click');
        const { id, categoryId } = state.currentActivity;
        if (id && categoryId) {
            uiManager.closeModal('matchingGameModal');
            setTimeout(() => this.playGame(id, categoryId), 300);
        }
    },

	// --- GAME 2: CHỌN TỪ (IMAGE QUIZ) ---
    startImageQuiz: function(words) {
        const s = state.games.imageQuiz;
        s.questions = this.generateImageQuizQuestions(words);
        s.currentQuestionIndex = 0;
        s.score = 0;

        this.displayImageQuizQuestion();
        uiManager.openModal('imageQuizModal');
    },

    generateImageQuizQuestions: function(allWords, numQuestions = 5) {
        const questions = [];
        // SỬA LỖI: dùng state.flashcards để có bộ từ vựng đầy đủ cho câu trả lời sai
        const wordsForDistractors = [...state.flashcards]; 
        let wordsForQuestions = [...allWords];

        for (let i = 0; i < Math.min(numQuestions, wordsForQuestions.length); i++) {
            const correctWordIndex = Math.floor(Math.random() * wordsForQuestions.length);
            const correctWord = wordsForQuestions.splice(correctWordIndex, 1)[0];
            
            const options = [correctWord];
            const distractors = wordsForDistractors.filter(w => w.id !== correctWord.id);

            while (options.length < 4 && distractors.length > 0) {
                const distractorIndex = Math.floor(Math.random() * distractors.length);
                options.push(distractors.splice(distractorIndex, 1)[0]);
            }
            
            questions.push({
                correctAnswer: correctWord,
                options: util.shuffleArray(options)
            });
        }
        return questions;
    },

    displayImageQuizQuestion: function() {
        const s = state.games.imageQuiz;
        if (s.currentQuestionIndex >= s.questions.length) {
            this.endImageQuiz();
            return;
        }

        const question = s.questions[s.currentQuestionIndex];
        const imageContainer = document.getElementById('image-quiz-image-container');
        
        document.getElementById('image-quiz-progress').textContent = `Câu ${s.currentQuestionIndex + 1} / ${s.questions.length}`;
        
        if (question.correctAnswer.image && question.correctAnswer.image.startsWith('http')) {
            imageContainer.innerHTML = `<img id="image-quiz-img" src="${question.correctAnswer.image}" alt="Quiz image" class="max-w-full max-h-full object-contain">`;
        } else {
            imageContainer.innerHTML = `<div class="text-4xl md:text-5xl font-bold text-center text-blue-800 p-4">${question.correctAnswer.vietnamese}</div>`;
            soundManager.speak(question.correctAnswer.vietnamese, 'vi-VN');
        }

        const optionsContainer = document.getElementById('image-quiz-options');
        optionsContainer.innerHTML = '';
        question.options.forEach(option => {
            const optionButton = document.createElement('button');
            optionButton.className = 'quiz-option p-4 border rounded-lg text-lg font-semibold text-gray-700 bg-white';
            optionButton.textContent = option.english;
            optionButton.onclick = () => this.handleImageQuizOptionClick(optionButton, option, question.correctAnswer);
            optionsContainer.appendChild(optionButton);
        });
    },

    handleImageQuizOptionClick: function(button, selectedOption, correctOption) {
        soundManager.play('click');
        document.querySelectorAll('#image-quiz-options button').forEach(btn => btn.disabled = true);
        
        const s = state.games.imageQuiz;
        if (selectedOption.id === correctOption.id) {
            button.classList.add('correct');
            s.score++;
            soundManager.play('success_2');
        } else {
            button.classList.add('incorrect');
            soundManager.play('fail');
            
            document.querySelectorAll('#image-quiz-options button').forEach(btn => {
                if (btn.textContent === correctOption.english) {
                    btn.classList.add('correct');
                }
            });
        }

        soundManager.speak(correctOption.english, 'en-US');

        setTimeout(() => {
            s.currentQuestionIndex++;
            this.displayImageQuizQuestion();
        }, 1500);
    },

    endImageQuiz: function() {
        uiManager.closeModal('imageQuizModal');
        const s = state.games.imageQuiz;
        const scorePercentage = Math.round((s.score / s.questions.length) * 100);
        const { id, categoryId } = state.currentActivity;
        
        progressManager.updateGameProgress(id, categoryId, scorePercentage);
        uiManager.showCompletionMessage(scorePercentage, id, categoryId);
        
        if (scorePercentage >= 60) {
            uiManager.createConfetti();
        }
    },

	// --- GAME 3: ĐIỀN TỪ (FILL IN THE BLANK) ---
	startFillBlankGame: function(words) {
		const s = state.games.fillBlank;
		if (words) s.wordPool = words;
		if (!s.wordPool || s.wordPool.length === 0) {
			alert("Không có từ vựng phù hợp cho trò chơi này.");
			return;
		}

		let availableWords = s.wordPool;
		if (s.lastWordId && s.wordPool.length > 1) {
			availableWords = s.wordPool.filter(word => word.id !== s.lastWordId);
		}
		const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
		s.lastWordId = randomWord.id;
		s.targetWord = randomWord.english.toUpperCase();

		soundManager.speak(randomWord.vietnamese, 'vi-VN');

		let numBlanks = 1;
		if (s.targetWord.length >= 6) numBlanks = 2;
		if (s.targetWord.length >= 9) numBlanks = 3;

		const wordChars = s.targetWord.split('');
		s.missingLetters = [];
		const indices = Array.from(Array(s.targetWord.length).keys());
		util.shuffleArray(indices);
		const blankIndices = indices.slice(0, numBlanks).sort((a, b) => a - b);

		blankIndices.forEach(index => {
			s.missingLetters.push(wordChars[index]);
			wordChars[index] = '_';
		});

		const choices = [...s.missingLetters];
		const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
		while (choices.length < 6) {
			const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
			if (!choices.includes(randomLetter)) choices.push(randomLetter);
		}
		util.shuffleArray(choices);

		const answerArea = document.getElementById('answer-area');
		const letterTilesArea = document.getElementById('letter-tiles');
		answerArea.innerHTML = '';
		letterTilesArea.innerHTML = '';

		wordChars.forEach((char) => {
			const charElement = document.createElement('div');
			if (char === '_') {
				charElement.className = 'blank-slot';
				charElement.onclick = () => {
					if (charElement.textContent) {
						const letter = charElement.textContent;
						charElement.textContent = '';
						const choiceToUnhide = Array.from(document.querySelectorAll('.letter-choice.hidden')).find(el => el.dataset.letterInstance.startsWith(letter));
						if (choiceToUnhide) choiceToUnhide.classList.remove('hidden');
					}
				};
			} else {
				charElement.className = 'word-char';
				charElement.textContent = char;
			}
			answerArea.appendChild(charElement);
		});

		choices.forEach((letter, index) => {
			const tile = document.createElement('div');
			tile.className = 'letter-choice';
			tile.textContent = letter;
			tile.dataset.letterInstance = letter + index;
			tile.onclick = () => {
				const firstEmptySlot = document.querySelector('.blank-slot:empty');
				if (firstEmptySlot) {
					firstEmptySlot.textContent = letter;
					tile.classList.add('hidden');
				}
			};
			letterTilesArea.appendChild(tile);
		});
		
		document.getElementById('check-fill-blank-btn').onclick = () => this.checkFillBlankAnswer();
		document.getElementById('change-word-fill-blank-btn').onclick = () => this.startFillBlankGame();
		document.getElementById('fill-blank-listen-btn').onclick = () => soundManager.speak(randomWord.english, 'en-US');

		uiManager.openModal('fillBlankGameModal');
	},

	checkFillBlankAnswer: function() {
		let userAnswer = Array.from(document.querySelectorAll('#answer-area > div')).map(slot => slot.textContent || '_').join('');

		if (userAnswer === state.games.fillBlank.targetWord) {
			soundManager.play('success_2');
			document.getElementById('fill-blank-success-feedback').classList.remove('hidden');
			setTimeout(() => {
				document.getElementById('fill-blank-success-feedback').classList.add('hidden');
				this.startFillBlankGame();
			}, 1500);
		} else {
			soundManager.play('fail');
			document.getElementById('answer-area').classList.add('error');
			setTimeout(() => document.getElementById('answer-area').classList.remove('error'), 500);
		}
	},

	// --- GAME 4: GHÉP ÂM THANH & TỪ (SOUND MATCH) ---
	startSoundMatchGame: function(words, numCards = 9) {
		const s = state.games.soundMatch;
		if (words) s.wordPool = words;
		
		const board = document.getElementById('sound-match-board');
		board.innerHTML = '';
		s.selectedCards = [];
		s.isChecking = true;

		const numPairs = (numCards === 12) ? 4 : 3;
		const numBlanks = numCards - (numPairs * 2);
		
		const gameWords = [...s.wordPool].sort(() => 0.5 - Math.random()).slice(0, numPairs);
		if (gameWords.length < numPairs) {
			alert(`Chủ đề này không đủ ${numPairs} từ vựng để chơi.`);
			s.isChecking = false;
			return;
		}

		let cards = [];
		gameWords.forEach(word => {
			cards.push({ type: 'audio', word: word.english, pairId: word.id });
			cards.push({ type: 'text', word: word.english, pairId: word.id });
		});
		for (let i = 0; i < numBlanks; i++) {
			cards.push({ type: 'blank', word: null, pairId: `blank_${i}` });
		}
		util.shuffleArray(cards);

		cards.forEach((cardData, index) => {
			const cardElement = document.createElement('div');
			let frontContent = '';
			let frontClasses = 'card-face card-front w-full h-full rounded-lg flex justify-center items-center p-1 text-center font-bold';

			if (cardData.type === 'audio') {
				frontClasses += ' bg-blue-100 text-blue-600';
				frontContent = `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>`;
			} else if (cardData.type === 'text') {
				frontClasses += ' bg-yellow-100 text-yellow-800';
				frontContent = cardData.word;
			} else {
				frontClasses += ' bg-gray-200';
			}

			cardElement.className = `match-card w-[90px] h-[70px] cursor-pointer`;
			cardElement.dataset.cardIndex = index;
			cardElement.innerHTML = `
				<div class="card-face card-back w-full h-full rounded-lg flex justify-center items-center text-4xl bg-blue-800 text-white">?</div>
				<div class="${frontClasses}">${frontContent}</div>`;
			cardElement.addEventListener('click', () => this.handleMatchCardClick(cardElement, cardData));
			board.appendChild(cardElement);
		});
		
		uiManager.openModal('soundMatchModal');

		setTimeout(() => board.querySelectorAll('.match-card').forEach(card => card.classList.add('flipped')), 500);
		setTimeout(() => {
			board.querySelectorAll('.match-card').forEach(card => card.classList.remove('flipped'));
			s.isChecking = false;
		}, 3500);
	},

	handleMatchCardClick: function(cardElement, cardData) {
		const s = state.games.soundMatch;
		if (s.isChecking || cardElement.classList.contains('flipped')) return;

		soundManager.play('click');
		cardElement.classList.add('flipped');
		
		if(cardData.type === 'audio') {
			soundManager.speak(cardData.word, 'en-US');
		}

		s.selectedCards.push({ element: cardElement, data: cardData });

		if (s.selectedCards.length === 2) {
			s.isChecking = true;
			setTimeout(() => this.checkSoundMatch(), 1200);
		}
	},

	checkSoundMatch: function() {
		const s = state.games.soundMatch;
		const [card1, card2] = s.selectedCards;
		
		const isPair = card1.data.pairId === card2.data.pairId;
		const isAudioText = card1.data.type !== 'blank' && card1.data.type !== card2.data.type;

		if (isPair && isAudioText) {
			soundManager.play('success');
			card1.element.classList.add('matched');
			card2.element.classList.add('matched');
			
			const totalPairs = document.querySelectorAll('#sound-match-board .match-card[data-pair-id^="w"]').length / 2;
			const matchedCount = document.querySelectorAll('.match-card.matched').length / 2;
			if (matchedCount === totalPairs) {
				soundManager.play('tada');
				setTimeout(() => {
					this.startSoundMatchGame(null, 9); // Restart game
				}, 1500);
			}
		} else {
			soundManager.play('fail');
			card1.element.classList.remove('flipped');
			card2.element.classList.remove('flipped');
		}

		s.selectedCards = [];
		s.isChecking = false;
	},

    // --- QUIZ 1: TRẮC NGHIỆM (MULTIPLE CHOICE) ---
    startMultipleChoiceQuiz: function(words) {
        const progress = progressManager.getUserProgress();
        const unlearnedWords = words.filter(word => (progress.masteryScores[word.id] || 0) < config.MASTERY_THRESHOLD);
        
        const wordsForQuiz = unlearnedWords.length > 0 ? unlearnedWords : words;
        if (wordsForQuiz.length < 4) {
            alert("Chủ đề này không đủ 4 từ vựng để tạo bài kiểm tra."); return;
        }

        const quizWords = [...wordsForQuiz].sort(() => 0.5 - Math.random()).slice(0, 10);
        const questionsContainer = document.getElementById('quiz-questions');
        questionsContainer.innerHTML = '';
        
        quizWords.forEach((word, index) => {
            const options = [word.vietnamese];
            const distractors = words.filter(w => w.id !== word.id);
            while (options.length < 4 && distractors.length > 0) {
                const dIndex = Math.floor(Math.random() * distractors.length);
                options.push(distractors.splice(dIndex, 1)[0].vietnamese);
            }
            util.shuffleArray(options);
            
            const questionElement = document.createElement('div');
            questionElement.className = 'bg-white p-4 rounded-lg shadow';
            questionElement.dataset.wordId = word.id;
            questionElement.dataset.correct = word.vietnamese;
            
            let questionHTML = `<h4 class="font-bold text-gray-800 mb-3">${index + 1}. ${word.english}</h4><div class="grid grid-cols-2 gap-3">`;
            options.forEach(option => {
                questionHTML += `<div class="quiz-option p-2 border rounded-lg cursor-pointer" data-value="${option}">${option}</div>`;
            });
            questionHTML += `</div>`;
            questionElement.innerHTML = questionHTML;

            questionElement.querySelectorAll('.quiz-option').forEach(opt => {
                opt.addEventListener('click', () => this.selectQuizOption(opt));
            });
            questionsContainer.appendChild(questionElement);
        });
        
        const submitButton = document.getElementById('submit-quiz');
        const nextButton = document.getElementById('next-quiz-btn');
        submitButton.textContent = 'Nộp bài';
        submitButton.disabled = false;
        submitButton.classList.remove('hidden');
        nextButton.classList.add('hidden');

        submitButton.onclick = () => this.checkQuizAnswers();
        nextButton.onclick = () => this.startMultipleChoiceQuiz(words);
        
        uiManager.openModal('multipleChoiceQuizModal');
    },

    selectQuizOption: function(optionElement) {
        soundManager.play('click');
        const questionElement = optionElement.closest('.bg-white');
        questionElement.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('selected'));
        optionElement.classList.add('selected');
    },

    checkQuizAnswers: function() {
        soundManager.play('click');
        const questions = document.querySelectorAll('#quiz-questions > div');
        let correctCount = 0;
        
        questions.forEach(question => {
            const correctAnswer = question.dataset.correct;
            const selectedOption = question.querySelector('.quiz-option.selected');
            if (selectedOption) {
                const selectedValue = selectedOption.dataset.value;
                if (selectedValue === correctAnswer) {
                    correctCount++;
                    selectedOption.classList.add('correct');
                    progressManager.updateMasteryScore(parseInt(question.dataset.wordId), 1);
                } else {
                    selectedOption.classList.add('incorrect');
                    const correctEl = Array.from(question.querySelectorAll('.quiz-option')).find(el => el.dataset.value === correctAnswer);
                    if (correctEl) correctEl.classList.add('correct');
                }
            }
        });

        document.querySelectorAll('.quiz-option').forEach(opt => {
            const parent = opt.parentElement.parentElement;
            opt.replaceWith(opt.cloneNode(true)); // Xóa event listener
        });

        const submitButton = document.getElementById('submit-quiz');
        const nextButton = document.getElementById('next-quiz-btn');
        submitButton.textContent = `Đúng ${correctCount}/${questions.length}`;
        submitButton.disabled = true;
        submitButton.classList.add('hidden');
        nextButton.classList.remove('hidden');

        if (correctCount === questions.length && questions.length > 0) {
            uiManager.createConfetti();
            soundManager.play('success');
        }
    },
	
	// --- Quiz 2: Xếp chữ (Unscramble) ---
	startUnscrambleGame: function(words) {
        // SỬA LỖI: Truy cập và cập nhật state đúng cách
		const s = state.games.unscramble;
		if (words) s.wordPool = words;
		if (!s.wordPool || s.wordPool.length === 0) {
			alert("Không có từ nào phù hợp!");
			return;
		}

		const progress = progressManager.getUserProgress();
		let availableWords;
		const unlearnedWords = s.wordPool.filter(word => (progress.masteryScores[word.id] || 0) < config.MASTERY_THRESHOLD);

		if (unlearnedWords.length > 0) {
			availableWords = unlearnedWords;
		} else {
			availableWords = s.wordPool;
		}

		const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];

		s.targetWord = randomWord.english.toUpperCase();
		s.targetWordId = randomWord.id;

		soundManager.speak(randomWord.vietnamese, 'vi-VN');

		const scrambledLetters = s.targetWord.split('').sort(() => Math.random() - 0.5);
		const answerArea = document.getElementById('unscramble-answer-area');
		const letterTilesArea = document.getElementById('unscramble-letter-tiles');
		answerArea.innerHTML = '';
		letterTilesArea.innerHTML = '';

		s.targetWord.split('').forEach(() => {
			const slot = document.createElement('div');
			slot.className = 'answer-slot';
			slot.addEventListener('click', (event) => {
				if (event.currentTarget.firstChild) {
					this.moveLetter(event.currentTarget.firstChild, 'unscramble-answer-area', 'unscramble-letter-tiles'); // SỬA LỖI
				}
			});
			answerArea.appendChild(slot);
		});

		scrambledLetters.forEach(letter => {
			const tile = document.createElement('div');
			tile.className = 'letter-tile';
			tile.textContent = letter;
			tile.addEventListener('click', (event) => this.moveLetter(event.currentTarget, 'unscramble-answer-area', 'unscramble-letter-tiles')); // SỬA LỖI
			letterTilesArea.appendChild(tile);
		});

		document.getElementById('check-unscramble-btn').onclick = () => this.checkUnscrambleAnswer(); // SỬA LỖI
		document.getElementById('change-word-btn').onclick = () => this.startUnscrambleGame(); // SỬA LỖI
		document.getElementById('unscramble-listen-btn').onclick = () => soundManager.speak(randomWord.english, 'en-US'); // SỬA LỖI

		uiManager.openModal('unscrambleGameModal'); // SỬA LỖI
	}, // SỬA LỖI: Thêm dấu phẩy

	moveLetter: function(tile, answerAreaId = 'unscramble-answer-area', letterTilesAreaId = 'unscramble-letter-tiles') {
		if (!tile) return;
		soundManager.play('click'); // SỬA LỖI

		const answerArea = document.getElementById(answerAreaId);
		const letterTilesArea = document.getElementById(letterTilesAreaId);

		if (tile.parentElement === letterTilesArea) {
			const emptySlot = Array.from(answerArea.children).find(slot => !slot.firstChild);
			if (emptySlot) emptySlot.appendChild(tile);
		} else {
			letterTilesArea.appendChild(tile);
		}
	}, // SỬA LỖI: Thêm dấu phẩy

	checkUnscrambleAnswer: function() {
		soundManager.play('click');
		const s = state.games.unscramble;
		const answerArea = document.getElementById('unscramble-answer-area');
		const letterTilesArea = document.getElementById('unscramble-letter-tiles');
		let userAnswer = Array.from(answerArea.children).map(slot => slot.firstChild?.textContent || '').join('');

		if (userAnswer === s.targetWord) {
			progressManager.updateMasteryScore(s.targetWordId, 3);
			soundManager.play('tada');
			soundManager.speak(s.targetWord, 'en-US');
			
			const successIcon = document.getElementById('unscramble-success-feedback');
			successIcon.classList.remove('hidden');
			successIcon.classList.add('success-shake');

			setTimeout(() => {
				successIcon.classList.add('hidden');
				successIcon.classList.remove('success-shake');
				this.startUnscrambleGame();
			}, 1500);

		} else {
			soundManager.play('error');
			answerArea.classList.add('error');
			setTimeout(() => answerArea.classList.remove('error'), 500);

			setTimeout(() => {
                Array.from(answerArea.children).forEach(slot => {
					if (slot.firstChild) letterTilesArea.appendChild(slot.firstChild);
				});
			}, 500);
		}
	},

	// --- QUIZ 3: ĐỌC HIỂU (READING COMPREHENSION) ---
	startReadingQuiz: function(words) {
		const allWordsWithSentence = state.flashcards.filter(w => w.exampleSentence);
		const wordsForGame = [...words].sort(() => 0.5 - Math.random());
		const currentWord = wordsForGame[0];

		const options = [currentWord];
		const distractors = allWordsWithSentence.filter(w => w.id !== currentWord.id);
		while (options.length < 4 && distractors.length > 0) {
			const randomDistractor = distractors.splice(Math.floor(Math.random() * distractors.length), 1)[0];
			options.push(randomDistractor);
		}
		util.shuffleArray(options);

		const sentenceContainer = document.getElementById('reading-quiz-sentence-container');
		const sentenceHTML = currentWord.exampleSentence.replace('___', `<span class="text-blue-500 font-bold mx-2">_________</span>`);
		sentenceContainer.innerHTML = sentenceHTML;

		const optionsContainer = document.getElementById('reading-quiz-options-container');
		optionsContainer.innerHTML = '';
		options.forEach(option => {
			const optionButton = document.createElement('button');
			optionButton.className = 'quiz-option p-4 border rounded-lg text-lg font-semibold text-gray-700 bg-white';
			optionButton.textContent = option.english;
            // SỬA LỖI: Dùng this.handleReadingQuizOptionClick
			optionButton.onclick = () => this.handleReadingQuizOptionClick(optionButton, option, currentWord, wordsForGame);
			optionsContainer.appendChild(optionButton);
		});

		uiManager.openModal('readingQuizModal');
	},

	handleReadingQuizOptionClick: function(button, selectedOption, correctOption, wordPool) {
		soundManager.play('click');
		button.blur();
		document.querySelectorAll('#reading-quiz-options-container button').forEach(btn => btn.disabled = true);

		if (selectedOption.id === correctOption.id) {
			button.classList.add('correct');
			soundManager.play('success_2');
			progressManager.updateMasteryScore(correctOption.id, 2);
			const filledSentenceHTML = correctOption.exampleSentence.replace('___', `<span class="text-blue-600 font-bold mx-2">${correctOption.english}</span>`);
			document.getElementById('reading-quiz-sentence-container').innerHTML = filledSentenceHTML;
		} else {
			button.classList.add('incorrect');
			soundManager.play('fail');
			document.querySelectorAll('#reading-quiz-options-container button').forEach(btn => {
				if (btn.textContent === correctOption.english) btn.classList.add('correct');
			});
		}

		setTimeout(() => {
			const nextWordPool = wordPool.filter(w => w.id !== correctOption.id);
			if (nextWordPool.length > 0) {
				this.startReadingQuiz(nextWordPool);
			} else {
				uiManager.closeModal('readingQuizModal');
				alert("Chúc mừng! Bạn đã hoàn thành bài kiểm tra đọc hiểu cho chủ đề này.");
			}
		}, 2000);
	}
};

// III. HÀM TIỆN ÍCH (UTILITIES)
// ===================================================================================

/** @description Chứa các hàm tiện ích có thể tái sử dụng trong toàn bộ ứng dụng. */
const util = {
    /**
     * @description Chuyển đổi chuỗi tiếng Việt có dấu thành chuỗi không dấu, gạch dưới.
     * @param {string} text - Chuỗi đầu vào.
     * @returns {string} - Chuỗi đã được xử lý.
     */
    slugifyVietnamese: function(text) {
        text = text.toLowerCase();
        text = text.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
        text = text.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
        text = text.replace(/ì|í|ị|ỉ|ĩ/g, "i");
        text = text.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
        text = text.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
        text = text.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
        text = text.replace(/đ/g, "d");
        text = text.replace(/[^a-z0-9\s]/g, '');
        text = text.replace(/\s+/g, '_');
        return text;
    },

    /**
     * @description Xáo trộn các phần tử của một mảng.
     * @param {Array} array - Mảng cần xáo trộn.
     */
    shuffleArray: function(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    /**
     * @description Lấy danh sách flashcards đã được lọc theo chủ đề hiện tại.
     * @returns {Array} - Mảng flashcards đã lọc.
     */
    getFilteredCards: function() {
        return state.currentCategoryId
            ? state.flashcards.filter(card => card.categoryId === state.currentCategoryId)
            : state.flashcards;
    },

    /**
     * @description Lấy class màu gradient cho chủ đề.
     * @param {string} color - Tên màu (blue, purple,...).
     * @returns {string} - Chuỗi class của TailwindCSS.
     */
    getCategoryColorClass: function(color) {
        const colorMap = {
            'blue': 'from-blue-400 to-blue-600', 'purple': 'from-purple-400 to-purple-600',
            'pink': 'from-pink-400 to-pink-600', 'green': 'from-green-400 to-green-600',
            'yellow': 'from-yellow-400 to-yellow-600', 'red': 'from-red-400 to-red-600',
            'indigo': 'from-indigo-400 to-indigo-600', 'teal': 'from-teal-400 to-teal-600',
            'orange': 'from-orange-400 to-orange-600', 'gray': 'from-gray-400 to-gray-600'
        };
        return colorMap[color] || config.categoryColors[Math.floor(Math.random() * config.categoryColors.length)];
    },
    
    /**
     * @description Lấy class màu gradient cho trò chơi.
     * @param {string} color - Tên màu.
     * @returns {string} - Chuỗi class của TailwindCSS.
     */
    getGameColorClass: function(color) {
		const colorMap = {
			'blue': 'from-blue-400 to-blue-600', 'purple': 'from-purple-400 to-purple-600',
			'pink': 'from-pink-400 to-pink-600', 'green': 'from-green-400 to-green-600',
			'yellow': 'from-yellow-400 to-yellow-600', 'red': 'from-red-400 to-red-600'
		};
		return colorMap[color] || 'from-blue-400 to-blue-600';
	},

    /**
     * @description Lấy mã SVG cho biểu tượng của chủ đề.
     * @param {string} name - Tên chủ đề.
     * @returns {string} - Chuỗi SVG path.
     */
    getCategoryIcon: function(name) {
		const iconMap = {
			'Gia đình & Con người': '<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z"/>',
			'Danh từ chung': '<path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>'
		};
		return iconMap[name] || '<path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>';
	},

    /**
     * @description Lấy mã SVG cho biểu tượng của trò chơi, quiz, huy hiệu.
     * @param {string} icon - Tên biểu tượng.
     * @returns {string} - Chuỗi SVG path.
     */
    getIcon: function(type, iconName) {
        const iconMaps = {
            category: {
                'Gia đình & Con người': '<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z"/>',
			    'Danh từ chung': '<path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>'
            },
            game: {
                'puzzle': '<path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>',
                'image': '<path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>',
                'question': '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>',
                'volume-up': '<path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071a1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243a1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828a1 1 0 010-1.415z" clip-rule="evenodd"/>'
            },
            quiz: {
                'document': '<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>',
                'question': '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>',
                'book-open': '<path fill-rule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm8.5 3.5a.5.5 0 00-1 0V11a.5.5 0 00.5.5h2a.5.5 0 000-1h-1.5V5.5a.5.5 0 00-.5-.5zM5.5 5a.5.5 0 01.5-.5H8a.5.5 0 010 1H6v4.5a.5.5 0 01-1 0V5z" clip-rule="evenodd"/>'
            },
            badge: {
                'star': '<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>',
                'badge': '<path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>',
                'book': '<path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>',
                'play': '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/>'
            }
        };
        const defaultIcon = '<path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>';
        return (iconMaps[type] && iconMaps[type][iconName]) || defaultIcon;
    },

    /**
     * @description Tạo chuỗi HTML cho các ngôi sao đánh giá.
     * @param {number} rating - Số sao từ 1 đến 5.
     * @returns {string} - Chuỗi HTML.
     */
	getRatingStars: function(rating) {
		let stars = '';
		const starSVG = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
		for (let i = 0; i < 5; i++) {
			stars += `<span class="${i < rating ? 'text-yellow-500' : 'text-gray-300'}">${starSVG}</span>`;
		}
		return `<div class="flex">${stars}</div>`;
	},
    
    /**
     * @description Xử lý dữ liệu JSON đầu vào từ URL hoặc textarea.
     */
    processJSONInput: function() {
        // Lưu ý: hàm này cần được gọi từ một trình xử lý sự kiện trong module `app`
        // và nó sẽ cần truy cập vào `dom` và `uiManager`.
        const jsonUrl = dom.jsonUrlInput.value.trim();
        const jsonData = dom.jsonDataTextarea.value.trim();
        
        if (jsonUrl) {
            uiManager.showLoading();
            fetch(jsonUrl)
                .then(response => {
                    if (!response.ok) throw new Error('Không thể tải file JSON từ URL.');
                    return response.json();
                })
                .then(data => this.importData(data))
                .catch(error => alert('Lỗi: ' + error.message))
                .finally(() => uiManager.hideLoading());
        } else if (jsonData) {
            try {
                const data = JSON.parse(jsonData);
                this.importData(data);
            } catch (error) {
                alert('Lỗi: Dữ liệu JSON không hợp lệ.');
            }
        } else {
            alert('Vui lòng nhập URL hoặc dữ liệu JSON.');
        }
    },
    
    /**
     * @description Nhập dữ liệu từ đối tượng JSON vào trạng thái ứng dụng.
     * @param {object} data - Đối tượng chứa `categories` và `flashcards`.
     */
    importData: function(data) {
        if (data.categories && Array.isArray(data.categories)) {
            const existingIds = state.categories.map(c => c.id);
            const newCategories = data.categories.filter(c => !existingIds.includes(c.id));
            state.categories.push(...newCategories);
        }
        if (data.flashcards && Array.isArray(data.flashcards)) {
            const existingIds = state.flashcards.map(f => f.id);
            const newFlashcards = data.flashcards.filter(f => !existingIds.includes(f.id));
            state.flashcards.push(...newFlashcards);
        }
        
        // Cần gọi các hàm cập nhật UI từ `uiManager` sau khi nhập
        // Ví dụ: uiManager.loadCategories(), uiManager.updateFlashcard()...
        alert('Đã tải dữ liệu thành công!');
        uiManager.closeModal('jsonFileModal');
    },

    /**
     * @description Xuất dữ liệu hiện tại ra file JSON.
     */
    exportFlashcardsToJSON: function() {
        const data = {
            categories: state.categories,
            flashcards: state.flashcards
        };
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flashkids-${state.currentLevel}.json`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    }
};


// IV. MODULE ĐIỀU PHỐI CHÍNH CỦA ỨNG DỤNG (APP)
// ===================================================================================
const app = {
    /**
     * @description Khởi tạo ứng dụng: cache DOM, gán sự kiện, tải dữ liệu ban đầu.
     */
    init: function() {
        console.log("🚀 FlashKids App is initializing...");
        cacheDOMElements();
        this.bindEventListeners();

        const savedLevel = localStorage.getItem(config.LOCAL_STORAGE_KEYS.CURRENT_LEVEL);
        if (savedLevel) {
            state.currentLevel = savedLevel;
        }
        
        const progress = progressManager.getUserProgress();
        uiManager.updateWelcomeMessage(progress);
        // progressManager.loadUserSettings(progress); // Logic này nên nằm trong init nếu cần
        uiManager.updateUserStats(); // Cập nhật chỉ số từ progress đã load
        uiManager.updateXpDisplay(progress);
        
        this.changeLevel(state.currentLevel);
        
        // Tải các giao diện tĩnh
        uiManager.loadGames();
        uiManager.loadBadges();
        uiManager.loadQuizTypes();
    },

    /**
     * @description Gán tất cả các sự kiện cho các phần tử DOM tĩnh (static).
     */
    bindEventListeners: function() {
		// --- Điều hướng chính (Navigation) ---
		dom.navButtons.forEach(button => {
			button.addEventListener('click', () => {
				const tabId = button.dataset.tab;
				if (tabId === 'flashcards') {
					this.navigateToFlashcardsTab();
				} else if (tabId) {
					this.changeTab(tabId);
				}
			});
		});

		// --- Trang chủ (Home) ---
		const startNowBtn = document.getElementById('start-now-btn');
		if (startNowBtn) {
			startNowBtn.addEventListener('click', () => this.navigateToFlashcardsTab());
		}

		dom.levelBadges.forEach(badge => {
			// Gán sự kiện dựa trên data-level bạn đã thêm ở Bước 1
			badge.addEventListener('click', () => {
				const level = badge.dataset.level;
				if (level) {
					this.changeLevel(level, true);
				}
			});
		});

		// --- Thẻ từ vựng (Flashcards) ---
		dom.currentFlashcard.addEventListener('click', this.handleFlashcardFlip);
		dom.prevCardBtn.addEventListener('click', this.previousCard);
		dom.nextCardBtn.addEventListener('click', this.nextCard);
		dom.markLearnedBtn.addEventListener('click', progressManager.markCurrentWordAsLearned);

		// Nút nghe trên 2 mặt thẻ
		const listenBtnFront = dom.currentFlashcard.querySelector('.flashcard-front .listen-btn');
		if (listenBtnFront) {
			listenBtnFront.addEventListener('click', (event) => {
				event.stopPropagation();
				this.speakCurrentWord('english');
			});
		}
		const listenBtnBack = dom.currentFlashcard.querySelector('.flashcard-back .listen-btn');
		if (listenBtnBack) {
			listenBtnBack.addEventListener('click', (event) => {
				event.stopPropagation();
				this.speakCurrentWord('vietnamese');
			});
		}

		// --- Menu Người dùng (User Menu) ---
		const userMenuButton = document.getElementById('user-menu-button');
		const userMenu = document.getElementById('user-menu');
		if (userMenuButton && userMenu) {
			userMenuButton.addEventListener('click', (event) => {
				event.stopPropagation(); // Ngăn sự kiện click lan ra window và đóng menu ngay lập tức
				userMenu.classList.toggle('hidden');
			});
			// Đóng menu khi click ra ngoài
			window.addEventListener('click', () => {
				if (!userMenu.classList.contains('hidden')) {
					userMenu.classList.add('hidden');
				}
			});
		}
		// Link Cài đặt trong menu
		const menuSettingsLink = document.getElementById('menu-settings-link');
		if (menuSettingsLink) {
			menuSettingsLink.addEventListener('click', (event) => {
				event.preventDefault();
				this.changeTab('settings');
				if (userMenu) userMenu.classList.add('hidden');
			});
		}

		// --- Modals (Gán sự kiện cho các nút đóng) ---
		dom.modals.forEach(modal => {
			const closeButton = modal.querySelector('button[id*="close-"]'); // Tìm bất kỳ nút nào có id chứa "close-"
			if (closeButton) {
				closeButton.addEventListener('click', () => uiManager.closeModal(modal.id));
			}
			const confirmButton = modal.querySelector('#confirm-action-btn');
			if (confirmButton) {
				// Logic cho nút xác nhận có thể được thêm ở đây nếu cần
			}
		});
		// Gán sự kiện đóng cho nút "Đóng" của Completion Modal
		const closeCompletionBtn = document.querySelector('#completionModal button');
		if(closeCompletionBtn) {
			closeCompletionBtn.addEventListener('click', () => uiManager.closeModal('completionModal'));
		}
	},

    /**
     * @description Kiểm tra phiên bản ứng dụng định kỳ.
     */
    runPeriodicVersionCheck: function() {
		const lastCheck = parseInt(localStorage.getItem(config.LOCAL_STORAGE_KEYS.LAST_VERSION_CHECK) || '0');
		const oneDay = 24 * 60 * 60 * 1000;

		if (!lastCheck || (Date.now() - lastCheck > oneDay)) {
			const storedVersion = localStorage.getItem(config.LOCAL_STORAGE_KEYS.APP_VERSION);
			if (storedVersion !== config.APP_VERSION) {
				console.log(`Phiên bản cũ (${storedVersion}) được phát hiện. Cập nhật lên ${config.APP_VERSION}.`);
				
				// SỬA LỖI: Thay vì gọi pruneAudioCache(Infinity), chúng ta sẽ xóa tất cả các key có tiền tố 'audio_'
				console.log("Đang tiến hành dọn dẹp toàn bộ cache âm thanh...");
				for (let i = localStorage.length - 1; i >= 0; i--) {
					const key = localStorage.key(i);
					if (key.startsWith(config.LOCAL_STORAGE_KEYS.AUDIO_CACHE_PREFIX)) {
						localStorage.removeItem(key);
					}
				}
				console.log("Đã dọn dẹp cache âm thanh thành công.");
				
				localStorage.setItem(config.LOCAL_STORAGE_KEYS.APP_VERSION, config.APP_VERSION);
			}
			localStorage.setItem(config.LOCAL_STORAGE_KEYS.LAST_VERSION_CHECK, Date.now().toString());
		}
	},
    
    /**
     * @description Tải dữ liệu cho một level và cập nhật giao diện.
     */
    changeLevel: async function(level, isUserAction = false) {
        if (isUserAction) soundManager.play('click');
        
        state.currentLevel = level;
        localStorage.setItem(config.LOCAL_STORAGE_KEYS.CURRENT_LEVEL, level);
        uiManager.updateLevelBadges(level);

        try {
            const data = await dataManager.loadLevel(level);
            state.categories = data.categories || [];
            state.flashcards = data.flashcards || [];
            
            state.categories.forEach(category => {
                const count = state.flashcards.filter(card => card.categoryId === category.id).length;
                category.wordCount = count;
            });

            state.currentCategoryId = null;
            state.currentCardIndex = 0;
            
            uiManager.loadCategories();
            uiManager.loadCategoryFilters();
            uiManager.updateFlashcard();
        } catch (error) {
            console.error("Không thể thay đổi level:", error);
            alert(error.message);
        }
    },
    
    /**
     * @description Chuyển đổi giữa các tab chính.
     */
    changeTab: function(tabId) {
        soundManager.play('click');
		
        dom.tabs.forEach(tab => tab.classList.add('hidden'));
        const tabContent = document.getElementById(tabId);
        if (tabContent) tabContent.classList.remove('hidden');

        dom.navButtons.forEach(button => button.classList.remove('tab-active'));
        const activeButton = document.querySelector(`nav button[data-tab='${tabId}']`);
        if (activeButton) activeButton.classList.add('tab-active');

        state.isFlashcardsTabActive = (tabId === 'flashcards');
        
        if (state.isFlashcardsTabActive) {
            uiManager.updateFlashcard();
            uiManager.updateCategoryFilters();
        }
        
        if (tabId === 'stats') {
            uiManager.updateCategoryProgressDisplay();
            uiManager.renderActivityHeatmap();
            uiManager.renderMasteryChart();
        }
        
        this.runPeriodicVersionCheck();
    },
    
    /**
     * @description Chức năng điều hướng đặc biệt khi người dùng muốn vào thẳng tab Flashcards.
     */
    navigateToFlashcardsTab: function() {
        // Mặc định chọn chủ đề đầu tiên khi điều hướng từ trang chủ
        if (state.categories.length > 0) {
            state.currentCategoryId = state.categories[0].id;
        }
        state.currentCardIndex = 0;
        this.changeTab('flashcards');
    },
    
    /**
     * @description Xử lý hành động lật thẻ.
     */
    handleFlashcardFlip: function() {
        if (!state.isCardInteractable) return;
        dom.currentFlashcard.classList.toggle('flipped');
        
        if (state.isFlashcardsTabActive && state.soundEnabled) {
            setTimeout(() => {
                const isFlipped = dom.currentFlashcard.classList.contains('flipped');
                app.speakCurrentWord(isFlipped ? 'vietnamese' : 'english');
            }, 100);
        }
    },

    /**
     * @description Phát âm thanh cho từ hiện tại trên thẻ.
     */
    speakCurrentWord: function(language) {
        const filteredCards = util.getFilteredCards();
        if (filteredCards.length === 0) return;

        const card = filteredCards[state.currentCardIndex];
        const wordToSpeak = language === 'english' ? card.english : card.vietnamese;
        const langCode = language === 'english' ? 'en-US' : 'vi-VN';
        soundManager.speak(wordToSpeak, langCode);
    },
    
    /**
     * @description Chuyển đến thẻ tiếp theo.
     */
    nextCard: function() {
        const filteredCards = util.getFilteredCards();
        if (filteredCards.length === 0) return;

        state.currentCardIndex = (state.currentCardIndex + 1) % filteredCards.length;
        uiManager.updateFlashcard();
    },
    
    /**
     * @description Quay lại thẻ trước đó.
     */
    previousCard: function() {
        const filteredCards = util.getFilteredCards();
        if (filteredCards.length === 0) return;

        state.currentCardIndex = (state.currentCardIndex - 1 + filteredCards.length) % filteredCards.length;
        uiManager.updateFlashcard();
    }
};

// V. KHỞI CHẠY ỨNG DỤNG
// ===================================================================================
document.addEventListener('DOMContentLoaded', () => {
	app.init();    
});
// File: public/js/state.js
// Nhiệm vụ: Quản lý trạng thái tập trung cho toàn bộ ứng dụng.

import { MASTERY_THRESHOLD } from './config.js';

// Nơi lưu trữ tất cả dữ liệu động của ứng dụng
const appState = {
    categories: [],
    flashcards: [],
    flashcardCache: {},
    currentLevel: 'a1',
    currentCategoryId: null,
    currentCardIndex: 0,
    currentActivity: null, // { type: 'game'/'quiz', id: number, categoryId: string }
    userProgress: null // Sẽ được khởi tạo khi cần
};

// === CÁC HÀM "GETTER" - Chỉ để lấy thông tin trạng thái ===

export function getState() {
    return appState;
}

export function getFilteredCards() {
    // Trả về danh sách thẻ đã được lọc theo chủ đề hiện tại (nếu có)
    return appState.currentCategoryId
        ? appState.flashcards.filter(card => card.categoryId === appState.currentCategoryId)
        : appState.flashcards;
}

export function getUserProgress() {
    // Khởi tạo tiến độ người dùng nếu chưa có
    if (!appState.userProgress) {
        appState.userProgress = initUserProgress();
    }
    return appState.userProgress;
}


// === CÁC HÀM "SETTER" - Để thay đổi trạng thái một cách an toàn ===

export function setLevelData(level, data) {
    appState.flashcardCache[level] = data;
    appState.categories = data.categories || [];
    appState.flashcards = data.flashcards || [];
    
    // Tính toán lại wordCount thực tế dựa trên dữ liệu flashcards
    appState.categories.forEach(category => {
        category.wordCount = appState.flashcards.filter(card => card.categoryId === category.id).length;
    });
}

export function setCurrentLevel(level) {
    appState.currentLevel = level;
    localStorage.setItem('flashkids_currentLevel', level);
}

export function setCurrentCategoryId(categoryId) {
    appState.currentCategoryId = categoryId;
}

export function setCurrentCardIndex(index) {
    appState.currentCardIndex = index;
}

export function setCurrentActivity(activity) {
    appState.currentActivity = activity;
}

export function saveUserProgress() {
    // Hàm này chỉ có nhiệm vụ lưu tiến độ hiện tại vào localStorage
    localStorage.setItem('flashkids_progress', JSON.stringify(getUserProgress()));
}


// === LOGIC XỬ LÝ TIẾN ĐỘ NGƯỜI DÙNG ===

function initUserProgress() {
    const defaultProgress = {
        categories: {},
        masteryScores: {},
        completedGames: {},
        completedQuizzes: {},
        dailyActivitiesHistory: {},
        lastActivityDate: new Date().toDateString(),
        streakDays: 0,
        userProfile: {
            username: 'Hươu cao cổ',
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
        }
    };

    const savedProgressString = localStorage.getItem('flashkids_progress');
    if (savedProgressString) {
        try {
            const savedProgress = JSON.parse(savedProgressString);
            // Kết hợp dữ liệu đã lưu với mặc định để đảm bảo các thuộc tính mới luôn tồn tại
            const combinedUserProfile = { ...defaultProgress.userProfile, ...savedProgress.userProfile };
            const combinedProgress = { ...defaultProgress, ...savedProgress };
            combinedProgress.userProfile = combinedUserProfile;
            return combinedProgress;
        } catch (e) {
            console.error("Lỗi đọc progress, dùng mặc định.", e);
            return defaultProgress;
        }
    }
    return defaultProgress;
}

export function updateDailyActivity() {
    const progress = getUserProgress();
    const today = new Date().toDateString();
    
    // Ghi nhận lịch sử hoạt động
    progress.dailyActivitiesHistory[today] = (progress.dailyActivitiesHistory[today] || 0) + 1;

    // Tính chuỗi ngày học
    if (progress.lastActivityDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (progress.lastActivityDate === yesterday.toDateString()) {
            progress.streakDays = (progress.streakDays || 0) + 1;
            addXp(50); // Thưởng 50XP khi duy trì chuỗi
        } else {
            progress.streakDays = 1; // Reset chuỗi
        }
        progress.lastActivityDate = today;
    }
}

export function addXp(amount) {
    const profile = getUserProgress().userProfile;
    profile.xp += amount;
    
    let leveledUp = false;
    // Xử lý lên cấp
    if (profile.xp >= profile.xpToNextLevel) {
        profile.level += 1;
        profile.xp -= profile.xpToNextLevel; // Giữ lại XP thừa
        profile.xpToNextLevel = profile.level * 100; // Công thức tính XP cho level tiếp theo
        leveledUp = true;
    }
    
    // Tự động lưu sau khi có sự thay đổi
    saveUserProgress();
    return leveledUp;
}

export function updateMasteryScore(wordId, pointsToAdd) {
    const progress = getUserProgress();
    const oldScore = progress.masteryScores[wordId] || 0;
    
    let leveledUp = false;

    // Chỉ cộng điểm nếu chưa đạt ngưỡng
    if (oldScore < MASTERY_THRESHOLD) {
        const newScore = Math.min(MASTERY_THRESHOLD, oldScore + pointsToAdd);
        progress.masteryScores[wordId] = newScore;

        // Nếu lần đầu tiên đạt ngưỡng, ghi nhận hoạt động và thưởng XP
        if (newScore >= MASTERY_THRESHOLD && oldScore < MASTERY_THRESHOLD) {
            updateDailyActivity();
            if (addXp(20)) leveledUp = true;
        }
    }
    
    // Tự động lưu sau khi có sự thay đổi
    saveUserProgress();
    return leveledUp;
}
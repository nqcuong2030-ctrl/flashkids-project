// public/js/state.js
import { MASTERY_THRESHOLD } from './config.js';

// Quản lý trạng thái tập trung. Mọi thay đổi về dữ liệu cốt lõi của ứng dụng
// sẽ được thực hiện thông qua các hàm trong tệp này.

// Khởi tạo trạng thái ban đầu
const appState = {
    categories: [],
    flashcards: [],
    flashcardCache: {},
    currentLevel: 'a1',
    currentCategoryId: null,
    currentCardIndex: 0,
    currentActivity: null, // { type: 'game'/'quiz', id: number, categoryId: string }
    userProgress: null
};

// --- Getters: Hàm để lấy thông tin trạng thái ---
export function getState() {
    return appState;
}

export function getFilteredCards() {
    return appState.currentCategoryId
        ? appState.flashcards.filter(card => card.categoryId === appState.currentCategoryId)
        : appState.flashcards;
}

export function getUserProgress() {
    if (!appState.userProgress) {
        appState.userProgress = initUserProgress();
    }
    return appState.userProgress;
}

// --- Setters: Hàm để thay đổi trạng thái ---
export function setLevelData(level, data) {
    appState.flashcardCache[level] = data;
    appState.categories = data.categories || [];
    appState.flashcards = data.flashcards || [];
    
    // Tính toán lại wordCount thực tế
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
    appState.currentCardIndex = 0;
}

export function setCurrentCardIndex(index) {
    appState.currentCardIndex = index;
}

export function setCurrentActivity(activity) {
    appState.currentActivity = activity;
}

export function saveUserProgress() {
    localStorage.setItem('flashkids_progress', JSON.stringify(appState.userProgress));
}

// --- Logic quản lý tiến độ ---

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
            age: '',
            avatar: 'https://upload.wikimedia.org/wikipedia/commons/1/14/H%C6%B0%C6%A1u_cao_c%E1%BB%95.png',
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
        }
    };

    const savedProgressString = localStorage.getItem('flashkids_progress');
    if (savedProgressString) {
        try {
            const savedProgress = JSON.parse(savedProgressString);
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

export function updateCategoryProgress() {
    const progress = getUserProgress();
    appState.categories.forEach(category => {
        const wordsInCat = appState.flashcards.filter(card => card.categoryId === category.id);
        if (wordsInCat.length === 0) {
            progress.categories[`${appState.currentLevel}_${category.id}`] = 0;
            return;
        }
        let masteredCount = wordsInCat.filter(word => (progress.masteryScores[word.id] || 0) >= MASTERY_THRESHOLD).length;
        progress.categories[`${appState.currentLevel}_${category.id}`] = Math.round((masteredCount / wordsInCat.length) * 100);
    });
}

export function updateDailyActivity() {
    const progress = getUserProgress();
    const today = new Date().toDateString();
    progress.dailyActivitiesHistory[today] = (progress.dailyActivitiesHistory[today] || 0) + 1;

    if (progress.lastActivityDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        progress.streakDays = (progress.lastActivityDate === yesterday.toDateString()) ? (progress.streakDays || 0) + 1 : 1;
        progress.lastActivityDate = today;
        if(progress.streakDays > 1) addXp(50); // Thưởng khi duy trì chuỗi
    }
    console.log(`Hoạt động mới. Hôm nay: ${progress.dailyActivitiesHistory[today]}. Chuỗi: ${progress.streakDays} ngày.`);
}

export function addXp(amount) {
    const profile = getUserProgress().userProfile;
    profile.xp += amount;
    console.log(`+${amount} XP. Tổng: ${profile.xp}/${profile.xpToNextLevel}`);
    
    // Trả về true nếu người dùng lên cấp
    if (profile.xp >= profile.xpToNextLevel) {
        profile.level += 1;
        profile.xp -= profile.xpToNextLevel;
        profile.xpToNextLevel = profile.level * 100;
        return true; 
    }
    return false;
}

export function updateMasteryScore(wordId, pointsToAdd) {
    const progress = getUserProgress();
    const oldScore = progress.masteryScores[wordId] || 0;
    let leveledUp = false;

    if (oldScore < MASTERY_THRESHOLD) {
        const newScore = Math.min(MASTERY_THRESHOLD, oldScore + pointsToAdd);
        progress.masteryScores[wordId] = newScore;
        console.log(`Từ ${wordId}: ${oldScore} -> ${newScore} điểm.`);

        if (newScore >= MASTERY_THRESHOLD && oldScore < MASTERY_THRESHOLD) {
            updateDailyActivity();
            if (addXp(20)) leveledUp = true;
            console.log(`Từ ${wordId} đã thông thạo!`);
        }
    }
    updateCategoryProgress();
    saveUserProgress();
    return leveledUp;
}
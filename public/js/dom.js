// File: public/js/dom.js (PHIÊN BẢN SỬA LỖI MẤT TÍNH NĂNG)
// Nhiệm vụ: Chứa tất cả các hàm thao tác trực tiếp với HTML (DOM).

import { getState, getUserProgress } from './state.js';
import { MASTERY_THRESHOLD, GAMES_CONFIG, QUIZ_CONFIG, BADGES_CONFIG, CATEGORY_COLORS } from './config.js';

// Cache các element DOM thường dùng để tối ưu hiệu năng
const domCache = {
    loadingIndicator: document.getElementById('loading-indicator'),
    categoriesContainer: document.getElementById('categories-container'),
    flashcard: document.getElementById('current-flashcard'),
    englishWord: document.getElementById('english-word'),
    phoneticText: document.getElementById('phonetic-text'),
    vietnameseWord: document.getElementById('vietnamese-word'),
    cardImage: document.getElementById('card-image'),
    cardCounter: document.getElementById('card-counter'),
    prevCardBtn: document.getElementById('prev-card'),
    nextCardBtn: document.getElementById('next-card'),
    xpLevel: document.getElementById('xp-level'),
    xpBar: document.getElementById('xp-bar'),
    xpText: document.getElementById('xp-text'),
    welcomeMessage: document.getElementById('welcome-message'),
    masteryChartCanvas: document.getElementById('mastery-chart'),
    gamesContainer: document.getElementById('games-container'),
    quizTypesContainer: document.getElementById('quiz-types'),
    badgesContainer: document.getElementById('badges-container'), // Bổ sung
};

let masteryChartInstance = null; // Biến để lưu trữ instance của Chart.js

// === CÁC HÀM TIỆN ÍCH CHUNG ===

export function showLoading() {
    domCache.loadingIndicator?.classList.remove('hidden');
}

export function hideLoading() {
    domCache.loadingIndicator?.classList.add('hidden');
}

export function openModal(modalId) {
    document.getElementById(modalId)?.classList.add('show');
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        loadCategories(); // Tải lại category để cập nhật tiến độ sau khi đóng modal
    }
}

// === CÁC HÀM RENDER GIAO DIỆN CHÍNH ===

export function loadCategories() {
    const { categories } = getState();
    if (!domCache.categoriesContainer) return;
    domCache.categoriesContainer.innerHTML = '';

    categories.forEach((category, index) => {
        const progressPercent = getCategoryProgress(category.id);
        const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
        const categoryElement = document.createElement('div');
        categoryElement.className = `category-card bg-gradient-to-br ${color} rounded-2xl p-5 text-white shadow-lg lift-on-hover`;
        categoryElement.dataset.categoryId = category.id;
        categoryElement.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <h4 class="text-lg font-bold">${category.name}</h4>
                <span class="bg-white text-gray-700 text-xs font-bold px-2 py-1 rounded-full">${category.wordCount} từ</span>
            </div>
            <div>
                <div class="text-sm mb-1">Tiến độ: ${progressPercent}%</div>
                <div class="w-full bg-white bg-opacity-30 rounded-full h-2">
                    <div class="bg-white h-2 rounded-full" style="width: ${progressPercent}%"></div>
                </div>
            </div>
        `;
        domCache.categoriesContainer.appendChild(categoryElement);
    });
}

export function updateFlashcard() {
    const { flashcards, currentCardIndex, currentCategoryId } = getState();
    const filteredCards = currentCategoryId ? flashcards.filter(c => c.categoryId === currentCategoryId) : flashcards;
    const card = filteredCards[currentCardIndex];

    if (!card) {
        domCache.englishWord.textContent = 'Trống';
        domCache.vietnameseWord.textContent = 'Vui lòng chọn chủ đề';
        domCache.phoneticText.textContent = '';
        domCache.cardImage.innerHTML = '';
        updateCardCounter();
        return;
    }
    domCache.englishWord.textContent = card.english;
    domCache.phoneticText.textContent = card.phonetic || '';
    domCache.vietnameseWord.textContent = card.vietnamese;
    
    if (card.image && (card.image.startsWith('http'))) {
        domCache.cardImage.innerHTML = `<img src="${card.image}" alt="${card.english}" class="w-full h-full object-contain">`;
    } else {
        domCache.cardImage.innerHTML = '';
    }
    
    domCache.flashcard.classList.remove('flipped');
    updateCardCounter();

    // SỬA LỖI: Tự động đọc từ vựng khi thẻ mới xuất hiện
    // (Logic này được chuyển từ action.js)
    setTimeout(() => {
        const activeTab = document.querySelector('nav button.tab-active');
        if (activeTab && activeTab.dataset.tab === 'flashcards') {
            speakWord(card.english, 'en-US');
        }
    }, 150);
}

export function updateCardCounter() {
    const { flashcards, currentCardIndex, currentCategoryId } = getState();
    const filteredCards = currentCategoryId ? flashcards.filter(c => c.categoryId === currentCategoryId) : [];
    
    if (domCache.cardCounter) {
        domCache.cardCounter.textContent = `${currentCardIndex + 1} / ${filteredCards.length}`;
    }
    if (domCache.prevCardBtn) domCache.prevCardBtn.disabled = currentCardIndex === 0;
    if (domCache.nextCardBtn) domCache.nextCardBtn.disabled = currentCardIndex >= filteredCards.length - 1;
}

export function updateUserProfileDisplay() {
    const { userProfile } = getUserProgress();
    if (domCache.welcomeMessage) domCache.welcomeMessage.textContent = `Xin chào, ${userProfile.username}!`;
    if (domCache.xpLevel) domCache.xpLevel.textContent = userProfile.level;
    if (domCache.xpText) domCache.xpText.textContent = `${userProfile.xp}/${userProfile.xpToNextLevel}`;
    if (domCache.xpBar) domCache.xpBar.style.width = `${(userProfile.xp / userProfile.xpToNextLevel) * 100}%`;
}


// === CÁC HÀM RENDER BỊ THIẾU ===

// BỔ SUNG: Hàm render danh sách game (từ action.js)
export function loadGames() {
    if (!domCache.gamesContainer) return;
    domCache.gamesContainer.innerHTML = '';
    
    GAMES_CONFIG.forEach(game => {
        const gameElement = document.createElement('div');
        gameElement.setAttribute('onclick', `startGame(${game.id})`);
        gameElement.className = `game-card bg-gradient-to-br from-${game.color}-400 to-${game.color}-600 rounded-2xl p-5 text-white shadow-lg cursor-pointer lift-on-hover`;
        gameElement.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <h4 class="text-lg font-bold">${game.name}</h4>
                <span class="bg-white text-${game.color}-600 text-xs font-bold px-2 py-1 rounded-full">${game.difficulty}</span>
            </div>
            <p class="text-sm text-white text-opacity-90 mb-4">${game.description}</p>
            <div class="flex justify-end">
                <div class="bg-white text-${game.color}-600 font-bold py-2 px-4 rounded-lg shadow-md">Chơi ngay</div>
            </div>
        `;
        domCache.gamesContainer.appendChild(gameElement);
    });
}

// BỔ SUNG: Hàm render danh sách quiz (từ action.js)
export function loadQuizTypes() {
    if (!domCache.quizTypesContainer) return;
    domCache.quizTypesContainer.innerHTML = '';

    QUIZ_CONFIG.forEach(quiz => {
        const quizElement = document.createElement('div');
        quizElement.className = 'bg-white rounded-2xl p-6 shadow-md';
        quizElement.innerHTML = `
            <h3 class="text-lg font-bold text-gray-800 mb-2">${quiz.name}</h3>
            <p class="text-gray-600 mb-4">${quiz.description}</p>
            <button class="btn-primary text-white py-2 px-6 rounded-full shadow-md w-full" onclick="startQuiz(${quiz.id})">Bắt đầu</button>
        `;
        domCache.quizTypesContainer.appendChild(quizElement);
    });
}

// BỔ SUNG: Hàm render huy hiệu (từ action.js)
export function loadBadges() {
    if (!domCache.badgesContainer) return;
    domCache.badgesContainer.innerHTML = '';
    const progress = getUserProgress();

    // Cập nhật trạng thái huy hiệu (logic này từ action.js)
    BADGES_CONFIG[0].achieved = progress.streakDays >= 7;
    const totalLearned = Object.values(progress.masteryScores).filter(score => score >= MASTERY_THRESHOLD).length;
    BADGES_CONFIG[1].achieved = totalLearned >= 100;
    BADGES_CONFIG[1].progress = `${totalLearned}/100`;
    const completedQuizzes = Object.keys(progress.completedQuizzes).length;
    BADGES_CONFIG[2].achieved = completedQuizzes >= 5;
    BADGES_CONFIG[2].progress = `${completedQuizzes}/5`;

    BADGES_CONFIG.forEach(badge => {
        const badgeElement = document.createElement('div');
        badgeElement.className = 'bg-white rounded-2xl p-5 shadow-md text-center';
        badgeElement.innerHTML = `
            <div class="w-20 h-20 mx-auto rounded-full bg-${badge.color}-100 flex items-center justify-center mb-4 ${badge.achieved ? '' : 'opacity-50'}">
                // Icon SVG sẽ được thêm vào sau nếu cần
            </div>
            <h4 class="text-lg font-bold text-gray-800 mb-1">${badge.name}</h4>
            <p class="text-gray-600 text-sm mb-2">${badge.description}</p>
            ${badge.achieved 
                ? `<span class="bg-green-100 text-green-600 text-xs font-bold px-2 py-1 rounded-full">Đã đạt</span>`
                : `<span class="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">${badge.progress || ''}</span>`
            }
        `;
        domCache.badgesContainer.appendChild(badgeElement);
    });
}

export function renderMasteryChart() {
    const progress = getUserProgress();
    const { flashcards } = getState();
    const ctx = domCache.masteryChartCanvas?.getContext('2d');
    if (!ctx) return;

    let masteredCount = 0;
    let learningCount = 0;
    const wordIdsInLevel = new Set(flashcards.map(word => word.id));

    for (const wordId in progress.masteryScores) {
        if (wordIdsInLevel.has(parseInt(wordId))) {
            const score = progress.masteryScores[wordId];
            if (score >= MASTERY_THRESHOLD) masteredCount++;
            else if (score > 0) learningCount++;
        }
    }
    const unlearnedCount = flashcards.length - masteredCount - learningCount;

    if (masteryChartInstance) masteryChartInstance.destroy();
    
    masteryChartInstance = new Chart(ctx, {
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
}

function getCategoryProgress(categoryId) {
    const progress = getUserProgress();
    const { flashcards } = getState();
    const wordsInCat = flashcards.filter(card => card.categoryId === categoryId);
    if (wordsInCat.length === 0) return 0;
    const masteredCount = wordsInCat.filter(word => (progress.masteryScores[word.id] || 0) >= MASTERY_THRESHOLD).length;
    return Math.round((masteredCount / wordsInCat.length) * 100);
}

// Bổ sung: Import hàm speakWord để dom.js có thể sử dụng
import { speakWord } from './audio.js';
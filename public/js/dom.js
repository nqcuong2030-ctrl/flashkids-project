// File: public/js/dom.js (PHIÊN BẢN SỬA LỖI MẤT BỘ LỌC)
// Nhiệm vụ: Chứa tất cả các hàm thao tác trực tiếp với HTML (DOM).

import { getState, getUserProgress } from './state.js';
import { MASTERY_THRESHOLD, GAMES_CONFIG, QUIZ_CONFIG, BADGES_CONFIG, CATEGORY_COLORS } from './config.js';

// Cache các element DOM thường dùng để tối ưu hiệu năng
const domCache = {
    loadingIndicator: document.getElementById('loading-indicator'),
    categoriesContainer: document.getElementById('categories-container'),
    categoryFilters: document.getElementById('category-filters'), // Bổ sung
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
    badgesContainer: document.getElementById('badges-container'),
};

let masteryChartInstance = null;

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
        loadCategories();
    }
}

// === CÁC HÀM RENDER GIAO DIỆN CHÍNH ===

export function loadCategories() {
    // ... (Hàm này giữ nguyên như cũ, không thay đổi)
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

// BỔ SUNG: Hàm render bộ lọc chủ đề trên tab Flashcards
export function loadCategoryFilters() {
    const { categories, currentCategoryId } = getState();
    const container = domCache.categoryFilters;
    if (!container) return;

    // Luôn bắt đầu với nút "Tất cả"
    container.innerHTML = `<button class="bg-blue-500 text-white py-2 px-4 rounded-full shadow-md flex-shrink-0" onclick="filterByCategory(null)">Tất cả</button>`;
    
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'bg-white text-gray-700 py-2 px-4 rounded-full shadow-md flex-shrink-0';
        button.textContent = category.name;
        button.setAttribute('onclick', `filterByCategory('${category.id}')`);
        container.appendChild(button);
    });

    updateCategoryFiltersUI(); // Cập nhật trạng thái active
}

// BỔ SUNG: Hàm cập nhật UI cho bộ lọc
export function updateCategoryFiltersUI() {
    const { categories, currentCategoryId } = getState();
    const buttons = domCache.categoryFilters?.querySelectorAll('button');
    if (!buttons) return;

    buttons.forEach((button, index) => {
        button.classList.remove('bg-blue-500', 'text-white');
        button.classList.add('bg-white', 'text-gray-700');
        
        const buttonCategoryId = button.getAttribute('onclick').match(/'([^']+)'/)?.[1] || null;

        if ( (currentCategoryId === null && index === 0) || (buttonCategoryId && buttonCategoryId === currentCategoryId) ) {
            button.classList.remove('bg-white', 'text-gray-700');
            button.classList.add('bg-blue-500', 'text-white');
        }
    });
}


export function updateFlashcard() {
    // ... (Hàm này giữ nguyên như cũ, không thay đổi)
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

    setTimeout(() => {
        const activeTab = document.querySelector('nav button.tab-active');
        if (activeTab && activeTab.dataset.tab === 'flashcards') {
            speakWord(card.english, 'en-US');
        }
    }, 150);
}

export function updateCardCounter() {
    // ... (Hàm này giữ nguyên như cũ, không thay đổi)
    const { flashcards, currentCardIndex, currentCategoryId } = getState();
    const filteredCards = currentCategoryId ? flashcards.filter(c => c.categoryId === currentCategoryId) : [];
    
    if (domCache.cardCounter) {
        domCache.cardCounter.textContent = `${currentCardIndex + 1} / ${filteredCards.length}`;
    }
    if (domCache.prevCardBtn) domCache.prevCardBtn.disabled = currentCardIndex === 0;
    if (domCache.nextCardBtn) domCache.nextCardBtn.disabled = currentCardIndex >= filteredCards.length - 1;
}

export function updateUserProfileDisplay() {
    // ... (Hàm này giữ nguyên như cũ, không thay đổi)
    const { userProfile } = getUserProgress();
    if (domCache.welcomeMessage) domCache.welcomeMessage.textContent = `Xin chào, ${userProfile.username}!`;
    if (domCache.xpLevel) domCache.xpLevel.textContent = userProfile.level;
    if (domCache.xpText) domCache.xpText.textContent = `${userProfile.xp}/${userProfile.xpToNextLevel}`;
    if (domCache.xpBar) domCache.xpBar.style.width = `${(userProfile.xp / userProfile.xpToNextLevel) * 100}%`;
}


// === CÁC HÀM RENDER BỊ THIẾU ===

export function loadGames() {
    // ... (Hàm này giữ nguyên như cũ, không thay đổi)
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

export function loadQuizTypes() {
    // ... (Hàm này giữ nguyên như cũ, không thay đổi)
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

export function loadBadges() {
    // ... (Hàm này giữ nguyên như cũ, không thay đổi)
    if (!domCache.badgesContainer) return;
    domCache.badgesContainer.innerHTML = '';
    const progress = getUserProgress();

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
                // Icon SVG
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
    // ... (Hàm này giữ nguyên như cũ, không thay đổi)
}

function getCategoryProgress(categoryId) {
    // ... (Hàm này giữ nguyên như cũ, không thay đổi)
    const progress = getUserProgress();
    const { flashcards } = getState();
    const wordsInCat = flashcards.filter(card => card.categoryId === categoryId);
    if (wordsInCat.length === 0) return 0;
    const masteredCount = wordsInCat.filter(word => (progress.masteryScores[word.id] || 0) >= MASTERY_THRESHOLD).length;
    return Math.round((masteredCount / wordsInCat.length) * 100);
}

// Bổ sung: Import hàm speakWord để dom.js có thể sử dụng
import { speakWord } from './audio.js';
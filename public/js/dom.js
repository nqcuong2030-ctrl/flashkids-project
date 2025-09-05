// public/js/dom.js (PHIÊN BẢN ĐÃ SỬA LỖI ID)
import { getState, getUserProgress, getFilteredCards } from './state.js';
import { CATEGORY_COLORS, GAMES_CONFIG, QUIZ_CONFIG } from './config.js';

// Cache các element DOM - ĐÃ SỬA LẠI ID CHO ĐÚNG VỚI FILE INDEX.HTML
const domCache = {
    loadingOverlay: document.getElementById('loading-indicator'),
    levelSelect: document.querySelectorAll('.level-badge'), // Sửa: Dùng querySelectorAll
    categoryList: document.getElementById('categories-container'), // Sửa: ID đúng
    flashcardContainer: document.getElementById('current-flashcard'), // Sửa: ID đúng
    progressBar: document.getElementById('progress-bar'), // Giả định ID này sẽ được thêm sau
    progressText: document.getElementById('card-counter'), // Sửa: Dùng card-counter
    prevBtn: document.getElementById('prev-card'), // Sửa: ID đúng
    nextBtn: document.getElementById('next-card'), // Sửa: ID đúng
    cardFront: document.querySelector('.flashcard-front'), // Sửa: Dùng querySelector
    cardBack: document.querySelector('.flashcard-back'), // Sửa: Dùng querySelector
    mainContent: document.querySelector('main'), // Sửa: Dùng querySelector
    homeTab: document.getElementById('home'),
    flashcardsTab: document.getElementById('flashcards'),
    gamesTab: document.getElementById('games'),
    quizTab: document.getElementById('quiz'),
    rewardsTab: document.getElementById('rewards'),
    statsTab: document.getElementById('stats'),
    userProfileName: document.getElementById('welcome-message'), // Sửa: Dùng welcome-message
    userProfileAvatar: document.querySelector('#user-menu-button img'), // Sửa: Dùng querySelector
    userLevel: document.getElementById('xp-level'),
    userXp: document.getElementById('xp-text'),
    masteryChartCanvas: document.getElementById('mastery-chart'),
};

let masteryChart = null;

export function showLoading() {
    if (domCache.loadingOverlay) domCache.loadingOverlay.classList.remove('hidden');
}

export function hideLoading() {
    if (domCache.loadingOverlay) domCache.loadingOverlay.classList.add('hidden');
}

export function loadCategories() {
    const { categories, currentLevel } = getState();
    const progress = getUserProgress();
    if (!domCache.categoryList) return;
    domCache.categoryList.innerHTML = '';
    
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
            <div class="flex justify-between items-end">
                <div>
                    <div class="text-sm mb-1">Tiến độ: ${progressPercent}%</div>
                    <div class="w-32 bg-white bg-opacity-30 rounded-full h-2">
                        <div class="bg-white h-2 rounded-full" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
            </div>
        `;
        domCache.categoryList.appendChild(categoryElement);
    });
}

export function renderFlashcards() {
    const { currentCardIndex } = getState();
    const filteredCards = getFilteredCards();
    updateProgressBar();
    updateFlashcard(filteredCards[currentCardIndex]);
}

export function updateFlashcard(card) {
    if (!domCache.cardFront || !domCache.cardBack) return;
    if (!card) {
        domCache.cardFront.innerHTML = `<div>Không có từ vựng nào.</div>`;
        domCache.cardBack.innerHTML = `<div>Vui lòng chọn chủ đề khác.</div>`;
        return;
    }
    
    document.getElementById('english-word').textContent = card.english;
    document.getElementById('phonetic-text').textContent = card.phonetic || '';
    document.getElementById('vietnamese-word').textContent = card.vietnamese;
    
    if (domCache.flashcardContainer) domCache.flashcardContainer.classList.remove('flipped');
}

export function updateProgressBar() {
    const { currentCardIndex } = getState();
    const filteredCards = getFilteredCards();
    const total = filteredCards.length;

    if (!domCache.progressText) return;
    domCache.progressText.textContent = `${currentCardIndex + 1}/${total}`;

    if (domCache.prevBtn) domCache.prevBtn.disabled = currentCardIndex === 0;
    if (domCache.nextBtn) domCache.nextBtn.disabled = currentCardIndex === total - 1;
}

export function updateUserProfileDisplay() {
    const { userProfile } = getUserProgress();
    if (domCache.userProfileName) domCache.userProfileName.textContent = `Xin chào, ${userProfile.username}!`;
    if (domCache.userProfileAvatar) domCache.userProfileAvatar.src = userProfile.avatar;
    if (domCache.userLevel) domCache.userLevel.textContent = userProfile.level;
    if (domCache.userXp) document.getElementById('xp-bar').style.width = `${(userProfile.xp / userProfile.xpToNextLevel) * 100}%`;
}

// Sửa lại hàm này để hoạt động với cấu trúc tab mới
export function showScreen(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    const activeTab = document.getElementById(tabId);
    if (activeTab) {
        activeTab.classList.remove('hidden');
    }
}

// Các hàm renderGameScreen và renderQuizScreen cần được điều chỉnh để trỏ đúng ID
export function renderGameScreen(gameId, categoryName) {
    const game = GAMES_CONFIG.find(g => g.id === gameId);
    openModal(`${game.modalId || 'matchingGameModal'}`);
}

export function renderQuizScreen(quizId, categoryName) {
    const quiz = QUIZ_CONFIG.find(q => q.id === quizId);
    openModal(`${quiz.modalId || 'multipleChoiceQuizModal'}`);
}

export function renderMasteryChart() {
    // ... logic vẽ biểu đồ giữ nguyên ...
}

// Hàm này cần tồn tại để các module khác gọi
export function getCategoryProgress(categoryId) {
	const progress = getUserProgress();
    const wordsInCat = flashcards.filter(card => card.categoryId === categoryId);
    if (wordsInCat.length === 0) return 0;

    let masteredCount = wordsInCat.filter(word => (progress.masteryScores[word.id] || 0) >= 3).length;
    return Math.round((masteredCount / wordsInCat.length) * 100);
}
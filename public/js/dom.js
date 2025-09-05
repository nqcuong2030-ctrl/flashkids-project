// File: public/js/dom.js
// Nhiệm vụ: Chứa tất cả các hàm thao tác trực tiếp với HTML (DOM).

import { getState, getUserProgress } from './state.js';
import { MASTERY_THRESHOLD, GAMES_CONFIG, QUIZ_CONFIG, CATEGORY_COLORS } from './config.js';

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
};

let masteryChartInstance = null; // Biến để lưu trữ instance của Chart.js

/**
 * Hiển thị chỉ báo đang tải.
 */
export function showLoading() {
    domCache.loadingIndicator?.classList.remove('hidden');
}

/**
 * Ẩn chỉ báo đang tải.
 */
export function hideLoading() {
    domCache.loadingIndicator?.classList.add('hidden');
}

/**
 * Mở một modal dựa trên ID.
 * @param {string} modalId - ID của modal cần mở.
 */
export function openModal(modalId) {
    document.getElementById(modalId)?.classList.add('show');
}

/**
 * Đóng một modal dựa trên ID.
 * @param {string} modalId - ID của modal cần đóng.
 */
export function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('show');
}

/**
 * Render danh sách các chủ đề ra trang chủ.
 */
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

/**
 * Cập nhật nội dung của thẻ từ vựng hiện tại.
 */
export function updateFlashcard() {
    const { flashcards, currentCardIndex, currentCategoryId } = getState();
    const filteredCards = currentCategoryId ? flashcards.filter(c => c.categoryId === currentCategoryId) : flashcards;
    const card = filteredCards[currentCardIndex];

    if (!card) {
        domCache.englishWord.textContent = 'Trống';
        domCache.vietnameseWord.textContent = 'Vui lòng chọn chủ đề';
        return;
    }
    domCache.englishWord.textContent = card.english;
    domCache.phoneticText.textContent = card.phonetic || '';
    domCache.vietnameseWord.textContent = card.vietnamese;
    
    // Xử lý hiển thị ảnh hoặc icon
    if (card.image && (card.image.startsWith('http'))) {
        domCache.cardImage.innerHTML = `<img src="${card.image}" alt="${card.english}" class="w-full h-full object-contain">`;
    } else {
        domCache.cardImage.innerHTML = ''; // Hoặc hiển thị icon mặc định nếu có
    }
    
    domCache.flashcard.classList.remove('flipped');
    updateCardCounter();
}

/**
 * Cập nhật bộ đếm thẻ (ví dụ: 1 / 20).
 */
export function updateCardCounter() {
    const { flashcards, currentCardIndex, currentCategoryId } = getState();
    const filteredCards = currentCategoryId ? flashcards.filter(c => c.categoryId === currentCategoryId) : [];
    
    if (domCache.cardCounter) {
        domCache.cardCounter.textContent = `${currentCardIndex + 1} / ${filteredCards.length}`;
    }
    if (domCache.prevCardBtn) domCache.prevCardBtn.disabled = currentCardIndex === 0;
    if (domCache.nextCardBtn) domCache.nextCardBtn.disabled = currentCardIndex >= filteredCards.length - 1;
}

/**
 * Cập nhật thông tin người dùng trên header.
 */
export function updateUserProfileDisplay() {
    const { userProfile } = getUserProgress();
    if (domCache.welcomeMessage) domCache.welcomeMessage.textContent = `Xin chào, ${userProfile.username}!`;
    if (domCache.xpLevel) domCache.xpLevel.textContent = userProfile.level;
    if (domCache.xpText) domCache.xpText.textContent = `${userProfile.xp}/${userProfile.xpToNextLevel}`;
    if (domCache.xpBar) domCache.xpBar.style.width = `${(userProfile.xp / userProfile.xpToNextLevel) * 100}%`;
}

/**
 * Render biểu đồ tròn thể hiện mức độ thông thạo từ vựng.
 */
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

/**
 * Helper function để tính toán tiến độ của một chủ đề.
 * @param {string} categoryId - ID của chủ đề.
 * @returns {number} Phần trăm hoàn thành.
 */
function getCategoryProgress(categoryId) {
    const progress = getUserProgress();
    const { flashcards } = getState();
    const wordsInCat = flashcards.filter(card => card.categoryId === categoryId);
    if (wordsInCat.length === 0) return 0;
    const masteredCount = wordsInCat.filter(word => (progress.masteryScores[word.id] || 0) >= MASTERY_THRESHOLD).length;
    return Math.round((masteredCount / wordsInCat.length) * 100);
}
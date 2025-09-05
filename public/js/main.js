// File: public/js/main.js (PHIÊN BẢN HOÀN CHỈNH CUỐI CÙNG)
// Nhiệm vụ: "Nhạc trưởng" điều phối toàn bộ ứng dụng.

import { runPeriodicVersionCheck, fetchLevelData } from './api.js';
import { playSound, speakWord } from './audio.js';
import { 
    loadCategories, updateFlashcard, updateUserProfileDisplay, 
    openModal, closeModal, renderMasteryChart,
    loadGames, loadQuizTypes, loadBadges,
    loadCategoryFilters, updateCategoryFiltersUI
} from './dom.js';
import { startMatchingGame, startImageQuiz, startFillBlankGame, startSoundMatchGame } from './games.js';
import { startMultipleChoiceQuiz, startUnscrambleQuiz, startReadingQuiz } from './quiz.js';
import { 
    getState, setLevelData, setCurrentLevel, setCurrentCategoryId, 
    setCurrentCardIndex, saveUserProgress, addXp, getUserProgress, 
    getFilteredCards, setCurrentActivity
} from './state.js';


// === CÁC HÀM XỬ LÝ SỰ KIỆN CHÍNH (Sẽ được gán ra `window` để HTML gọi) ===

async function changeLevel(level, isUserAction = false) {
    if (isUserAction) playSound('click');
    setCurrentLevel(level);
    
    try {
        const data = await fetchLevelData(level, getState().flashcardCache);
        setLevelData(level, data);
        loadCategories();
        loadCategoryFilters();
        updateFlashcard();
        
        document.querySelectorAll('.level-badge').forEach(badge => {
            badge.classList.remove('active');
            if (badge.getAttribute('onclick')?.includes(`'${level}'`)) {
                badge.classList.add('active');
            }
        });
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu level:", error);
    }
}

function changeTab(tabId) {
    playSound('click');
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(tabId)?.classList.remove('hidden');

    document.querySelectorAll('nav button').forEach(button => button.classList.remove('tab-active'));
    document.querySelector(`nav button[data-tab='${tabId}']`)?.classList.add('tab-active');

    if (tabId === 'stats') {
        renderMasteryChart();
    }
}

function navigateToFlashcardsTab() {
    const { categories } = getState();
    setCurrentCategoryId(categories[0]?.id || null);
    setCurrentCardIndex(0);
    changeTab('flashcards');
    loadCategoryFilters();
    updateFlashcard();
}

function speakCurrentWord(language) {
    const card = getFilteredCards()[getState().currentCardIndex];
    if (!card) return;
    const wordToSpeak = language === 'english' ? card.english : card.vietnamese;
    const lang = language === 'english' ? 'en-US' : 'vi-VN';
    speakWord(wordToSpeak, lang);
}

function filterByCategory(categoryId) {
    playSound('click');
    setCurrentCategoryId(categoryId);
    setCurrentCardIndex(0);
    updateFlashcard();
    updateCategoryFiltersUI();
}

function startGame(gameId) {
    playSound('click');
    setCurrentActivity({ type: 'game', id: gameId });
    openModal('categorySelectionModal');
    const container = document.getElementById('category-selection-container');
    container.innerHTML = document.getElementById('categories-container').innerHTML;
}

function startQuiz(quizId) {
    playSound('click');
    setCurrentActivity({ type: 'quiz', id: quizId });
    openModal('categorySelectionModal');
    const container = document.getElementById('category-selection-container');
    container.innerHTML = document.getElementById('categories-container').innerHTML;
}


// === CÁC HÀM XỬ LÝ LOGIC PHỤ (Internal Handlers) ===

function handleCategorySelect(categoryId) {
    setCurrentCategoryId(categoryId);
    setCurrentCardIndex(0);
    changeTab('flashcards');
    loadCategoryFilters();
    updateFlashcard();
}

function navigateCard(direction) {
    playSound('click');
    const { currentCardIndex } = getState();
    const newIndex = currentCardIndex + direction;

    const filteredCards = getFilteredCards();
    if (newIndex >= 0 && newIndex < filteredCards.length) {
        setCurrentCardIndex(newIndex);
        updateFlashcard();
    }
}

function handleActivitySelection(categoryId) {
    const activity = getState().currentActivity;
    if (!activity) return;

    closeModal('categorySelectionModal');

    // SỬA LỖI: Xử lý trường hợp đặc biệt cho game Ghép Âm thanh
    if (activity.type === 'game' && activity.id === 4) {
        // Lưu lại category đã chọn và mở modal chọn độ khó
        setCurrentActivity({ ...activity, categoryId: categoryId });
        openModal('gameOptionsModal');
        return; // Dừng hàm ở đây
    }

    // Logic cũ cho các game và quiz còn lại
    const allCards = getState().flashcards;
    const categoryCards = allCards.filter(c => c.categoryId === categoryId);

    if (activity.type === 'game') {
        switch (activity.id) {
            case 1: startMatchingGame(categoryCards, handleActivityEnd); break;
            case 2: startImageQuiz(allCards, categoryCards, handleActivityEnd); break;
            case 3: startFillBlankGame(categoryCards); break;
        }
    } else if (activity.type === 'quiz') {
        switch (activity.id) {
            case 1: startMultipleChoiceQuiz(allCards, categoryCards, handleActivityEnd); break;
            case 2: startUnscrambleQuiz(categoryCards); break;
            case 3: startReadingQuiz(allCards, categoryCards, handleActivityEnd); break;
        }
    }
}

function handleActivityEnd(completed, xpGained) {
    if (completed && xpGained > 0) {
        const leveledUp = addXp(xpGained);
        if (leveledUp) {
            alert(`🎉 Chúc mừng! Bạn đã đạt Level ${getUserProgress().userProfile.level}!`);
        }
    }
    
    document.querySelectorAll('.modal.show').forEach(modal => modal.classList.remove('show'));
    updateUserProfileDisplay();
    loadCategories();
}


// === ĐIỂM KHỞI ĐẦU CỦA ỨNG DỤNG ===

function setupEventListeners() {
    document.getElementById('categories-container')?.addEventListener('click', (e) => {
        const card = e.target.closest('.category-card');
        if (card) handleCategorySelect(card.dataset.categoryId);
    });
    document.getElementById('category-selection-container')?.addEventListener('click', (e) => {
        const card = e.target.closest('.category-card');
        if (card) handleActivitySelection(card.dataset.categoryId);
    });
    document.getElementById('current-flashcard')?.addEventListener('click', () => {
        document.getElementById('current-flashcard').classList.toggle('flipped');
    });
    document.getElementById('prev-card')?.addEventListener('click', () => navigateCard(-1));
    document.getElementById('next-card')?.addEventListener('click', () => navigateCard(1));
    
    const userMenuButton = document.getElementById('user-menu-button');
    const userMenu = document.getElementById('user-menu');
    if (userMenuButton && userMenu) {
        userMenuButton.addEventListener('click', function(event) {
            event.stopPropagation();
            userMenu.classList.toggle('hidden');
        });
        window.addEventListener('click', function() {
            if (!userMenu.classList.contains('hidden')) {
                userMenu.classList.add('hidden');
            }
        });
    }

    // SỬA LỖI: Thêm sự kiện cho các nút chọn độ khó của game Ghép Âm thanh
    document.getElementById('option-9-cards')?.addEventListener('click', () => {
        const { currentActivity, flashcards } = getState();
        if (currentActivity?.id === 4 && currentActivity.categoryId) {
            closeModal('gameOptionsModal');
            const categoryCards = flashcards.filter(c => c.categoryId === currentActivity.categoryId);
            startSoundMatchGame(categoryCards, 9);
        }
    });

    document.getElementById('option-12-cards')?.addEventListener('click', () => {
        const { currentActivity, flashcards } = getState();
        if (currentActivity?.id === 4 && currentActivity.categoryId) {
            closeModal('gameOptionsModal');
            const categoryCards = flashcards.filter(c => c.categoryId === currentActivity.categoryId);
            startSoundMatchGame(categoryCards, 12);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    runPeriodicVersionCheck();
    const savedLevel = localStorage.getItem('flashkids_currentLevel') || 'a1';

    setupEventListeners();
    updateUserProfileDisplay();
    changeLevel(savedLevel, false);

    loadGames();
    loadQuizTypes();
    loadBadges();

    // Gán các hàm ra `window` để HTML có thể gọi qua `onclick`
    window.changeLevel = changeLevel;
    window.changeTab = changeTab;
    window.navigateToFlashcardsTab = navigateToFlashcardsTab;
    window.speakCurrentWord = speakCurrentWord;
    window.filterByCategory = filterByCategory;
    window.startGame = startGame;
    window.startQuiz = startQuiz;
    window.closeModal = closeModal;
});
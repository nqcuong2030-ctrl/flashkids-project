// File: public/js/main.js
// Nhiệm vụ: "Nhạc trưởng" điều phối toàn bộ ứng dụng.

import { runPeriodicVersionCheck, fetchLevelData } from './api.js';
import { playSound, speakWord } from './audio.js';
import { GAMES_CONFIG, QUIZ_CONFIG } from './config.js';
import { loadCategories, updateFlashcard, updateUserProfileDisplay, openModal, closeModal, renderMasteryChart, updateCardCounter } from './dom.js';
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

        // Cập nhật giao diện
        loadCategories();
        updateFlashcard();
        
        // Cập nhật trạng thái active cho nút level
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
        renderMasteryChart(); // Vẽ biểu đồ khi vào tab thống kê
    }
}

function navigateToFlashcardsTab() {
    const { categories } = getState();
    // Mặc định chọn chủ đề đầu tiên khi chuyển tab
    setCurrentCategoryId(categories[0]?.id || null);
    setCurrentCardIndex(0);
    changeTab('flashcards');
    updateFlashcard();
}

function speakCurrentWord(language) {
    const card = getFilteredCards()[getState().currentCardIndex];
    if (!card) return;
    const wordToSpeak = language === 'english' ? card.english : card.vietnamese;
    const lang = language === 'english' ? 'en-US' : 'vi-VN';
    speakWord(wordToSpeak, lang);
}

function startGame(gameId) {
    playSound('click');
    setCurrentActivity({ type: 'game', id: gameId });
    openModal('categorySelectionModal');
    // Cập nhật modal chọn chủ đề với các chủ đề hiện tại
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
    closeModal('categorySelectionModal');
    const activity = getState().currentActivity;
    if (!activity) return;

    const allCards = getState().flashcards;
    const categoryCards = allCards.filter(c => c.categoryId === categoryId);

    if (activity.type === 'game') {
        switch (activity.id) {
            case 1: startMatchingGame(categoryCards, handleActivityEnd); break;
            case 2: startImageQuiz(allCards, categoryCards, handleActivityEnd); break;
            case 3: startFillBlankGame(categoryCards); break;
            case 4: startSoundMatchGame(categoryCards, 9); break;
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
    
    // Đóng tất cả các modal game/quiz
    document.querySelectorAll('.modal.show').forEach(modal => modal.classList.remove('show'));
    
    // Cập nhật lại UI chính
    updateUserProfileDisplay();
    loadCategories();
}


// === ĐIỂM KHỞI ĐẦU CỦA ỨNG DỤNG ===

function setupEventListeners() {
    // 1. Lắng nghe sự kiện click trên container của các chủ đề (Event Delegation)
    document.getElementById('categories-container')?.addEventListener('click', (e) => {
        const card = e.target.closest('.category-card');
        if (card) handleCategorySelect(card.dataset.categoryId);
    });

    // 2. Sự kiện lật thẻ
    document.getElementById('current-flashcard')?.addEventListener('click', () => {
        document.getElementById('current-flashcard').classList.toggle('flipped');
    });

    // 3. Sự kiện chuyển thẻ
    document.getElementById('prev-card')?.addEventListener('click', () => navigateCard(-1));
    document.getElementById('next-card')?.addEventListener('click', () => navigateCard(1));
    
    // 4. Sự kiện chọn chủ đề trong modal trước khi chơi game/quiz
    document.getElementById('category-selection-container')?.addEventListener('click', (e) => {
        const card = e.target.closest('.category-card');
        if (card) handleActivitySelection(card.dataset.categoryId);
    });
}


document.addEventListener('DOMContentLoaded', () => {
    runPeriodicVersionCheck();
    const savedLevel = localStorage.getItem('flashkids_currentLevel') || 'a1';

    // Khởi tạo và tải dữ liệu ban đầu
    setupEventListeners();
    updateUserProfileDisplay();
    changeLevel(savedLevel, false); // Tải dữ liệu cho level đã lưu

    // Gán các hàm ra `window` để HTML có thể gọi qua `onclick`
    window.changeLevel = changeLevel;
    window.changeTab = changeTab;
    window.navigateToFlashcardsTab = navigateToFlashcardsTab;
    window.speakCurrentWord = speakCurrentWord;
    window.startGame = startGame;
    window.startQuiz = startQuiz;
    window.closeModal = closeModal; // Cho phép các nút trong modal gọi hàm này
});
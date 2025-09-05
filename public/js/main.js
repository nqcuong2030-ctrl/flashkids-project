// public/js/main.js (PHIÊN BẢN CUỐI CÙNG, ĐẦY ĐỦ CHỨC NĂNG)

import { fetchLevelData } from './api.js';
import { playSound, speakWord } from './audio.js';
import { 
    loadCategories, renderFlashcards, updateUserProfileDisplay, 
    renderMasteryChart, showScreen
} from './dom.js';
import { 
    startMatchingGame, startImageQuiz, startFillBlankGame, startSoundMatchGame 
} from './games.js';
import { 
    startMultipleChoiceQuiz, startUnscrambleQuiz, startReadingQuiz 
} from './quiz.js';
import { 
    getState, setLevelData, setCurrentLevel, setCurrentCategoryId, 
    setCurrentCardIndex, saveUserProgress, addXp, setCurrentActivity,
    getUserProgress, getFilteredCards
} from './state.js';


// --- CÁC HÀM XỬ LÝ SỰ KIỆN CHÍNH (Được gọi từ HTML) ---

async function changeLevel(level, isUserAction = false) {
    if (isUserAction) playSound('click');
    setCurrentLevel(level);
    
    try {
        const data = await fetchLevelData(level, getState().flashcardCache);
        setLevelData(level, data);
        loadCategories();
        if (document.getElementById('stats').classList.contains('hidden') === false) {
            renderMasteryChart();
        }
        document.querySelectorAll('.level-badge').forEach(badge => {
            badge.classList.remove('active');
            if (badge.getAttribute('onclick').includes(`'${level}'`)) {
                badge.classList.add('active');
            }
        });
    } catch (error) {
        console.error("Không thể tải dữ liệu level:", error);
        alert("Lỗi kết nối, không thể tải dữ liệu.");
    }
}

function changeTab(tabId) {
    playSound('click');
    
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    const activeTabContent = document.getElementById(tabId);
    if (activeTabContent) activeTabContent.classList.remove('hidden');

    document.querySelectorAll('nav button').forEach(button => button.classList.remove('tab-active'));
    const activeButton = document.querySelector(`nav button[data-tab='${tabId}']`);
    if (activeButton) activeButton.classList.add('tab-active');

    if (tabId === 'stats') {
        renderMasteryChart();
    }
}

function navigateToFlashcardsTab() {
    changeTab('flashcards');
    setCurrentCategoryId(categories[0]?.id || null);
    setCurrentCardIndex(0);
    renderFlashcards();
}

// --- CÁC HÀM XỬ LÝ LOGIC PHỤ (Internal Handlers) ---

function handleCategorySelect(categoryId) {
    setCurrentCategoryId(categoryId);
    setCurrentCardIndex(0);
    changeTab('flashcards');
    renderFlashcards();
}

function navigateCard(direction) {
    playSound('click');
    const { currentCardIndex } = getState();
    const newIndex = currentCardIndex + direction;
    
    const filteredCards = getFilteredCards();
    if (newIndex >= 0 && newIndex < filteredCards.length) {
        setCurrentCardIndex(newIndex);
        renderFlashcards();
    }
}

// BỔ SUNG LẠI CÁC HÀM ĐIỀU KHIỂN GAME/QUIZ
function handleGameStart(gameId, categoryId) {
    setCurrentActivity({ type: 'game', id: gameId, categoryId: categoryId });
    
    const allCards = getState().flashcards;
    const categoryCards = allCards.filter(c => c.categoryId === categoryId);
    
    // Logic điều hướng đến modal game tương ứng
    switch (gameId) {
        case 1: startMatchingGame(categoryCards, handleActivityEnd); break;
        case 2: startImageQuiz(allCards, categoryCards, handleActivityEnd); break;
        case 3: startFillBlankGame(categoryCards); break;
        case 4: startSoundMatchGame(categoryCards, 9, handleActivityEnd); break;
        default: console.error(`Game ID ${gameId} chưa được triển khai.`);
    }
}

function handleQuizStart(quizId, categoryId) {
    setCurrentActivity({ type: 'quiz', id: quizId, categoryId: categoryId });
    
    const allCards = getState().flashcards;
    const categoryCards = allCards.filter(c => c.categoryId === categoryId);

    // Logic điều hướng đến modal quiz tương ứng
    switch (quizId) {
        case 1: startMultipleChoiceQuiz(allCards, categoryCards, handleActivityEnd); break;
        case 2: startUnscrambleQuiz(categoryCards); break;
        case 3: startReadingQuiz(allCards, categoryCards, handleActivityEnd); break;
        default: console.error(`Quiz ID ${quizId} chưa được triển khai.`);
    }
}

// Hàm callback được gọi khi một game/quiz kết thúc
function handleActivityEnd(completed, xpGained) {
    if (completed && xpGained > 0) {
        const leveledUp = addXp(xpGained);
        if (leveledUp) {
            alert(`🎉 Chúc mừng! Bạn đã đạt Level ${getUserProgress().userProfile.level}!`);
        }
    }
    
    saveUserProgress();
    updateUserProfileDisplay();
    setCurrentActivity(null);
    
    // Tự động đóng tất cả các modal đang mở
    document.querySelectorAll('.modal.show').forEach(modal => modal.classList.remove('show'));
    
    // Tải lại các category để cập nhật tiến độ
    loadCategories();
}

// --- THIẾT LẬP SỰ KIỆN BAN ĐẦU ---

function setupEventListeners() {
    const categoriesContainer = document.getElementById('categories-container');
    const flashcardContainer = document.getElementById('current-flashcard');
    const prevCardBtn = document.getElementById('prev-card');
    const nextCardBtn = document.getElementById('next-card');

    // Sự kiện chọn chủ đề ở trang chủ
    if (categoriesContainer) {
        categoriesContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.category-card');
            if (card) {
                handleCategorySelect(card.dataset.categoryId);
            }
        });
    }

    // Sự kiện lật thẻ
    if (flashcardContainer) {
        flashcardContainer.addEventListener('click', () => {
            const card = getFilteredCards()[getState().currentCardIndex];
            if(card) {
                flashcardContainer.classList.toggle('flipped');
                const langToSpeak = flashcardContainer.classList.contains('flipped') ? 'vi-VN' : 'en-US';
                const wordToSpeak = flashcardContainer.classList.contains('flipped') ? card.vietnamese : card.english;
                speakWord(wordToSpeak, langToSpeak);
            }
        });
    }
    
    // Sự kiện chuyển thẻ
    if (prevCardBtn) prevCardBtn.addEventListener('click', () => navigateCard(-1));
    if (nextCardBtn) nextCardBtn.addEventListener('click', () => navigateCard(1));

    // Sự kiện chọn chủ đề trước khi chơi game/quiz
    const categorySelectionContainer = document.getElementById('category-selection-container');
    if (categorySelectionContainer) {
        categorySelectionContainer.addEventListener('click', e => {
            const categoryCard = e.target.closest('.category-card');
            if(categoryCard) {
                const categoryId = categoryCard.dataset.categoryId;
                const activity = getState().currentActivity;
                if (activity.type === 'game') {
                    handleGameStart(activity.id, categoryId);
                } else if (activity.type === 'quiz') {
                    handleQuizStart(activity.id, categoryId);
                }
            }
        });
    }
}

// --- ĐIỂM KHỞI ĐẦU CỦA ỨNG DỤNG ---
document.addEventListener('DOMContentLoaded', () => {
    const savedLevel = localStorage.getItem('flashkids_currentLevel') || 'a1';
    
    setupEventListeners();
    updateUserProfileDisplay();
    changeLevel(savedLevel, false);

    // Gán các hàm xử lý ra window để HTML có thể gọi qua onclick
    window.changeLevel = changeLevel;
    window.changeTab = changeTab;
    window.navigateToFlashcardsTab = navigateToFlashcardsTab;
    // ... Thêm các hàm cần gọi từ onclick khác nếu có ...
});
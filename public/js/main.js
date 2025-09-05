// public/js/main.js
// Đây là tệp "nhạc trưởng", điều phối toàn bộ ứng dụng.

import { fetchLevelData } from './api.js';
import { playSound, speakWord } from './audio.js';
import { 
    loadCategories, renderFlashcards, updateUserProfileDisplay, 
    renderMasteryChart, showScreen, renderGameScreen, renderQuizScreen 
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

// --- KHỞI TẠO & THIẾT LẬP SỰ KIỆN ---

function setupEventListeners() {
    const levelSelect = document.getElementById('level-select');
    const categoryList = document.getElementById('category-list');
    const flashcardContainer = document.getElementById('flashcard-container');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const backToCategoriesBtn = document.getElementById('back-to-categories-btn');
    const gamesBtn = document.getElementById('games-btn');
    const quizzesBtn = document.getElementById('quizzes-btn');
    const gameList = document.getElementById('game-list');
    const quizList = document.getElementById('quiz-list');
    
    levelSelect.addEventListener('change', handleLevelChange);

    // Sử dụng event delegation cho danh sách category để tối ưu
    categoryList.addEventListener('click', (e) => {
        const card = e.target.closest('.category-card');
        if (card) {
            handleCategorySelect(card.dataset.categoryId);
        }
    });

    flashcardContainer.addEventListener('click', () => {
        const card = getFilteredCards()[getState().currentCardIndex];
        if (card) {
            flashcardContainer.classList.toggle('flipped');
            const langToSpeak = flashcardContainer.classList.contains('flipped') ? 'vi-VN' : 'en-US';
            const wordToSpeak = flashcardContainer.classList.contains('flipped') ? card.meaning : card.word;
            speakWord(wordToSpeak, langToSpeak);
        }
    });

    prevBtn.addEventListener('click', () => navigateCard(-1));
    nextBtn.addEventListener('click', () => navigateCard(1));
    backToCategoriesBtn.addEventListener('click', handleBackToCategories);

    gamesBtn.addEventListener('click', () => toggleActivityList('games'));
    quizzesBtn.addEventListener('click', () => toggleActivityList('quizzes'));

    // Event delegation cho danh sách game và quiz
    gameList.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button) {
            handleGameStart(parseInt(button.dataset.gameId));
        }
    });
    quizList.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button) {
            handleQuizStart(parseInt(button.dataset.quizId));
        }
    });

    // Event delegation cho nút thoát game/quiz (gắn vào body)
    document.body.addEventListener('click', (e) => {
        if (e.target.id === 'close-game-btn' || e.target.id === 'close-quiz-btn') {
            handleActivityEnd(false, 0); // Kết thúc mà không có thưởng
        }
    });
}

// --- CÁC HÀM XỬ LÝ SỰ KIỆN (CONTROLLERS) ---

async function handleLevelChange(e) {
    const newLevel = e ? e.target.value : 'a1';
    setCurrentLevel(newLevel);
    
    try {
        const data = await fetchLevelData(newLevel, getState().flashcardCache);
        setLevelData(newLevel, data);
        loadCategories();
        renderMasteryChart();
        document.getElementById('level-select').value = newLevel;
    } catch (error) {
        console.error("Không thể tải dữ liệu level:", error);
        alert("Lỗi kết nối, không thể tải dữ liệu. Vui lòng thử lại.");
    }
}

function handleCategorySelect(categoryId) {
    playSound('click');
    setCurrentCategoryId(categoryId);
    document.getElementById('category-view').classList.add('hidden');
    document.getElementById('flashcard-view').classList.remove('hidden');
    renderFlashcards();
}

function handleBackToCategories() {
    playSound('click');
    setCurrentCategoryId(null);
    document.getElementById('category-view').classList.remove('hidden');
    document.getElementById('flashcard-view').classList.add('hidden');
    loadCategories(); // Tải lại để cập nhật tiến độ
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

function toggleActivityList(type) {
    playSound('click');
    const gameList = document.getElementById('game-list');
    const quizList = document.getElementById('quiz-list');
    
    if (type === 'games') {
        gameList.classList.toggle('hidden');
        quizList.classList.add('hidden');
    } else {
        quizList.classList.toggle('hidden');
        gameList.classList.add('hidden');
    }
}

function handleGameStart(gameId) {
    const categoryId = getState().currentCategoryId;
    if (!categoryId) {
        alert("Vui lòng chọn một chủ đề trước khi chơi game!");
        return;
    }
    
    setCurrentActivity({ type: 'game', id: gameId, categoryId });
    showScreen('game');
    renderGameScreen(gameId);
    
    const allCards = getState().flashcards;
    const categoryCards = getFilteredCards();
    
    switch (gameId) {
        case 1:
            startMatchingGame(categoryCards, handleActivityEnd);
            break;
        case 2:
            startImageQuiz(allCards, categoryCards, handleActivityEnd);
            break;
        case 3:
            startFillBlankGame(categoryCards); // Chế độ chơi liên tục
            break;
        case 4:
            startSoundMatchGame(categoryCards, 9, handleActivityEnd); // 9 thẻ, có thể thoát
            break;
        default:
            console.error(`Game ID ${gameId} chưa được triển khai.`);
            handleActivityEnd(false, 0);
    }
}

function handleQuizStart(quizId) {
    const categoryId = getState().currentCategoryId;
    const category = getState().categories.find(c => c.id === categoryId);
    if (!categoryId || !category) {
        alert("Vui lòng chọn một chủ đề trước khi làm quiz!");
        return;
    }
    
    setCurrentActivity({ type: 'quiz', id: quizId, categoryId });
    showScreen('quiz');
    renderQuizScreen(quizId, category.name);
    
    const allCards = getState().flashcards;
    const categoryCards = getFilteredCards();
    
    switch (quizId) {
        case 1:
            startMultipleChoiceQuiz(allCards, categoryCards, handleActivityEnd);
            break;
        case 2:
            startUnscrambleQuiz(categoryCards); // Chế độ chơi liên tục
            break;
        case 3:
            const allCardsWithSentence = allCards.filter(c => c.example);
            startReadingQuiz(allCardsWithSentence, categoryCards, handleActivityEnd);
            break;
        default:
            console.error(`Quiz ID ${quizId} chưa được triển khai.`);
            handleActivityEnd(false, 0);
    }
}

// Đây là hàm callback, được truyền vào các game/quiz
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
    showScreen('main');
    renderFlashcards(); // Cập nhật lại thẻ từ vựng để hiển thị độ thông thạo mới
    loadCategories();   // Cập nhật lại tiến độ ở màn hình chính
}


// --- ĐIỂM KHỞI ĐẦU CỦA ỨNG DỤNG ---
document.addEventListener('DOMContentLoaded', () => {
    // Lấy level đã lưu hoặc dùng mặc định
    const savedLevel = localStorage.getItem('flashkids_currentLevel') || 'a1';
    document.getElementById('level-select').value = savedLevel;
    
    // Khởi tạo các thành phần
    setupEventListeners();
    updateUserProfileDisplay();
    
    // Tải dữ liệu ban đầu cho ứng dụng
    handleLevelChange({ target: { value: savedLevel } });
});
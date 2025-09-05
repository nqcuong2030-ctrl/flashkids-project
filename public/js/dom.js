// public/js/dom.js
import { getState, getUserProgress, getFilteredCards } from './state.js';
import { CATEGORY_COLORS, GAMES_CONFIG, QUIZ_CONFIG } from './config.js';

// Cache các element DOM thường xuyên sử dụng để tối ưu hiệu năng
const domCache = {
    loadingOverlay: document.getElementById('loading-overlay'),
    levelSelect: document.getElementById('level-select'),
    categoryList: document.getElementById('category-list'),
    flashcardContainer: document.getElementById('flashcard-container'),
    progressBar: document.getElementById('progress-bar'),
    progressText: document.getElementById('progress-text'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    cardFront: document.getElementById('card-front'),
    cardBack: document.getElementById('card-back'),
    mainContent: document.getElementById('main-content'),
    gameContent: document.getElementById('game-content'),
    quizContent: document.getElementById('quiz-content'),
    userProfileName: document.getElementById('user-profile-name'),
    userProfileAvatar: document.getElementById('user-profile-avatar'),
    userLevel: document.getElementById('user-level'),
    userXp: document.getElementById('user-xp'),
    masteryChartCanvas: document.getElementById('mastery-chart'),
    // Thêm các element khác vào đây nếu cần
};

let masteryChart = null; // Biến để lưu trữ instance của Chart.js

// --- HIỂN THỊ CHUNG ---
export function showLoading() {
    domCache.loadingOverlay.classList.remove('hidden');
}

export function hideLoading() {
    domCache.loadingOverlay.classList.add('hidden');
}

// --- RENDER GIAO DIỆN CHÍNH ---
export function loadCategories() {
    const { categories, currentLevel } = getState();
    const progress = getUserProgress();
    domCache.categoryList.innerHTML = '';
    
    categories.forEach((category, index) => {
        const progressPercent = progress.categories[`${currentLevel}_${category.id}`] || 0;
        const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
        const categoryElement = document.createElement('div');
        categoryElement.className = `category-card bg-gradient-to-br ${color} p-4 rounded-lg shadow-lg text-white cursor-pointer transform hover:scale-105 transition-transform duration-300`;
        categoryElement.dataset.categoryId = category.id;
        categoryElement.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <h3 class="font-bold text-lg">${category.name}</h3>
                <span class="text-sm font-semibold">${category.wordCount} từ</span>
            </div>
            <div class="w-full bg-white/20 rounded-full h-2.5">
                <div class="bg-white h-2.5 rounded-full" style="width: ${progressPercent}%"></div>
            </div>
            <p class="text-right text-xs mt-1">${progressPercent}%</p>
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
    if (!card) {
        domCache.flashcardContainer.innerHTML = `<div class="text-center p-8 text-gray-500">Không có từ vựng nào trong chủ đề này.</div>`;
        return;
    }
    const progress = getUserProgress();
    const masteryScore = progress.masteryScores[card.id] || 0;
    
    domCache.cardFront.innerHTML = `<div class="text-5xl font-bold">${card.word}</div><div class="text-xl text-gray-500 mt-2">${card.ipa || ''}</div>`;
    domCache.cardBack.innerHTML = `
        <div class="text-3xl font-bold text-blue-600">${card.meaning}</div>
        <div class="mt-2 text-gray-600">${card.example || ''}</div>
        <div class="absolute bottom-4 right-4 text-xs font-semibold text-gray-400">Độ thông thạo: ${masteryScore}/3</div>
    `;
    domCache.flashcardContainer.classList.remove('flipped');
}

export function updateProgressBar() {
    const { currentCardIndex } = getState();
    const filteredCards = getFilteredCards();
    const total = filteredCards.length;

    if (total === 0) {
        domCache.progressText.textContent = '0/0';
        domCache.progressBar.style.width = '0%';
        return;
    }

    const progressPercent = ((currentCardIndex + 1) / total) * 100;
    domCache.progressBar.style.width = `${progressPercent}%`;
    domCache.progressText.textContent = `${currentCardIndex + 1}/${total}`;
    domCache.prevBtn.disabled = currentCardIndex === 0;
    domCache.nextBtn.disabled = currentCardIndex === total - 1;
}

export function updateUserProfileDisplay() {
    const { userProfile } = getUserProgress();
    domCache.userProfileName.textContent = userProfile.username;
    domCache.userProfileAvatar.src = userProfile.avatar;
    domCache.userLevel.textContent = `Level ${userProfile.level}`;
    domCache.userXp.textContent = `${userProfile.xp}/${userProfile.xpToNextLevel} XP`;
}

// --- CHUYỂN ĐỔI GIAO DIỆN ---
export function showScreen(screen) { // 'main', 'game', 'quiz'
    domCache.mainContent.classList.toggle('hidden', screen !== 'main');
    domCache.gameContent.classList.toggle('hidden', screen !== 'game');
    domCache.quizContent.classList.toggle('hidden', screen !== 'quiz');
}

// --- RENDER GAME & QUIZ ---
export function renderGameScreen(gameId) {
    const game = GAMES_CONFIG.find(g => g.id === gameId);
    domCache.gameContent.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-lg">
            <div class="flex justify-between items-center mb-4">
                 <h2 class="text-2xl font-bold text-gray-800">${game.name}</h2>
                 <button id="close-game-btn" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Thoát</button>
            </div>
            <div id="game-container" class="mt-4"></div>
        </div>
    `;
}

export function renderQuizScreen(quizId, categoryName) {
    const quiz = QUIZ_CONFIG.find(q => q.id === quizId);
     domCache.quizContent.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-lg">
             <div class="flex justify-between items-center mb-4">
                 <h2 class="text-2xl font-bold text-gray-800">${quiz.name} - ${categoryName}</h2>
                 <button id="close-quiz-btn" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Thoát</button>
            </div>
            <div id="quiz-container" class="mt-4"></div>
        </div>
    `;
}

// --- CHART & MODALS ---
export function renderMasteryChart() {
    const { flashcards } = getState();
    const progress = getUserProgress();
    const masteryLevels = [0, 0, 0, 0]; // 0, 1, 2, 3+

    flashcards.forEach(card => {
        const score = progress.masteryScores[card.id] || 0;
        if (score === 0) masteryLevels[0]++;
        else if (score === 1) masteryLevels[1]++;
        else if (score === 2) masteryLevels[2]++;
        else masteryLevels[3]++;
    });

    const chartData = {
        labels: ['Chưa học', 'Đang học', 'Ghi nhớ', 'Thông thạo'],
        datasets: [{
            label: 'Số lượng từ',
            data: masteryLevels,
            backgroundColor: ['#e5e7eb', '#93c5fd', '#60a5fa', '#2563eb']
        }]
    };
    if (masteryChart) {
        masteryChart.data = chartData;
        masteryChart.update();
    } else {
        masteryChart = new Chart(domCache.masteryChartCanvas, {
            type: 'doughnut',
            data: chartData,
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

export function pruneAudioCache(targetSizeMB = 50) {
    console.warn(`LocalStorage đầy! Đang tiến hành xóa ${itemsToRemove} file âm thanh cũ nhất...`);
	
	// 1. Lấy tất cả các khóa (key) của audio trong localStorage
	const audioKeys = Object.keys(localStorage).filter(key => key.startsWith('audio_'));

	if (audioKeys.length < itemsToRemove) {
		console.error("Không đủ file âm thanh trong cache để xóa.");
		return;
	}

	// 2. Lấy thời gian lưu của từng file
	const timedKeys = audioKeys.map(key => {
		try {
			const item = JSON.parse(localStorage.getItem(key));
			// Trả về một đối tượng chứa key và timestamp
			return { key: key, timestamp: item.timestamp || 0 };
		} catch (e) {
			return { key: key, timestamp: 0 }; // Xử lý nếu dữ liệu bị lỗi
		}
	});

	// 3. Sắp xếp các file theo thời gian, cũ nhất đứng đầu
	timedKeys.sort((a, b) => a.timestamp - b.timestamp);
	
	// 4. Lấy 50 file cũ nhất để xóa
	const keysToRemove = timedKeys.slice(0, itemsToRemove);
	
	// 5. Xóa các file đó khỏi localStorage
	keysToRemove.forEach(item => {
		console.log(`Đang xóa cache cũ: ${item.key}`);
		localStorage.removeItem(item.key);
	});
}
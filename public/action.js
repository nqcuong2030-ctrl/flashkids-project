// ===================================================================================
// ===== 1. KHAI BÁO BIẾN TOÀN CỤC & HẰNG SỐ
// ===================================================================================

// Trạng thái ứng dụng
let categories = [];
let flashcards = [];
let flashcardCache = {};
let isCardInteractable = true;
let currentCategoryId = null;
let currentCardIndex = 0;
let soundEnabled = true;
let isFlashcardsTabActive = false;
let currentLevel = 'a1'; // Default level is A1
let lastFlipState = false; // Track the last flip state to determine which side is showing
let currentActivity = null; // Track current activity (game or quiz)

// Trạng thái game "Ghép từ"
let selectedEnglishWord = null;
let selectedVietnameseWord = null;
let matchedPairs = [];

// Trạng thái game "Chọn từ"
let imageQuizQuestions = [];
let currentImageQuizQuestionIndex = 0;
let imageQuizScore = 0;

// Trạng thái game "Xếp chữ"
let unscrambleTargetWord = '';
let unscrambleTargetWordId = null;
let unscrambleWordPool = [];

// Trạng thái game "Ghép Âm thanh & Từ"
let selectedMatchCards = [];
let isCheckingMatch = false;
let soundMatchWordPool = [];

// Trạng thái game "Điền từ"
let fillBlankTargetWord = '';
let fillBlankWordPool = [];
let fillBlankCurrentWord = null;
let fillBlankMissingLetters = [];

// Đồng hồ đếm ngược
let dailyTimerInterval = null;
let timeRemaining = 600; // 10 phút = 600 giây
let isTimerRunning = false;
let flashcardActivityTimeout = null;
const INACTIVITY_DELAY = 10000; // 10 giây

// Dữ liệu tĩnh
const categoryColors = [
    'from-blue-400 to-blue-600', 'from-purple-400 to-purple-600', 'from-pink-400 to-pink-600',
    'from-green-400 to-green-600', 'from-yellow-400 to-yellow-600', 'from-red-400 to-red-600',
    'from-indigo-400 to-indigo-600', 'from-teal-400 to-teal-600', 'from-orange-400 to-orange-600',
    'from-cyan-400 to-cyan-600', 'from-lime-400 to-lime-600', 'from-amber-400 to-amber-600',
    'from-emerald-400 to-emerald-600', 'from-fuchsia-400 to-fuchsia-600', 'from-rose-400 to-rose-600',
    'from-sky-400 to-sky-600', 'from-violet-400 to-violet-600'
];

const games = [
    { id: 1, name: 'Ghép từ', description: 'Ghép từ tiếng Anh với nghĩa tiếng Việt tương ứng', difficulty: 'Dễ', color: 'blue', icon: 'puzzle' },
    { id: 2, name: 'Chọn từ', description: 'Chọn từ vựng tương ứng với hình ảnh minh họa', difficulty: 'Trung bình', color: 'purple', icon: 'image' },
    { id: 4, name: 'Ghép Âm thanh & Từ', description: 'Lắng nghe và ghép cặp âm thanh với từ vựng đúng', difficulty: 'Trung bình', color: 'lime', icon: 'volume-up' },
    { id: 3, name: 'Điền từ', description: 'Chọn chữ cái đúng để hoàn thành từ', difficulty: 'Khó', color: 'red', icon: 'question' }
];

const quizTypes = [
    { id: 1, name: 'Trắc nghiệm', description: 'Chọn đáp án đúng cho từng câu hỏi', time: 10, difficulty: 3, icon: 'document' },
    { id: 2, name: 'Xếp chữ', description: 'Sắp xếp các chữ cái thành từ đúng', time: 5, difficulty: 4, icon: 'question' }
];

const badges = [
    { id: 1, name: 'Siêu sao', description: 'Học 7 ngày liên tục', achieved: true, icon: 'star', color: 'yellow' },
    { id: 2, name: 'Nhà từ vựng', description: 'Học 100 từ mới', achieved: true, icon: 'badge', color: 'green' },
    { id: 3, name: 'Học sinh giỏi', description: 'Hoàn thành 5 bài kiểm tra', achieved: true, icon: 'book', color: 'blue' },
    { id: 4, name: 'Chuyên gia', description: 'Hoàn thành 10 bài kiểm tra', achieved: false, progress: '5/10', icon: 'play', color: 'gray' }
];

const userData = {
    level: 2, xp: 65, xpToNextLevel: 100, wordsLearned: 85, studyTime: 120, streakDays: 7
};


// ===================================================================================
// ===== 2. KHỞI TẠO ỨNG DỤNG
// ===================================================================================

document.addEventListener('DOMContentLoaded', function() {
	// Tải cấp độ đã được lưu lần trước từ localStorage
	const savedLevel = localStorage.getItem('flashkids_currentLevel');
	if (savedLevel) {
		currentLevel = savedLevel;
	}
	
	// Initialize user progress from localStorage
	initUserProgress();
	changeLevel(currentLevel);
	
	// Set up flashcard click event
	document.getElementById('current-flashcard').addEventListener('click', function() {
		if (!isCardInteractable) return; // <-- Thêm dòng kiểm tra này

		const wasFlipped = this.classList.contains('flipped');
		this.classList.toggle('flipped');
		lastFlipState = !wasFlipped;
		
		if (isFlashcardsTabActive && soundEnabled) {
			setTimeout(() => {
				if (!wasFlipped) {
					speakCurrentWord('vietnamese');
				} else {
					speakCurrentWord('english');
				}
			}, 100);
		}
	});

	// Set up navigation buttons
	document.getElementById('prev-card').addEventListener('click', previousCard);
	document.getElementById('next-card').addEventListener('click', nextCard);

	// Set up sound toggle
	document.getElementById('sound-toggle').addEventListener('change', function() {
		soundEnabled = this.checked;
		saveAppSettings();
	});
	
	document.getElementById('toggle-timer-btn').addEventListener('click', toggleTimer);
	updateTimerDisplay(); // Hiển thị thời gian ban đầu
	
	document.querySelectorAll('.modal').forEach(modal => {
		modal.addEventListener('click', function(event) {
			// Kiểm tra xem phần tử được bấm có phải là chính lớp nền modal hay không
			if (event.target === this) {
				closeModal(this.id);
			}
		});
	});
	
	// Load other UI elements
	loadGames();
	loadQuizTypes();
	loadBadges();
	updateUserStats();
});


// ===================================================================================
// ===== 3. QUẢN LÝ DỮ LIỆU & CACHE
// ===================================================================================

// Load data for a specific level
// Hàm này sẽ được gọi để tải dữ liệu cho một level cụ thể
// Nó sẽ kiểm tra localStorage trước, nếu không có mới fetch từ server
async function loadLevelData(level) {
	// 1. Kiểm tra cache trong bộ nhớ trước
	if (flashcardCache[level]) {
		console.log(`Loading ${level} from memory cache.`);
		return flashcardCache[level];
	}

	// 2. Kiểm tra localStorage
	const savedData = localStorage.getItem(`flashkids_level_${level}`);
	if (savedData) {
		console.log(`Loading ${level} from localStorage.`);
		const parsedData = JSON.parse(savedData);
		flashcardCache[level] = parsedData; // Lưu vào cache bộ nhớ
		return parsedData;
	}

	// 3. Nếu không có, tải từ server
	console.log(`Fetching ${level} from server...`);
	showLoading();
	try {
		const response = await fetch(`/.netlify/functions/get-words?level=${level}`);
		if (!response.ok) {
			throw new Error(`Không thể tải dữ liệu cho level ${level}`);
		}
		const data = await response.json();

		// Lưu vào localStorage và cache bộ nhớ
		localStorage.setItem(`flashkids_level_${level}`, JSON.stringify(data));
		flashcardCache[level] = data;

		return data;
	} finally {
		hideLoading();
	}
}

function pruneAudioCache(itemsToRemove = 50) {
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


// ===================================================================================
// ===== 4. ÂM THANH & PHÁT ÂM
// ===================================================================================

const soundEffects = {
	click: new Audio('https://cdn.pixabay.com/download/audio/2025/07/31/audio_ebc800c9bc.mp3?filename=button-press-click-tap-video-game-main-menu-select-382948.mp3'),
	success: new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_e8b2fa25cf.mp3?filename=goodresult-82807.mp3'),
	success_2: new Audio('https://cdn.pixabay.com/download/audio/2021/08/09/audio_61f5e6ef48.mp3?filename=news-ting-6832.mp3'),
	fail: new Audio('https://cdn.pixabay.com/download/audio/2022/03/10/audio_8b0fae46ef.mp3?filename=wrong-47985.mp3'),
	error: new Audio('https://cdn.pixabay.com/download/audio/2024/08/23/audio_703f9da0e1.mp3?filename=fail-234710.mp3'),			
	tada: new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_473a42432c.mp3?filename=tada-fanfare-a-6313.mp3')
};

function playSound(soundName) {
	if (soundEnabled && soundEffects[soundName]) {
		soundEffects[soundName].currentTime = 0; // Tua về đầu để có thể phát lại ngay
		soundEffects[soundName].play();
	}
}

// Hàm dự phòng, dùng giọng đọc của trình duyệt
function speakWordDefault(word, lang) {
    if ('speechSynthesis' in window && soundEnabled) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = lang;
        disableCardControls();
        utterance.onend = enableCardControls;
        utterance.onerror = (e) => {
            console.error("SpeechSynthesis Error:", e);
            enableCardControls();
        };
        window.speechSynthesis.speak(utterance);
    }
}

// Hàm mới gọi đến Netlify Function
function speakWord(word, lang) {
	const cacheKey = `audio_${lang}_${word.toLowerCase()}`;
	const cachedItem = localStorage.getItem(cacheKey);
	
	// 1. Kiểm tra cache
	if (cachedItem) {
		try {
			const data = JSON.parse(cachedItem);
			console.log(`Đang phát âm thanh cho từ '${word}' từ cache.`);
			const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
			
			disableCardControls();
			audio.addEventListener('ended', enableCardControls);
			audio.addEventListener('error', enableCardControls);
			audio.play();
			return;
		} catch (e) {
			// Nếu dữ liệu trong cache bị lỗi, hãy xóa nó đi
			localStorage.removeItem(cacheKey);
		}
	}

	// 2. Nếu không có trong cache, gọi API
	console.log(`Đang tải âm thanh cho từ '${word}' từ server.`);
	fetch(`/.netlify/functions/text-to-speech?text=${encodeURIComponent(word)}&lang=${lang}`)
		.then(response => response.json())
		.then(data => {
			if (data.audioContent) {
				// Tạo một đối tượng để lưu trữ, bao gồm cả timestamp
				const itemToCache = {
					audioContent: data.audioContent,
					timestamp: Date.now() // Lưu thời gian hiện tại
				};

				// 3. Cố gắng lưu vào localStorage
				try {
					localStorage.setItem(cacheKey, JSON.stringify(itemToCache));
				} catch (e) {
					// 4. Nếu thất bại (do đầy bộ nhớ), hãy dọn dẹp và thử lại
					if (e.name === 'QuotaExceededError') {
						pruneAudioCache(50); // Gọi hàm dọn dẹp
						try {
							// Thử lưu lại một lần nữa
							localStorage.setItem(cacheKey, JSON.stringify(itemToCache));
						} catch (e2) {
							console.error("Vẫn không thể lưu cache sau khi đã dọn dẹp.", e2);
						}
					} else {
						console.error("Lỗi khi lưu cache âm thanh.", e);
					}
				}

				// Phát âm thanh vừa tải về
				const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
				disableCardControls();
				audio.addEventListener('ended', enableCardControls);
				audio.addEventListener('error', enableCardControls);
				audio.play();
			} else {
				console.error('Lỗi từ Netlify Function:', data);
				speakWordDefault(word, lang);
			}
		})
		.catch(error => {
			console.error('Lỗi khi gọi Netlify Function:', error);
			speakWordDefault(word, lang);
		});
}


// ===================================================================================
// ===== 5. ĐIỀU HƯỚNG & GIAO DIỆN CHÍNH
// ===================================================================================

// Hàm changeLevel giờ chỉ cần gọi các hàm khác sau khi có dữ liệu
async function changeLevel(level, isUserAction = false) { 
	if (isUserAction) {
        playSound('click'); // Chỉ phát âm thanh nếu đây là hành động của người dùng
    }
	
	currentLevel = level;

	document.getElementById('current-level-display').textContent = `Level ${level.toUpperCase()}`;
	localStorage.setItem('flashkids_currentLevel', level);
	updateLevelBadges(level);

	try {
		const data = await loadLevelData(level);
		// Gán dữ liệu đã được lọc sẵn cho level này
		categories = data.categories || [];
		flashcards = data.flashcards || [];

		// Cập nhật giao diện
		currentCategoryId = null;
		currentCardIndex = 0;
		loadCategories(); // Không cần truyền tham số
		loadCategoryFilters(); // Không cần truyền tham số
		updateFlashcard();
		updateCardCounter();
	} catch (error) {
		console.error("Failed to change level:", error);
		alert(error.message);
	}
}

// Tab navigation
function changeTab(tabId) {
	playSound('click'); // <-- Thêm âm thanh khi nhấn
	
	// Ẩn tất cả nội dung tab
	document.querySelectorAll('.tab-content').forEach(tab => {
		tab.classList.add('hidden');
	});
	
	// Hiển thị nội dung tab được chọn
	document.getElementById(tabId).classList.remove('hidden');
	
	// Cập nhật kiểu cho nút tab đang hoạt động
	document.querySelectorAll('nav button').forEach(button => {
		button.classList.remove('tab-active');
	});
	const activeButton = Array.from(document.querySelectorAll('nav button')).find(button => {
		return button.getAttribute('onclick') === `changeTab('${tabId}')`;
	});
	if (activeButton) {
		activeButton.classList.add('tab-active');
	}

	isFlashcardsTabActive = (tabId === 'flashcards');

	// === PHẦN SỬA LỖI ===
	if (isFlashcardsTabActive) {
		// Bắt đầu đếm ngược khi người dùng vào tab thẻ từ vựng
		startDailyTimer(); 
	} else if (tabId !== 'games' && tabId !== 'quiz') {
		// Tạm dừng đồng hồ nếu chuyển sang các tab không phải học tập
		if (isTimerRunning) {
			pauseDailyTimer();
		}
	}
	// ======================
	
	// Cập nhật flashcard nếu chuyển sang tab flashcards
	if (isFlashcardsTabActive) {
		updateFlashcard();
		if (soundEnabled) {
			setTimeout(() => {
				speakCurrentWord('english');
			}, 300);
		}
	}
	
	// Cập nhật hiển thị tiến độ nếu chuyển sang tab thống kê
	if (tabId === 'stats') {
		updateCategoryProgressDisplay();
	}
}

function updateMarkLearnedButton(wordId) {
	const progress = getUserProgress();
	const button = document.getElementById('mark-learned-btn');
	
	if (progress.completedWords[wordId]) {
		button.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
				<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
			</svg>
			Đã học
		`;
		button.disabled = true;
		button.classList.remove('btn-success');
		button.classList.add('bg-gray-400');
	} else {
		button.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
				<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
			</svg>
			Đánh dấu đã học
		`;
		button.disabled = false;
		button.classList.remove('bg-gray-400');
		button.classList.add('btn-success');
	}
}

// ===================================================================================
// ===== 6. LOGIC THẺ TỪ VỰNG (FLASHCARDS)
// ===================================================================================

function updateFlashcard() {
	const filteredCards = getFilteredCards();
			
	if (filteredCards.length === 0) {
		document.getElementById('english-word').textContent = 'Không có từ vựng';
		document.getElementById('vietnamese-word').textContent = 'Không có từ vựng';
		document.getElementById('phonetic-text').textContent = '';
		document.getElementById('card-image').innerHTML = '';
		updateCardCounter();
		return;
	}
	
	const card = filteredCards[currentCardIndex];
	
	// --- Cập nhật mặt trước của thẻ (không đổi) ---
	document.getElementById('english-word').textContent = card.english;
	document.getElementById('phonetic-text').textContent = card.phonetic || `/ˈsæmpəl/`;
	
	// --- Cập nhật mặt sau của thẻ (LOGIC MỚI) ---
	const vietnameseWordEl = document.getElementById('vietnamese-word');
	const cardImageEl = document.getElementById('card-image');
	const flashcardBackEl = document.querySelector('.flashcard-back');

	// Luôn đặt nghĩa tiếng Việt (quan trọng cho chức năng đọc)
	vietnameseWordEl.textContent = card.vietnamese;

	// Kiểm tra xem 'image' có phải là một URL không
	if (card.image && (card.image.startsWith('http') || card.image.startsWith('https'))) {
		// NẾU LÀ URL: Hiển thị ảnh và ẩn chữ tiếng Việt
		vietnameseWordEl.classList.add('hidden');
		 // Thay đổi layout của mặt sau để chứa ảnh
		flashcardBackEl.classList.add('no-padding');
		flashcardBackEl.classList.remove('justify-center'); // Bỏ căn giữa dọc

		// Cho vùng chứa ảnh chiếm toàn bộ chiều cao và bỏ margin
		cardImageEl.classList.add('h-full');
		cardImageEl.classList.remove('mb-4');
		
		// Hiển thị ảnh
		cardImageEl.innerHTML = `<img src="${card.image}" alt="${card.english}" class="w-full h-full object-contain">`; 
	} else {
		// NẾU KHÔNG PHẢI URL: Hiển thị chữ tiếng Việt và icon (nếu có)
		vietnameseWordEl.classList.remove('hidden');
		// Trả lại layout căn giữa mặc định
		flashcardBackEl.classList.remove('no-padding');
		flashcardBackEl.classList.add('justify-center'); // Thêm lại căn giữa dọc

		// Trả lại kích thước và margin cho vùng chứa icon
		cardImageEl.classList.remove('h-full');
		cardImageEl.classList.add('mb-4');
		
		// Hiển thị icon
		cardImageEl.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-600 hidden" viewBox="0 0 20 20" fill="currentColor">
				${getImageIcon(card.image)}
			</svg>
		`;
	}
	
	// Đặt lại trạng thái lật thẻ
	document.getElementById('current-flashcard').classList.remove('flipped');
	lastFlipState = false;
	
	// Cập nhật trạng thái nút "Đánh dấu đã học"
	updateMarkLearnedButton(card.id);
	
	// Cập nhật bộ đếm thẻ
	updateCardCounter();
	
	// Tự động đọc từ tiếng Anh khi hiển thị thẻ mới - tốc độ lật thẻ
	if (isFlashcardsTabActive && soundEnabled) {
		setTimeout(() => {
			speakWord(card.english, 'en-US');
		}, 100);
	}
}

// Flashcard functions
function speakCurrentWord(language) {
	const filteredCards = getFilteredCards();
		
	if (filteredCards.length === 0) return;
	
	const card = filteredCards[currentCardIndex];
	
	if (language === 'english') {
		speakWord(card.english, 'en-US');
	} else if (language === 'vietnamese') {
		speakWord(card.vietnamese, 'vi-VN');
	}
	
	// Prevent the card from flipping when clicking the speak button
	if (event) {
		event.stopPropagation();
	}
}

function nextCard() {
	// Khi người dùng tương tác, nếu đang ở tab flashcard và còn thời gian, hãy khởi động đồng hồ
	if (isFlashcardsTabActive && timeRemaining > 0) {
		startDailyTimer();
	}

	const filteredCards = getFilteredCards();
	if (filteredCards.length === 0) return;

	currentCardIndex = (currentCardIndex + 1) % filteredCards.length;
	updateFlashcard();
}

function previousCard() {
	// Khi người dùng tương tác, nếu đang ở tab flashcard và còn thời gian, hãy khởi động đồng hồ
	if (isFlashcardsTabActive && timeRemaining > 0) {
		startDailyTimer();
	}

	const filteredCards = getFilteredCards();
	if (filteredCards.length === 0) return;

	currentCardIndex = (currentCardIndex - 1 + filteredCards.length) % filteredCards.length;
	updateFlashcard();
}

// ===================================================================================
// ===== 7. LOGIC TRÒ CHƠI & KIỂM TRA
// ===================================================================================

// --- Main Dispatchers ---
function startGame(gameId) {
    playSound('click');
    currentActivity = { type: 'game', id: gameId };
    showCategorySelectionModal();
}

function startQuiz(quizId) {
    playSound('click');
    currentActivity = { type: 'quiz', id: quizId };
    showCategorySelectionModal();
}

function playGame(gameId, categoryId) {
	const categoryWords = flashcards.filter(card => card.categoryId === categoryId);
	
	if (gameId === 1) { // Ghép từ
		if (categoryWords.length < 5) {
			alert('Cần ít nhất 5 từ vựng để chơi trò chơi này.');
			return;
		}
		startMatchingGame(categoryWords, gameId, categoryId);
	} else if (gameId === 2) { // Chọn từ
		if (categoryWords.length < 4) {
			alert('Cần ít nhất 4 từ vựng trong chủ đề này để chơi.');
			return;
		}
		startImageQuiz(categoryWords, gameId, categoryId);
	} else if (gameId === 3) { // <-- THÊM LẠI LOGIC CHO GAME "ĐIỀN TỪ"
		const suitableWords = categoryWords.filter(w => w.english.length >= 3 && w.english.length <= 15);
		if (suitableWords.length < 1) {
			alert('Không có từ vựng phù hợp cho trò chơi này trong chủ đề đã chọn.');
			return;
		}
		startFillBlankGame(suitableWords);
	} else if (gameId === 4) { // Ghép Âm thanh & Từ
		if (categoryWords.length < 3) {
			alert('Cần ít nhất 3 từ vựng trong chủ đề này để chơi.');
			return;
		}
		startSoundMatchGame(categoryWords, 9); // Mặc định 9 thẻ
	} else {
		alert('Trò chơi này đang được phát triển.');
	}
}

function startQuizWithCategory(quizId, categoryId) {
	startDailyTimer();
	const categoryWords = flashcards.filter(card => card.categoryId === categoryId);

	if (quizId === 1) { // Trắc nghiệm
		if (categoryWords.length < 4) {
			alert('Cần ít nhất 4 từ vựng để làm bài kiểm tra này.');
			return;
		}
		startMultipleChoiceQuiz(categoryWords, quizId, categoryId);
	} else if (quizId === 2) { // Xếp chữ
		const suitableWords = categoryWords.filter(w => w.english.length > 3 && w.english.length < 8);
		if (suitableWords.length < 1) {
			alert('Không có từ vựng phù hợp cho trò chơi này trong chủ đề đã chọn.');
			return;
		}
		startUnscrambleGame(suitableWords);
	} 
	// Đã xóa logic cho quizId === 3 ở đây
	else {
		alert('Bài kiểm tra này đang được phát triển.');
	}
}

function showCategorySelectionModal() {
	const container = document.getElementById('category-selection-container');
	container.innerHTML = '';
	
	categories.forEach(category => {
		const progress = getCategoryProgress(category.id);
		const colorClass = category.colorClass || getCategoryColorClass(category.color);
		const categoryElement = document.createElement('div');
		categoryElement.className = `bg-gradient-to-br ${colorClass} rounded-xl p-4 text-white cursor-pointer hover:shadow-lg transition duration-300`;
		categoryElement.innerHTML = `
			<div class="flex justify-between items-start mb-2">
				<h4 class="font-bold">${category.name}</h4>
				<span class="bg-white text-gray-700 text-xs font-bold px-2 py-1 rounded-full">${category.wordCount} từ</span>
			</div>
			<div class="mt-2">
				<div class="text-sm mb-1">Tiến độ: ${progress}%</div>
				<div class="w-full bg-white bg-opacity-30 rounded-full h-2">
					<div class="bg-white h-2 rounded-full" style="width: ${progress}%"></div>
				</div>
			</div>
		`;
		
		categoryElement.addEventListener('click', () => {
			playSound('click');
			closeModal('categorySelectionModal');
			const categoryWords = flashcards.filter(card => card.categoryId === category.id);
			
			// --- LOGIC MỚI ---
			// Nếu là game "Ghép Âm thanh & Từ", hiển thị lựa chọn độ khó
			if (currentActivity.id === 4) {
				openModal('gameOptionsModal');
				// Gán sự kiện cho các nút chọn độ khó
				document.getElementById('option-9-cards').onclick = () => {
					playSound('click');
					closeModal('gameOptionsModal');
					startSoundMatchGame(categoryWords, 9);
				};
				document.getElementById('option-12-cards').onclick = () => {
					playSound('click');
					closeModal('gameOptionsModal');
					startSoundMatchGame(categoryWords, 12);
				};
			} else {
				// Giữ nguyên logic cũ cho các game và quiz khác
				if (currentActivity.type === 'game') {
					playGame(currentActivity.id, category.id);
				} else if (currentActivity.type === 'quiz') {
					startQuizWithCategory(currentActivity.id, category.id);
				}
			}
		});
		
		container.appendChild(categoryElement);
	});
	
	openModal('categorySelectionModal');
}

// --- Game 1: Ghép từ (Matching Game) ---
function startMatchingGame(words, gameId, categoryId) {
	// Đặt lại trạng thái trò chơi
	selectedEnglishWord = null;
	selectedVietnameseWord = null;
	matchedPairs = [];
	currentActivity.categoryId = categoryId; // Lưu categoryId để dùng cho nút "Đổi câu"

	// Chọn 5 từ ngẫu nhiên
	const gameWords = words.sort(() => 0.5 - Math.random()).slice(0, 5);
	
	// Chuẩn bị các từ tiếng Anh
	const englishContainer = document.getElementById('english-words');
	englishContainer.innerHTML = '';
	gameWords.forEach(word => {
		const wordElement = document.createElement('div');
		wordElement.className = 'word-card bg-blue-100 p-3 rounded-lg text-blue-800 font-semibold cursor-pointer';
		wordElement.setAttribute('data-word-id', word.id);
		wordElement.textContent = word.english;
		wordElement.addEventListener('click', () => selectEnglishWord(wordElement, word.id));
		englishContainer.appendChild(wordElement);
	});
	
	// Chuẩn bị các từ tiếng Việt (đã xáo trộn)
	const vietnameseContainer = document.getElementById('vietnamese-words');
	vietnameseContainer.innerHTML = '';
	const shuffledVietnamese = [...gameWords].sort(() => 0.5 - Math.random());
	shuffledVietnamese.forEach(word => {
		const wordElement = document.createElement('div');
		wordElement.className = 'word-card bg-gray-100 p-3 rounded-lg text-gray-800 cursor-pointer';
		wordElement.setAttribute('data-word-id', word.id);
		wordElement.textContent = word.vietnamese;
		wordElement.addEventListener('click', () => selectVietnameseWord(wordElement, word.id));
		vietnameseContainer.appendChild(wordElement);
	});
	
	// Thiết lập nút "Kiểm tra đáp án"
	const checkButton = document.getElementById('check-answers');
	checkButton.textContent = 'Kiểm tra đáp án';
	checkButton.disabled = false;
	checkButton.onclick = () => checkMatchingAnswers(gameId, categoryId);

	// Thiết lập nút "Làm lại"
	const restartButton = document.getElementById('restart-matching-game');
	restartButton.onclick = () => restartMatchingGame();

	// Hiển thị modal trò chơi
	openModal('matchingGameModal');
}

function selectEnglishWord(element, wordId) {
	speakWord(element.textContent, 'en-US'); // Đọc to từ tiếng Anh

	if (element.classList.contains('matched')) return;

	const currentlySelected = document.querySelector('#english-words .word-card.selected');
	if (currentlySelected) {
		currentlySelected.classList.remove('selected');
	}

	element.classList.add('selected');
	selectedEnglishWord = wordId;

	if (selectedVietnameseWord) {
		checkWordMatch();
	}
}

function selectVietnameseWord(element, wordId) {
	speakWord(element.textContent, 'vi-VN'); // Đọc to từ tiếng Việt

	if (element.classList.contains('matched')) return;

	const currentlySelected = document.querySelector('#vietnamese-words .word-card.selected');
	if (currentlySelected) {
		currentlySelected.classList.remove('selected');
	}

	element.classList.add('selected');
	selectedVietnameseWord = wordId;

	if (selectedEnglishWord) {
		checkWordMatch();
	}
}

function checkWordMatch() {
	const englishElement = document.querySelector(`#english-words .word-card[data-word-id="${selectedEnglishWord}"]`);
	const vietnameseElement = document.querySelector(`#vietnamese-words .word-card[data-word-id="${selectedVietnameseWord}"]`);

	// Thoát nếu không tìm thấy một trong hai phần tử
	if (!englishElement || !vietnameseElement) return;

	if (selectedEnglishWord === selectedVietnameseWord) {
		// Xử lý khi ghép đúng
		englishElement.classList.remove('selected');
		vietnameseElement.classList.remove('selected');
		englishElement.classList.add('matched');
		vietnameseElement.classList.add('matched');
		matchedPairs.push(selectedEnglishWord);
	} else {
		// Xử lý khi ghép sai
		englishElement.classList.add('error');
		vietnameseElement.classList.add('error');
		
		// Xóa hiệu ứng sau 0.8 giây
		setTimeout(() => {
			englishElement.classList.remove('selected', 'error');
			vietnameseElement.classList.remove('selected', 'error');
		}, 800);
	}

	// Đặt lại các biến lựa chọn sau khi kiểm tra
	selectedEnglishWord = null;
	selectedVietnameseWord = null;

	// Kiểm tra xem tất cả các cặp đã được ghép xong chưa
	const totalPairs = document.querySelectorAll('#english-words .word-card').length;
	if (matchedPairs.length === totalPairs && totalPairs > 0) {
		setTimeout(() => {
			const gameId = currentActivity.id;
			const categoryId = currentActivity.categoryId;
			const score = 100; // Hoàn thành tất cả là 100 điểm
			
			updateGameProgress(gameId, categoryId, score);
			
			matchedPairs.forEach(wordId => {
				markWordAsLearned(wordId);
			});
			
			closeModal('matchingGameModal');
			showCompletionMessage(score, gameId, categoryId);
			createConfetti();
		}, 1000); // Đợi 1 giây trước khi hiển thị thông báo hoàn thành
	}
}

function checkMatchingAnswers(gameId, categoryId) {
	playSound('click'); // <-- Thêm âm thanh khi nhấn nút

	const totalPairs = document.querySelectorAll('#english-words .word-card').length;
	const score = Math.round((matchedPairs.length / totalPairs) * 100);
	const successIcon = document.getElementById('matching-success-feedback');

	const checkButton = document.getElementById('check-answers');
	checkButton.textContent = `Đúng ${matchedPairs.length}/${totalPairs}`;
	checkButton.disabled = true;

	if (matchedPairs.length === totalPairs && totalPairs > 0) {
		successIcon.classList.remove('hidden');
		successIcon.classList.add('success-shake');
		playSound('tada');
	}

	setTimeout(() => {
		if (!successIcon.classList.contains('hidden')) {
			successIcon.classList.add('hidden');
			successIcon.classList.remove('success-shake');
		}
		restartMatchingGame();
	}, 2000);
}

function restartMatchingGame() {
	playSound('click'); // <-- Thêm âm thanh khi nhấn nút

	const gameId = currentActivity.id;
	const categoryId = currentActivity.categoryId;

	if (gameId && categoryId) {
		// Đóng modal ngay lập tức để không bị gián đoạn
		closeModal('matchingGameModal'); 
		
		setTimeout(() => {
			playGame(gameId, categoryId);
		}, 300); // Đợi một chút để modal đóng hoàn toàn
	} else {
		alert("Đã có lỗi xảy ra, không thể làm lại game.");
	}
}

// --- Game 2: Chọn từ (Image Quiz) ---
function startImageQuiz(words, gameId, categoryId) {
	imageQuizQuestions = generateImageQuizQuestions(words);
	currentImageQuizQuestionIndex = 0;
	imageQuizScore = 0;
	currentActivity.categoryId = categoryId;
	currentActivity.id = gameId;

	displayImageQuizQuestion();
	openModal('imageQuizModal');
}

function generateImageQuizQuestions(allWords, numQuestions = 5) {
	const questions = [];
	const wordsCopy = [...allWords];

	// Chọn ngẫu nhiên `numQuestions` từ để làm câu hỏi
	for (let i = 0; i < Math.min(numQuestions, wordsCopy.length); i++) {
		const correctWordIndex = Math.floor(Math.random() * wordsCopy.length);
		const correctWord = wordsCopy.splice(correctWordIndex, 1)[0];
		
		const options = [correctWord];
		const distractors = allWords.filter(w => w.id !== correctWord.id);

		// Lấy 3 đáp án sai ngẫu nhiên
		while (options.length < 4 && distractors.length > 0) {
			const distractorIndex = Math.floor(Math.random() * distractors.length);
			options.push(distractors.splice(distractorIndex, 1)[0]);
		}
		
		questions.push({
			correctAnswer: correctWord,
			options: options.sort(() => 0.5 - Math.random()) // Xáo trộn các đáp án
		});
	}
	return questions;
}

function displayImageQuizQuestion() {
	if (currentImageQuizQuestionIndex >= imageQuizQuestions.length) {
		endImageQuiz();
		return;
	}

	const question = imageQuizQuestions[currentImageQuizQuestionIndex];
	const imageContainer = document.getElementById('image-quiz-image-container');
	
	// Cập nhật tiến trình
	document.getElementById('image-quiz-progress').textContent = `Câu ${currentImageQuizQuestionIndex + 1} / ${imageQuizQuestions.length}`;
	
	// --- PHẦN LOGIC MỚI ---
	// Kiểm tra xem từ có hình ảnh hợp lệ không
	if (question.correctAnswer.image && question.correctAnswer.image.startsWith('http')) {
		// Nếu CÓ HÌNH: Hiển thị hình ảnh
		imageContainer.innerHTML = `<img id="image-quiz-img" src="${question.correctAnswer.image}" alt="Quiz image" class="max-w-full max-h-full object-contain">`;
	} else {
		// Nếu KHÔNG CÓ HÌNH: Hiển thị từ tiếng Việt và đọc to nó lên
		imageContainer.innerHTML = `<div class="text-4xl md:text-5xl font-bold text-center text-blue-800 p-4">${question.correctAnswer.vietnamese}</div>`;
		speakWord(question.correctAnswer.vietnamese, 'vi-VN');
	}
	// --- KẾT THÚC PHẦN LOGIC MỚI ---

	// Hiển thị các đáp án
	const optionsContainer = document.getElementById('image-quiz-options');
	optionsContainer.innerHTML = '';
	question.options.forEach(option => {
		const optionButton = document.createElement('button');
		optionButton.className = 'quiz-option p-4 border rounded-lg text-lg font-semibold text-gray-700 bg-white';
		optionButton.textContent = option.english;
		optionButton.onclick = () => handleImageQuizOptionClick(optionButton, option, question.correctAnswer);
		optionsContainer.appendChild(optionButton);
	});
}

function handleImageQuizOptionClick(button, selectedOption, correctOption) {
	// Âm thanh khi người dùng nhấn chọn
	playSound('click');

	// Vô hiệu hóa tất cả các nút để tránh nhấn nhiều lần
	document.querySelectorAll('#image-quiz-options button').forEach(btn => btn.disabled = true);

	if (selectedOption.id === correctOption.id) {
		// Trả lời đúng
		button.classList.add('correct');
		imageQuizScore++;
		playSound('success_2'); // Âm thanh thành công
	} else {
		// Trả lời sai
		button.classList.add('incorrect');
		playSound('fail'); // Âm thanh thất bại
		
		// Tìm và hiển thị đáp án đúng
		document.querySelectorAll('#image-quiz-options button').forEach(btn => {
			if (btn.textContent === correctOption.english) {
				btn.classList.add('correct');
			}
		});
	}

	// Đọc to từ tiếng Anh đúng để người dùng ghi nhớ
	speakWord(correctOption.english, 'en-US');

	// Chuyển sang câu hỏi tiếp theo sau 1.5 giây
	setTimeout(() => {
		currentImageQuizQuestionIndex++;
		displayImageQuizQuestion();
	}, 1500);
}

function endImageQuiz() {
	closeModal('imageQuizModal');
	const scorePercentage = Math.round((imageQuizScore / imageQuizQuestions.length) * 100);
	updateGameProgress(currentActivity.id, currentActivity.categoryId, scorePercentage);
	
	// Đánh dấu các từ đã trả lời đúng là đã học
	imageQuizQuestions.forEach(q => {
		// Bạn có thể thêm logic kiểm tra câu trả lời đúng ở đây nếu muốn
		// Hiện tại, chỉ cần hoàn thành game là được
	});
	
	showCompletionMessage(scorePercentage, currentActivity.id, currentActivity.categoryId);
	
	if (scorePercentage >= 60) {
		createConfetti();
	}
}

// --- Game 3: Điền từ (Fill in the Blank) ---
function startFillBlankGame(words) {
	if (words) {
		fillBlankWordPool = words;
	}

	if (!fillBlankWordPool || fillBlankWordPool.length === 0) {
		alert("Không có từ nào phù hợp để chơi!");
		return;
	}

	const randomWord = fillBlankWordPool[Math.floor(Math.random() * fillBlankWordPool.length)];
	fillBlankTargetWord = randomWord.english.toUpperCase();

	const scrambledLetters = fillBlankTargetWord.split('').sort(() => Math.random() - 0.5);

	const answerArea = document.getElementById('answer-area');
	const letterTilesArea = document.getElementById('letter-tiles');
	answerArea.innerHTML = '';
	letterTilesArea.innerHTML = '';

	fillBlankTargetWord.split('').forEach(() => {
		const slot = document.createElement('div');
		slot.className = 'answer-slot';
		slot.addEventListener('click', (event) => {
			if (event.currentTarget.firstChild) {
				moveLetter(event.currentTarget.firstChild);
			}
		});
		answerArea.appendChild(slot);
	});

	scrambledLetters.forEach(letter => {
		const tile = document.createElement('div');
		tile.className = 'letter-tile';
		tile.textContent = letter;
		tile.addEventListener('click', (event) => moveLetter(event.currentTarget));
		letterTilesArea.appendChild(tile);
	});

	// Gán sự kiện cho các nút (ID đã đổi)
	document.getElementById('check-fill-blank-btn').onclick = checkFillBlankAnswer;
	document.getElementById('change-word-fill-blank-btn').onclick = () => startFillBlankGame(); 

	// Mở modal với ID mới
	openModal('fillBlankGameModal');
}

function checkFillBlankAnswer() {
	const answerArea = document.getElementById('answer-area');
	let userAnswer = '';
	const answerSlots = Array.from(answerArea.children);

	answerSlots.forEach(slot => {
		if (slot.firstChild) {
			userAnswer += slot.firstChild.textContent;
		}
	});

	if (userAnswer === fillBlankTargetWord) {
		// --- XỬ LÝ KHI TRẢ LỜI ĐÚNG ---
		const successIcon = document.getElementById('fill-blank-success-feedback');

		 // 1. Chuyển các ô chữ thành màu xanh lá
		answerSlots.forEach(slot => {
			if (slot.firstChild) {
				slot.firstChild.classList.add('bg-green-200', 'border-green-400');
			}
		});

		// 2. Hiện và rung lắc icon 👍
		successIcon.classList.remove('hidden');
		successIcon.classList.add('success-shake');
		
		// 3. Sau 1.5 giây, tải từ mới và ẩn icon đi
		setTimeout(() => {
			successIcon.classList.add('hidden');
			successIcon.classList.remove('success-shake');
			startFillBlankGame();
		}, 1500);

	} else {
		// --- XỬ LÝ KHI TRẢ LỜI SAI ---
		answerArea.classList.add('error');
		setTimeout(() => answerArea.classList.remove('error'), 500);

		setTimeout(() => {
			answerSlots.forEach(slot => {
				if (slot.firstChild) {
					letterTilesArea.appendChild(slot.firstChild);
				}
			});
		}, 500);
	}
}

// --- Game 4: Ghép Âm thanh & Từ (Sound Match) ---
function startSoundMatchGame(words, numCards) {
	if (words) {
		soundMatchWordPool = words;
	}
	const board = document.getElementById('sound-match-board');
	board.innerHTML = '';
	selectedMatchCards = [];
	isCheckingMatch = true;

	let numPairs, numBlanks;
	if (numCards === 12) {
		numPairs = 4;
		numBlanks = 4;
		board.className = 'grid grid-cols-3 gap-2 md:gap-4 grid-12-cards';
	} else {
		numCards = 9;
		numPairs = 3;
		numBlanks = 3;
		board.className = 'grid grid-cols-3 gap-2';
	}
	currentActivity.numCards = numCards;
	currentActivity.numPairs = numPairs;

	const gameWords = soundMatchWordPool.sort(() => 0.5 - Math.random()).slice(0, numPairs);
	if (gameWords.length < numPairs) {
		alert(`Chủ đề này không đủ ${numPairs} từ vựng để chơi.`);
		isCheckingMatch = false;
		return;
	}

	let cards = [];
	gameWords.forEach(word => {
		cards.push({ type: 'audio', word: word.english, pairId: word.id });
		cards.push({ type: 'text', word: word.english, pairId: word.id });
	});
	for (let i = 0; i < numBlanks; i++) {
		cards.push({ type: 'blank', word: null, pairId: `blank_${i}` });
	}

	cards.sort(() => 0.5 - Math.random());

	cards.forEach((cardData, index) => {
		const cardElement = document.createElement('div');
		const backClass = cardData.type === 'audio' ? 'back-audio' : '';
		const cardSize = numCards === 12 ? 'w-[90px] h-[70px]' : 'w-[90px] h-[70px]';
		
		// --- LOGIC MỚI: Chuẩn bị sẵn nội dung mặt trước ---
		let frontContent = '';
		let frontClasses = 'card-face card-front w-full h-full rounded-lg flex justify-center items-center p-1 text-center font-bold text-base md:text-xl shadow-md';
		
		if (cardData.type === 'audio') {
			frontClasses += ' bg-blue-100 text-blue-600';
			frontContent = `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>`;
		} else if (cardData.type === 'text') {
			frontClasses += ' bg-yellow-100 text-yellow-800';
			frontContent = cardData.word;
		} else {
			frontClasses += ' bg-gray-200';
		}

		cardElement.className = `match-card ${cardSize} cursor-pointer`;
		cardElement.dataset.cardIndex = index;
		cardElement.innerHTML = `
			<div class="card-face card-back w-full h-full rounded-lg flex justify-center items-center text-4xl ${backClass}">?</div>
			<div class="${frontClasses}">${frontContent}</div>
		`;
		cardElement.addEventListener('click', () => handleMatchCardClick(cardElement, cardData));
		board.appendChild(cardElement);
	});
	
	openModal('soundMatchModal');

	// Giai đoạn ghi nhớ 3 giây
	const allCards = board.querySelectorAll('.match-card');
	setTimeout(() => {
		allCards.forEach(card => card.classList.add('flipped'));
	}, 500);

	setTimeout(() => {
		allCards.forEach(card => card.classList.remove('flipped'));
		isCheckingMatch = false;
	}, 3500);
}

function handleMatchCardClick(cardElement, cardData) {
	if (isCheckingMatch || cardElement.classList.contains('flipped')) return;

	playSound('click');
	cardElement.classList.add('flipped');
	
	const cardFront = cardElement.querySelector('.card-front');
	
	if(cardData.type === 'audio') {
		cardFront.classList.add('bg-blue-100', 'text-blue-600');
		cardFront.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>`;
		speakWord(cardData.word, 'en-US');
	} else if (cardData.type === 'text') {
		cardFront.classList.add('bg-yellow-100', 'text-yellow-800');
		cardFront.textContent = cardData.word;
	} else { // Thẻ trống
		cardFront.classList.add('bg-gray-200');
	}

	selectedMatchCards.push({ element: cardElement, data: cardData });

	if (selectedMatchCards.length === 2) {
		isCheckingMatch = true;
		setTimeout(checkSoundMatch, 1200); // Tăng thời gian chờ một chút
	}
}

function checkSoundMatch() {
	const card1 = selectedMatchCards[0];
	const card2 = selectedMatchCards[1];
	
	const isPair = card1.data.pairId === card2.data.pairId;
	const isAudioText = card1.data.type !== 'blank' && card1.data.type !== card2.data.type;

	if (isPair && isAudioText) {
		// --- LOGIC MỚI: Đổi mặt sau thành icon checked ---
		const back1 = card1.element.querySelector('.card-back');
		const back2 = card2.element.querySelector('.card-back');
		back1.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`;
		back2.innerHTML = back1.innerHTML;
		// --- KẾT THÚC LOGIC MỚI ---

		card1.element.classList.add('matched');
		card2.element.classList.add('matched');
		
		const matchedCount = document.querySelectorAll('.match-card.matched').length;
		if (matchedCount === currentActivity.numPairs * 2) {
			playSound('tada');
			setTimeout(() => {
				startSoundMatchGame(null, currentActivity.numCards);
			}, 1500);
		}
	} else {
		playSound('error');
		card1.element.classList.remove('flipped');
		card2.element.classList.remove('flipped');
	}

	selectedMatchCards = [];
	isCheckingMatch = false;
}

// --- Quiz 1: Trắc nghiệm (Multiple Choice) ---
function startMultipleChoiceQuiz(words, quizId, categoryId) {
	let wordsForQuiz;
	const progressPercent = getCategoryProgress(categoryId);

	// --- LOGIC TỰ ĐỘNG CHỌN CHẾ ĐỘ ---
	if (progressPercent === 100) {
		// Nếu đã học 100%, vào chế độ ÔN TẬP (dùng tất cả các từ)
		wordsForQuiz = words;
		console.log(`Chủ đề ${categoryId} đã hoàn thành. Bắt đầu chế độ ôn tập.`);
	} else {
		// Nếu chưa, vào chế độ HỌC MỚI (chỉ dùng các từ chưa học)
		const progress = getUserProgress();
		wordsForQuiz = words.filter(word => !progress.completedWords[word.id]);
		console.log(`Chủ đề ${categoryId} chưa hoàn thành. Bắt đầu chế độ học mới.`);
	}
	// --- KẾT THÚC LOGIC MỚI ---

	// Kiểm tra xem có từ nào để học/ôn tập không
	if (wordsForQuiz.length < 4) {
		// Thông báo này giờ chỉ hiện khi thực sự không còn từ nào hoặc không đủ để chơi
		alert("🎉 Chúc mừng! Bạn đã học hết tất cả các từ trong chủ đề này.");
		closeModal('multipleChoiceQuizModal');
		return;
	}

	const quizWords = wordsForQuiz.sort(() => 0.5 - Math.random()).slice(0, 10);
	const questionsContainer = document.getElementById('quiz-questions');
	questionsContainer.innerHTML = '';
	
	quizWords.forEach((word, index) => {
		const options = [word.vietnamese];
		// Lấy các đáp án sai từ chính danh sách từ sẽ dùng cho bài quiz
		const distractors = wordsForQuiz.filter(w => w.id !== word.id);

		while (options.length < 4 && distractors.length > 0) {
			const randomDistractor = distractors.splice(Math.floor(Math.random() * distractors.length), 1)[0];
			options.push(randomDistractor.vietnamese);
		}
		
		const shuffledOptions = options.sort(() => 0.5 - Math.random());
		const questionElement = document.createElement('div');
		questionElement.className = 'bg-white p-4 rounded-lg shadow';
		questionElement.setAttribute('data-word-id', word.id);
		questionElement.setAttribute('data-correct', word.vietnamese);
		
		let questionHTML = `<h4 class="font-bold text-gray-800 mb-3">${index + 1}. ${word.english}</h4><div class="grid grid-cols-2 gap-3">`;
		shuffledOptions.forEach((option) => {
			questionHTML += `<div class="quiz-option p-2 border rounded-lg" data-value="${option}" onclick="selectQuizOption(this)"><label class="flex items-center cursor-pointer"><input type="radio" name="q${index}" value="${option}" class="mr-2 hidden"><span class="text-gray-700">${option}</span></label></div>`;
		});
		questionHTML += `</div>`;
		questionElement.innerHTML = questionHTML;
		questionsContainer.appendChild(questionElement);
	});
	
	const submitButton = document.getElementById('submit-quiz');
	submitButton.textContent = 'Nộp bài';
	submitButton.disabled = false;
	submitButton.onclick = () => checkQuizAnswers(quizId, categoryId);
	
	openModal('multipleChoiceQuizModal');
}

function selectQuizOption(optionElement) {
	playSound('click'); // <-- Thêm âm thanh khi nhấn
	
	// Deselect all options in the same question
	const questionElement = optionElement.closest('.bg-white');
	const options = questionElement.querySelectorAll('.quiz-option');
	
	options.forEach(option => {
		option.classList.remove('selected');
		option.querySelector('input').checked = false;
	});
	
	// Select the clicked option
	optionElement.classList.add('selected');
	optionElement.querySelector('input').checked = true;
}

function checkQuizAnswers(quizId, categoryId) {
	playSound('click'); // <-- Thêm âm thanh khi nhấn "Nộp bài"

	const questions = document.querySelectorAll('#quiz-questions > div');
	let correctCount = 0;
	let totalCount = questions.length;
	let correctlyAnsweredWordIds = [];

	// ... (Phần code kiểm tra đáp án đúng/sai giữ nguyên) ...
	questions.forEach(question => {
		const correctAnswer = question.getAttribute('data-correct');
		const selectedOption = question.querySelector('.quiz-option.selected');
		if (selectedOption) {
			const selectedValue = selectedOption.getAttribute('data-value');
			if (selectedValue === correctAnswer) {
				correctCount++;
				selectedOption.classList.add('correct');
				correctlyAnsweredWordIds.push(parseInt(question.getAttribute('data-word-id')));
			} else {
				selectedOption.classList.add('incorrect');
				const correctOption = Array.from(question.querySelectorAll('.quiz-option')).find(
					option => option.getAttribute('data-value') === correctAnswer
				);
				if (correctOption) correctOption.classList.add('correct');
			}
		}
	});

	// ... (Phần code cập nhật progress giữ nguyên) ...
	if (correctlyAnsweredWordIds.length > 0) {
		const progress = getUserProgress();
		let newWordsLearnedCount = 0;
		correctlyAnsweredWordIds.forEach(wordId => {
			if (!progress.completedWords[wordId]) {
				newWordsLearnedCount++;
			}
			progress.completedWords[wordId] = true;
		});
		for (let i = 0; i < newWordsLearnedCount; i++) {
			updateDailyActivity();
		}
		updateCategoryProgress(progress);
		saveUserProgress(progress);
		updateUserStats();
	}

	const submitButton = document.getElementById('submit-quiz');
	submitButton.textContent = `Đúng ${correctCount}/${totalCount}`;
	submitButton.disabled = true;

	// Hiệu ứng chúc mừng nếu đạt điểm tuyệt đối
	if (correctCount === totalCount && totalCount > 0) {
		createConfetti();
		playSound('success'); // <-- Thay thế âm thanh "tada" bằng "success"
	}

	// Tự động bắt đầu vòng mới sau 2 giây
	setTimeout(() => {
		const categoryWords = flashcards.filter(card => card.categoryId === categoryId);
		startMultipleChoiceQuiz(categoryWords, quizId, categoryId);
	}, 2000);
}

// --- Quiz 2: Xếp chữ (Unscramble) ---
function startUnscrambleGame(words) {
	if (words) {
		unscrambleWordPool = words;
	}
	if (!unscrambleWordPool || unscrambleWordPool.length === 0) {
		alert("Không có từ nào phù hợp để chơi!");
		return;
	}

	const randomWord = unscrambleWordPool[Math.floor(Math.random() * unscrambleWordPool.length)];
	unscrambleTargetWord = randomWord.english.toUpperCase();
	unscrambleTargetWordId = randomWord.id;
	
	// Đọc to nghĩa tiếng Việt để làm gợi ý
	speakWord(randomWord.vietnamese, 'vi-VN');

	const scrambledLetters = unscrambleTargetWord.split('').sort(() => Math.random() - 0.5);
	const answerArea = document.getElementById('answer-area');
	const letterTilesArea = document.getElementById('letter-tiles');
	answerArea.innerHTML = '';
	letterTilesArea.innerHTML = '';

	unscrambleTargetWord.split('').forEach(() => {
		const slot = document.createElement('div');
		slot.className = 'answer-slot';
		slot.addEventListener('click', (event) => {
			if (event.currentTarget.firstChild) {
				moveLetter(event.currentTarget.firstChild);
			}
		});
		answerArea.appendChild(slot);
	});

	scrambledLetters.forEach(letter => {
		const tile = document.createElement('div');
		tile.className = 'letter-tile';
		tile.textContent = letter;
		tile.addEventListener('click', (event) => moveLetter(event.currentTarget));
		letterTilesArea.appendChild(tile);
	});

	document.getElementById('check-unscramble-btn').onclick = checkUnscrambleAnswer;
	document.getElementById('change-word-btn').onclick = () => startUnscrambleGame(); 

	openModal('unscrambleGameModal');
}

function moveLetter(tile) {
	if (!tile) return;
	playSound('click'); // Âm thanh "lách cách" khi di chuyển chữ

	const answerArea = document.getElementById('answer-area');
	const letterTilesArea = document.getElementById('letter-tiles');

	if (tile.parentElement === letterTilesArea) {
		const emptySlot = Array.from(answerArea.children).find(slot => !slot.firstChild);
		if (emptySlot) {
			emptySlot.appendChild(tile);
		}
	} else {
		letterTilesArea.appendChild(tile);
	}
}

function checkUnscrambleAnswer() {
	playSound('click'); // Âm thanh khi nhấn nút
	const answerArea = document.getElementById('answer-area');
	const letterTilesArea = document.getElementById('letter-tiles');
	let userAnswer = '';
	const answerSlots = Array.from(answerArea.children);

	answerSlots.forEach(slot => {
		if (slot.firstChild) {
			userAnswer += slot.firstChild.textContent;
		}
	});

	if (userAnswer === unscrambleTargetWord) {
		markWordAsLearned(unscrambleTargetWordId);
		playSound('tada'); // Âm thanh thành công
		speakWord(unscrambleTargetWord, 'en-US'); // Đọc to từ vừa xếp đúng
		const successIcon = document.getElementById('unscramble-success-feedback');

		answerSlots.forEach(slot => {
			if (slot.firstChild) {
				slot.firstChild.classList.add('bg-green-200', 'border-green-400');
			}
		});

		successIcon.classList.remove('hidden');
		successIcon.classList.add('success-shake');

		setTimeout(() => {
			successIcon.classList.add('hidden');
			successIcon.classList.remove('success-shake');
			startUnscrambleGame();
		}, 1500);

	} else {
		playSound('error'); // Âm thanh thất bại
		answerArea.classList.add('error');
		setTimeout(() => answerArea.classList.remove('error'), 500);

		setTimeout(() => {
			answerSlots.forEach(slot => {
				if (slot.firstChild) {
					letterTilesArea.appendChild(slot.firstChild);
				}
			});
		}, 500);
	}
}

// ===================================================================================
// ===== 8. QUẢN LÝ TIẾN ĐỘ NGƯỜI DÙNG
// ===================================================================================

function initUserProgress() {
	// Try to load user progress from localStorage
	const savedProgress = localStorage.getItem('flashkids_progress');
	if (savedProgress) {
		return JSON.parse(savedProgress);
	}
	
	// Create default progress object if none exists
	return {
		categories: {},
		completedWords: {},
		completedGames: {},
		completedQuizzes: {},
		dailyActivities: 0,
		lastActivityDate: new Date().toDateString(),
		streakDays: 0,
		userProfile: {
			username: '',
			age: '',
			soundEnabled: true
		}
	};
}

function saveUserProgress(progress) {
	localStorage.setItem('flashkids_progress', JSON.stringify(progress));
}

function getUserProgress() {
	return initUserProgress();
}

function markWordAsLearned(wordId) {
	const progress = getUserProgress(); // Đọc 1 lần
	let isNewWord = !progress.completedWords[wordId];
	
	progress.completedWords[wordId] = true; // Cập nhật từ đã học
	
	updateCategoryProgress(progress); // Truyền progress để tính toán
	
	if (isNewWord) {
		updateDailyActivity(); // Chỉ cập nhật hoạt động nếu là từ mới
	}
	
	saveUserProgress(progress); // Lưu tất cả 1 lần
	updateUserStats();
}

function markCurrentWordAsLearned() {
	const filteredCards = getFilteredCards();
	if (filteredCards.length === 0) return;
	
	const card = filteredCards[currentCardIndex];
	markWordAsLearned(card.id);
	
	// Show feedback
	const button = document.getElementById('mark-learned-btn');
	const originalText = button.innerHTML;
	button.innerHTML = `
		<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
			<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
		</svg>
		Đã đánh dấu!
	`;
	button.disabled = true;
	button.classList.remove('btn-success');
	button.classList.add('bg-gray-400');
	
	setTimeout(() => {
		button.innerHTML = originalText;
		button.disabled = false;
		button.classList.remove('bg-gray-400');
		button.classList.add('btn-success');
	}, 2000);
	
	// Move to next card
	setTimeout(() => {
		nextCard();
	}, 1000);
}

function updateGameProgress(gameId, categoryId, score) {
	const progress = getUserProgress();
	
	// Record game completion
	progress.completedGames[`${gameId}_${categoryId}`] = {
		score: score,
		timestamp: Date.now()
	};
	
	// Update daily activities
	updateDailyActivity();
	
	// Save progress
	saveUserProgress(progress);
	
	// Update UI
	updateUserStats();
	updateDailyProgress();
}

function updateQuizProgress(quizId, categoryId, score) {
	const progress = getUserProgress();
	
	// Record quiz completion
	progress.completedQuizzes[`${quizId}_${categoryId}`] = {
		score: score,
		timestamp: Date.now()
	};
	
	// Update daily activities
	updateDailyActivity();
	
	// Save progress
	saveUserProgress(progress);
	
	// Update UI
	updateUserStats();
	updateDailyProgress();
}

function getCategoryProgress(categoryId) {
	const progress = getUserProgress();
	// Dữ liệu tiến độ vẫn được đọc từ localStorage
	return progress.categories[`${currentLevel}_${categoryId}`] || 0;
}

function updateCategoryProgress(progress) { // <-- Nhận 'progress' làm tham số
	if (!progress) return; // Thoát nếu không có progress

	// Chỉ tính toán cho các chủ đề của level hiện tại
	categories.forEach(category => {
		const wordsInCatForLevel = flashcards.filter(card => card.categoryId === category.id);
		const totalWordsInCatForLevel = wordsInCatForLevel.length;

		if (totalWordsInCatForLevel === 0) return;

		let learnedCount = 0;
		wordsInCatForLevel.forEach(word => {
			if (progress.completedWords[word.id]) {
				learnedCount++;
			}
		});
		
		const percentComplete = Math.round((learnedCount / totalWordsInCatForLevel) * 100);
		
		// Cập nhật trực tiếp vào đối tượng progress được truyền vào
		progress.categories[`${currentLevel}_${category.id}`] = percentComplete;
	});
	// Không còn saveUserProgress(progress) ở đây nữa
}

function updateDailyActivity() {
	const progress = getUserProgress();
	const today = new Date().toDateString();
	
	// Check if this is a new day
	if (progress.lastActivityDate !== today) {
		// If consecutive day, increase streak
		if (new Date(progress.lastActivityDate).getTime() === new Date(today).getTime() - 86400000) {
			progress.streakDays++;
		} else {
			progress.streakDays = 1;
		}
		
		progress.lastActivityDate = today;
		progress.dailyActivities = 1;
	} else {
		progress.dailyActivities++;
	}
	
	// Save progress
	saveUserProgress(progress);
}
		
// ===================================================================================
// ===== 9. CẬP NHẬT GIAO DIỆN PHỤ (UI HELPERS)
// ===================================================================================

function showLoading() {
	document.getElementById('loading-indicator').classList.remove('hidden');
}

function hideLoading() {
	document.getElementById('loading-indicator').classList.add('hidden');
}

function openModal(modalId) {
	const modal = document.getElementById(modalId);
	modal.classList.add('show');
}

function closeModal(modalId) {
	const modal = document.getElementById(modalId);
	modal.classList.remove('show');
	loadCategories(); // <-- THÊM DÒNG NÀY
}

function updateCardCounter() {
	const filteredCards = getFilteredCards();
		
	const counter = document.getElementById('card-counter');
	counter.textContent = filteredCards.length > 0 
		? `${currentCardIndex + 1} / ${filteredCards.length}`
		: '0 / 0';
}

function updateLevelBadges(activeLevel) {
	document.querySelectorAll('.level-badge').forEach(badge => {
		// Tự động lấy tên level từ thuộc tính onclick
		const onclickAttr = badge.getAttribute('onclick');
		const level = onclickAttr.match(/'([^']+)'/)[1];

		badge.classList.remove('active');
		if (level === activeLevel) {
			badge.classList.add('active');
		}
	});
}

function loadCategories() {
	const container = document.getElementById('categories-container');
	container.innerHTML = '';

	// Với kiến trúc mới, biến "categories" toàn cục đã là danh sách được lọc sẵn cho level hiện tại.
	// Chúng ta chỉ cần hiển thị nó ra.
	if (categories.length === 0) {
		container.innerHTML = '<p class="text-gray-500 text-center col-span-3">Không có chủ đề nào cho cấp độ này.</p>';
		return;
	}
	
	categories.forEach(category => {
		const colorClass = category.colorClass || getCategoryColorClass(category.color);
		const progress = getCategoryProgress(category.id);
		
		const categoryElement = document.createElement('div');
		categoryElement.className = `category-card bg-gradient-to-br ${colorClass} rounded-2xl p-5 text-white shadow-lg`;
		categoryElement.innerHTML = `
			<div class="flex justify-between items-start mb-4">
				<h4 class="text-lg font-bold">${category.name}</h4>
				<span class="bg-white text-gray-700 text-xs font-bold px-2 py-1 rounded-full">${category.wordCount} từ</span>
			</div>
			<div class="flex justify-between items-end">
				<div>
					<div class="text-sm mb-1">Tiến độ: ${progress}%</div>
					<div class="w-32 bg-white bg-opacity-30 rounded-full h-2">
						<div class="bg-white h-2 rounded-full" style="width: ${progress}%"></div>
					</div>
				</div>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-white opacity-80" viewBox="0 0 20 20" fill="currentColor">
					${getCategoryIcon(category.name)}
				</svg>
			</div>
		`;
		
		categoryElement.addEventListener('click', () => {
			playSound('click'); // <-- Thêm âm thanh khi nhấn
			currentCategoryId = category.id;
			currentCardIndex = 0;
			changeTab('flashcards');
		});
		
		container.appendChild(categoryElement);
	});
}

function loadCategoryFilters() {
	const container = document.getElementById('category-filters');
	container.innerHTML = `<button class="bg-blue-500 text-white py-2 px-4 rounded-full shadow-md flex-shrink-0" onclick="filterByCategory(null)">Tất cả</button>`;
	
	// Chỉ cần lặp qua danh sách categories đã được lọc sẵn
	categories.forEach(category => {
		const button = document.createElement('button');
		button.className = 'bg-white text-gray-700 py-2 px-4 rounded-full shadow-md flex-shrink-0';
		button.textContent = category.name;
		button.onclick = () => filterByCategory(category.id);
		container.appendChild(button);
	});
}

function updateCategoryFilters() {
	const buttons = document.querySelectorAll('#category-filters button');
	buttons.forEach((button, index) => {
		button.classList.remove('bg-blue-500', 'text-white');
		button.classList.add('bg-white', 'text-gray-700');
		
		if ((index === 0 && currentCategoryId === null) || 
			(index > 0 && button.textContent === categories.find(c => c.id === currentCategoryId)?.name)) {
			button.classList.remove('bg-white', 'text-gray-700');
			button.classList.add('bg-blue-500', 'text-white');
		}
	});
}

function filterByCategory(categoryId) {
	playSound('click'); // <-- Thêm âm thanh khi nhấn
	
	currentCategoryId = categoryId;
	currentCardIndex = 0;
	updateFlashcard();
	updateCategoryFilters();
}

function updateDailyProgress() {
	const progress = getUserProgress();
	const dailyGoal = 5; // 5 activities per day
	const completed = progress.dailyActivities || 0;
	const percent = Math.min(100, Math.round((completed / dailyGoal) * 100));
	
	document.getElementById('daily-progress-text').textContent = `${completed}/${dailyGoal} hoàn thành`;
	document.getElementById('daily-progress-bar').style.width = `${percent}%`;
}

// Load sample data
function loadSampleData() {
	// Sample data based on your JSON structure
	const sampleData = {
		categories: [
			{ id: 1, name: "Gia đình & Con người", color: "blue", progress: 0, wordCount: 55 },
			{ id: 14, name: "Danh từ chung", color: "grey", progress: 0, wordCount: 40 }
		],
		flashcards: [
			{ id: 1, english: "Family", vietnamese: "Gia đình", phonetic: "/ˈfæməli/", categoryId: 1, image: "family" },
			{ id: 2, english: "Father", vietnamese: "Bố", phonetic: "/ˈfɑːðər/", categoryId: 1, image: "father" },
			{ id: 3, english: "Mother", vietnamese: "Mẹ", phonetic: "/ˈmʌðər/", categoryId: 1, image: "mother" },
			{ id: 4, english: "Brother", vietnamese: "Anh trai/Em trai", phonetic: "/ˈbrʌðər/", categoryId: 1, image: "brother" },
			{ id: 5, english: "Sister", vietnamese: "Chị gái/Em gái", phonetic: "/ˈsɪstər/", categoryId: 1, image: "sister" },
			{ id: 6, english: "Book", vietnamese: "Sách", phonetic: "/bʊk/", categoryId: 14, image: "book" },
			{ id: 7, english: "Pen", vietnamese: "Bút", phonetic: "/pen/", categoryId: 14, image: "pen" },
			{ id: 8, english: "Table", vietnamese: "Bàn", phonetic: "/ˈteɪbəl/", categoryId: 14, image: "table" },
			{ id: 9, english: "Chair", vietnamese: "Ghế", phonetic: "/tʃeər/", categoryId: 14, image: "chair" },
			{ id: 10, english: "Window", vietnamese: "Cửa sổ", phonetic: "/ˈwɪndoʊ/", categoryId: 14, image: "window" }
		]
	};
	
	categories = sampleData.categories;
	flashcards = sampleData.flashcards;
	dataLoaded = true;
	
	// Assign random colors to categories
	assignRandomColorsToCategories();
	
	// Update category progress
	updateCategoryProgress();
	
	// Update UI
	loadCategories();
	loadCategoryFilters();
	updateFlashcard();
	updateCardCounter();
	updateCategoryProgressDisplay();
}

function loadGames() {
	const container = document.getElementById('games-container');
	container.innerHTML = '';
	
	games.forEach(game => {
		const colorClass = getGameColorClass(game.color);
		
		const gameElement = document.createElement('div');
		// Gán sự kiện onclick cho toàn bộ thẻ
		gameElement.setAttribute('onclick', `startGame(${game.id})`);
		
		gameElement.className = `game-card bg-gradient-to-br ${colorClass} rounded-2xl p-5 text-white shadow-lg cursor-pointer`;
		gameElement.innerHTML = `
			<div class="flex justify-between items-start mb-4">
				<h4 class="text-lg font-bold">${game.name}</h4>
				<span class="bg-white text-${game.color}-600 text-xs font-bold px-2 py-1 rounded-full">${game.difficulty}</span>
			</div>
			<p class="text-sm text-white text-opacity-90 mb-4">${game.description}</p>
			<div class="flex justify-between items-end">
				<div class="bg-white text-${game.color}-600 font-bold py-2 px-4 rounded-lg shadow-md">Chơi ngay</div>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-white opacity-80" viewBox="0 0 20 20" fill="currentColor">
					${getGameIcon(game.icon)}
				</svg>
			</div>
		`;
		
		container.appendChild(gameElement);
	});
}

function loadQuizTypes() {
	const container = document.getElementById('quiz-types');
	container.innerHTML = '';
	
	quizTypes.forEach(quiz => {
		const quizElement = document.createElement('div');
		quizElement.className = 'bg-white rounded-2xl p-6 shadow-md';
		quizElement.innerHTML = `
			<div class="flex items-center mb-4">
				<div class="w-12 h-12 rounded-full bg-${quiz.icon === 'document' ? 'blue' : 'purple'}-100 flex items-center justify-center mr-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-${quiz.icon === 'document' ? 'blue' : 'purple'}-500" viewBox="0 0 20 20" fill="currentColor">
						${getQuizIcon(quiz.icon)}
					</svg>
				</div>
				<h3 class="text-lg font-bold text-gray-800">${quiz.name}</h3>
			</div>
			<p class="text-gray-600 mb-6">${quiz.description}</p>
			<div class="flex justify-between items-center">
				<div>
					<span class="text-sm text-gray-500">Thời gian: ${quiz.time} phút</span>
					<div class="flex items-center mt-1">
						${getRatingStars(quiz.difficulty)}
					</div>
				</div>
				<button class="btn-primary text-white py-2 px-6 rounded-full shadow-md" onclick="startQuiz(${quiz.id})">Bắt đầu</button>
			</div>
		`;
		
		container.appendChild(quizElement);
	});
}

function loadBadges() {
	const container = document.getElementById('badges-container');
	container.innerHTML = '';
	
	// Update badge status based on user progress
	const progress = getUserProgress();
	
	// Update streak badge
	badges[0].achieved = progress.streakDays >= 7;
	
	// Update words learned badge
	const totalLearned = Object.keys(progress.completedWords).length;
	badges[1].achieved = totalLearned >= 100;
	if (!badges[1].achieved) {
		badges[1].progress = `${totalLearned}/100`;
	}
	
	// Update quiz completion badges
	const completedQuizzes = Object.keys(progress.completedQuizzes).length;
	badges[2].achieved = completedQuizzes >= 5;
	badges[3].achieved = completedQuizzes >= 10;
	if (!badges[2].achieved) {
		badges[2].progress = `${Math.min(completedQuizzes, 5)}/5`;
	}
	if (!badges[3].achieved) {
		badges[3].progress = `${Math.min(completedQuizzes, 10)}/10`;
	}
	
	badges.forEach(badge => {
		const badgeElement = document.createElement('div');
		badgeElement.className = 'bg-white rounded-2xl p-5 shadow-md text-center';
		badgeElement.innerHTML = `
			<div class="w-20 h-20 mx-auto rounded-full bg-${badge.color}-100 flex items-center justify-center mb-4 ${badge.achieved ? 'badge' : ''}">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-${badge.color}-500" viewBox="0 0 20 20" fill="currentColor">
					${getBadgeIcon(badge.icon)}
				</svg>
			</div>
			<h4 class="text-lg font-bold text-gray-800 mb-1">${badge.name}</h4>
			<p class="text-gray-600 text-sm mb-2">${badge.description}</p>
			${badge.achieved 
				? `<span class="bg-green-100 text-green-600 text-xs font-bold px-2 py-1 rounded-full">Đã đạt</span>`
				: `<span class="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">${badge.progress}</span>`
			}
		`;
		
		container.appendChild(badgeElement);
	});
}

function updateUserStats() {
	const progress = getUserProgress();
	
	// Update user level and XP
	document.getElementById('user-level').textContent = `Cấp ${userData.level}`;
	document.getElementById('xp-progress').textContent = `${userData.xp}/${userData.xpToNextLevel} XP`;
	document.getElementById('xp-bar').style.width = `${(userData.xp / userData.xpToNextLevel) * 100}%`;
	
	// Update learning stats
	const totalLearned = Object.keys(progress.completedWords).length;
	document.getElementById('words-learned').textContent = totalLearned;
	document.getElementById('study-time').textContent = userData.studyTime;
	document.getElementById('streak-days').textContent = progress.streakDays || 0;
}

function updateCategoryProgressDisplay() {
	const container = document.getElementById('category-progress-container');
	container.innerHTML = '';
	
	if (categories.length === 0) {
		container.innerHTML = '<p class="text-gray-500 text-center">Không có dữ liệu tiến độ.</p>';
		return;
	}
	
	categories.forEach(category => {
		const progress = getCategoryProgress(category.id);
		const colorClass = category.colorClass || getCategoryColorClass(category.color);
		const baseColor = colorClass.split(' ')[0].replace('from-', '');
		
		const categoryElement = document.createElement('div');
		categoryElement.className = 'mb-4';
		categoryElement.innerHTML = `
			<div class="flex justify-between items-center mb-1">
				<span class="font-semibold text-gray-700">${category.name}</span>
				<span class="text-sm text-${baseColor}-600">${progress}%</span>
			</div>
			<div class="w-full bg-gray-200 rounded-full h-2">
				<div class="bg-${baseColor}-500 h-2 rounded-full" style="width: ${progress}%"></div>
			</div>
		`;
		
		container.appendChild(categoryElement);
	});
}

function showCompletionMessage(score, activityId, categoryId, isQuiz = false) {
	const category = categories.find(c => c.id === categoryId);
	const activity = isQuiz 
		? quizTypes.find(q => q.id === activityId)
		: games.find(g => g.id === activityId);
	
	let title, message, iconColor;
	
	if (score >= 90) {
		title = "Xuất sắc!";
		message = "Bạn đã nắm vững các từ vựng này.";
		iconColor = "green";
	} else if (score >= 70) {
		title = "Tốt!";
		message = "Bạn đã học khá tốt các từ vựng này.";
		iconColor = "blue";
	} else {
		title = "Hoàn thành!";
		message = "Bạn cần ôn tập thêm các từ vựng này.";
		iconColor = "yellow";
	}
	
	document.getElementById('completion-title').textContent = title;
	document.getElementById('completion-message').textContent = 
		`Bạn đã hoàn thành ${isQuiz ? 'bài kiểm tra' : 'trò chơi'} "${activity.name}" với chủ đề "${category.name}" và đạt ${score}% điểm. ${message}`;
	
	openModal('completionModal');
	
	// Update UI
	loadCategories();
	updateCategoryProgressDisplay();
}

function createConfetti() {
	const confettiCount = 100;
	const colors = ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f'];
	
	for (let i = 0; i < confettiCount; i++) {
		const confetti = document.createElement('div');
		confetti.className = 'confetti';
		confetti.style.left = `${Math.random() * 100}vw`;
		confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
		confetti.style.width = `${Math.random() * 10 + 5}px`;
		confetti.style.height = `${Math.random() * 10 + 5}px`;
		confetti.style.animationDuration = `${Math.random() * 2 + 2}s`;
		document.body.appendChild(confetti);
		
		// Remove confetti after animation
		setTimeout(() => {
			confetti.remove();
		}, 4000);
	}
}

function disableCardControls() {
	isCardInteractable = true; // Dùng cờ để khóa thẻ
	document.getElementById('prev-card').disabled = true;
	document.getElementById('next-card').disabled = true;
}

function enableCardControls() {
	isCardInteractable = true; // Dùng cờ để mở khóa thẻ
	document.getElementById('prev-card').disabled = false;
	document.getElementById('next-card').disabled = false;
}

// ===================================================================================
// ===== 10. HÀM TIỆN ÍCH (UTILITIES)
// ===================================================================================

function assignRandomColorsToCategories() {
	categories.forEach((category, index) => {
		// Use modulo to cycle through colors if there are more categories than colors
		const colorIndex = index % categoryColors.length;
		category.colorClass = categoryColors[colorIndex];
	});
}

function getCategoryColorClass(color) {
	const colorMap = {
		'blue': 'from-blue-400 to-blue-600',
		'purple': 'from-purple-400 to-purple-600',
		'pink': 'from-pink-400 to-pink-600',
		'green': 'from-green-400 to-green-600',
		'yellow': 'from-yellow-400 to-yellow-600',
		'grey': 'from-gray-400 to-gray-600',
		'gray': 'from-gray-400 to-gray-600',
		'red': 'from-red-400 to-red-600',
		'indigo': 'from-indigo-400 to-indigo-600',
		'teal': 'from-teal-400 to-teal-600',
		'orange': 'from-orange-400 to-orange-600'
	};
	
	return colorMap[color] || categoryColors[Math.floor(Math.random() * categoryColors.length)];
}

function getGameColorClass(color) {
	const colorMap = {
		'blue': 'from-blue-400 to-blue-600',
		'purple': 'from-purple-400 to-purple-600',
		'pink': 'from-pink-400 to-pink-600',
		'green': 'from-green-400 to-green-600',
		'yellow': 'from-yellow-400 to-yellow-600',
		'red': 'from-red-400 to-red-600'
	};
	
	return colorMap[color] || 'from-blue-400 to-blue-600';
}

function getCategoryIcon(name) {
	const iconMap = {
		'Gia đình & Con người': '<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z"/>',
		'Danh từ chung': '<path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>'
	};
	
	return iconMap[name] || '<path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>';
}

function getImageIcon(image) {
	const iconMap = {
		'book': '<path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>',
		};
	
	return iconMap[image] || '<path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>';
}

function getGameIcon(icon) {
	const iconMap = {
		'puzzle': '<path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>',
		'image': '<path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>',
		'question': '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>'
	};
	
	return iconMap[icon] || '<path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>';
}

function getQuizIcon(icon) {
	const iconMap = {
		'document': '<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>',
		'question': '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>'
	};
	
	return iconMap[icon] || '<path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>';
}

function getBadgeIcon(icon) {
	const iconMap = {
		'star': '<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>',
		'badge': '<path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>',
		'book': '<path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>',
		'play': '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/>'
	};
	
	return iconMap[icon] || '<path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>';
}

function getRatingStars(rating) {
	let stars = '';
	for (let i = 0; i < 5; i++) {
		if (i < rating) {
			stars += `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
				<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
			</svg>`;
		} else {
			stars += `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
				<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
			</svg>`;
		}
	}
	return stars;
}

function getFilteredCards() {
	return currentCategoryId 
		? flashcards.filter(card => card.categoryId === currentCategoryId)
		: flashcards;
}

function processJSONInput() {
	const jsonUrl = document.getElementById('json-url').value.trim();
	const jsonData = document.getElementById('json-data').value.trim();
	
	if (jsonUrl) {
		// Fetch from URL
		showLoading();
		fetch(jsonUrl)
			.then(response => {
				if (!response.ok) {
					throw new Error('Không thể tải file JSON từ URL đã cung cấp.');
				}
				return response.json();
			})
			.then(data => {
				importData(data);
				closeModal('jsonFileModal');
				hideLoading();
			})
			.catch(error => {
				alert('Lỗi: ' + error.message);
				hideLoading();
			});
	} else if (jsonData) {
		// Parse direct input
		try {
			const data = JSON.parse(jsonData);
			importData(data);
			closeModal('jsonFileModal');
		} catch (error) {
			alert('Lỗi: Dữ liệu JSON không hợp lệ.');
		}
	} else {
		alert('Vui lòng nhập URL hoặc dữ liệu JSON.');
	}
}

function importData(data) {
	if (data.categories && Array.isArray(data.categories)) {
		// Merge with existing categories or replace them
		const existingCategoryIds = categories.map(c => c.id);
		const newCategories = data.categories.filter(c => !existingCategoryIds.includes(c.id));
		categories = [...categories, ...newCategories];
		
		// Assign random colors to new categories
		assignRandomColorsToCategories();
	}
	
	if (data.flashcards && Array.isArray(data.flashcards)) {
		// Merge with existing flashcards or replace them
		const existingFlashcardIds = flashcards.map(f => f.id);
		const newFlashcards = data.flashcards.filter(f => !existingFlashcardIds.includes(f.id));
		flashcards = [...flashcards, ...newFlashcards];
	}
	
	// Update category progress
	updateCategoryProgress();
	
	// Reload everything
	loadCategories();
	loadCategoryFilters();
	currentCardIndex = 0;
	updateFlashcard();
	
	alert('Đã tải dữ liệu thành công!');
}

function exportFlashcardsToJSON() {
	const data = {
		categories: categories,
		flashcards: flashcards
	};
	
	const jsonString = JSON.stringify(data, null, 2);
	
	// Create a blob and download link
	const blob = new Blob([jsonString], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	
	const a = document.createElement('a');
	a.href = url;
	a.download = `flashcards-${currentLevel}.json`;
	document.body.appendChild(a);
	a.click();
	
	// Clean up
	setTimeout(() => {
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, 0);
}

// ===================================================================================
// ===== 11. ĐỒNG HỒ ĐẾM NGƯỢC
// ===================================================================================
function updateTimerDisplay() {
	const minutes = Math.floor(timeRemaining / 60);
	const seconds = timeRemaining % 60;
	document.getElementById('daily-timer-display').textContent = 
		`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function tick() {
	if (timeRemaining > 0) {
		timeRemaining--;
		updateTimerDisplay();
	} else {
		pauseDailyTimer();
		document.getElementById('timer-status-text').textContent = "Đã hết thời gian học hôm nay!";
		alert("Chúc mừng! Bạn đã hoàn thành 10 phút học tập hôm nay.");
	}
}

function startDailyTimer() {
	if (isTimerRunning || timeRemaining <= 0) return; // Không chạy nếu đã chạy hoặc đã hết giờ
	
	isTimerRunning = true;
	dailyTimerInterval = setInterval(tick, 1000);
	
	document.getElementById('pause-icon').classList.remove('hidden');
	document.getElementById('play-icon').classList.add('hidden');
	document.getElementById('timer-status-text').textContent = "Thời gian đang đếm ngược...";
	
	// Nếu đang ở tab flashcards, bắt đầu theo dõi không hoạt động
	if (document.getElementById('flashcards').classList.contains('hidden') === false) {
		resetFlashcardInactivityTimer();
	}
}

function pauseDailyTimer() {
	isTimerRunning = false;
	clearInterval(dailyTimerInterval);
	clearTimeout(flashcardActivityTimeout); // Xóa luôn bộ đếm không hoạt động
	
	document.getElementById('pause-icon').classList.add('hidden');
	document.getElementById('play-icon').classList.remove('hidden');
	document.getElementById('timer-status-text').textContent = "Đồng hồ đã tạm dừng.";
}

function toggleTimer() {
	if (isTimerRunning) {
		pauseDailyTimer();
	} else {
		startDailyTimer();
	}
}

function resetFlashcardInactivityTimer() {
	// Xóa bộ đếm cũ
	clearTimeout(flashcardActivityTimeout);
	
	// Đặt bộ đếm mới, nếu sau 10 giây không có hành động, sẽ tạm dừng đồng hồ
	flashcardActivityTimeout = setTimeout(() => {
		if (isTimerRunning) {
			pauseDailyTimer();
			console.log("Timer paused due to inactivity on flashcards.");
		}
	}, INACTIVITY_DELAY);
}


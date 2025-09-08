// ===================================================================================
// GIAI ĐOẠN 1: XÂY DỰNG NỀN MÓNG & BỘ KHUNG
// ===================================================================================

/**
 * @description Chứa các hằng số và cấu hình không thay đổi trong suốt quá trình chạy.
 */
const config = {
    APP_VERSION: '1.1_0908_3_REFACTORED', // Đặt phiên bản mới cho ứng dụng tái cấu trúc
    MASTERY_THRESHOLD: 3,
    INACTIVITY_DELAY: 10000, // 10 giây

    // Tập trung các key của localStorage vào một nơi
    LOCAL_STORAGE_KEYS: {
        APP_VERSION: 'flashkids_app_version',
        PROGRESS: 'flashkids_progress',
        LAST_VERSION_CHECK: 'last_version_check',
        CURRENT_LEVEL: 'flashkids_currentLevel',
        LEVEL_DATA_PREFIX: 'flashkids_level_',
        AUDIO_CACHE_PREFIX: 'audio_'
    },

    // Dữ liệu tĩnh của ứng dụng
    categoryColors: [
        'from-blue-400 to-blue-600', 'from-purple-400 to-purple-600', 'from-pink-400 to-pink-600',
        'from-green-400 to-green-600', 'from-yellow-400 to-yellow-600', 'from-red-400 to-red-600',
        'from-indigo-400 to-indigo-600', 'from-teal-400 to-teal-600', 'from-orange-400 to-orange-600',
        'from-cyan-400 to-cyan-600', 'from-lime-400 to-lime-600', 'from-amber-400 to-amber-600',
        'from-emerald-400 to-emerald-600', 'from-fuchsia-400 to-fuchsia-600', 'from-rose-400 to-rose-600',
        'from-sky-400 to-sky-600', 'from-violet-400 to-violet-600'
    ],
    games: [
        { id: 1, name: 'Ghép từ', description: 'Ghép từ tiếng Anh với nghĩa tiếng Việt tương ứng', difficulty: 'Dễ', color: 'blue', icon: 'puzzle' },
        { id: 2, name: 'Chọn từ', description: 'Chọn từ vựng tương ứng với hình ảnh minh họa', difficulty: 'Trung bình', color: 'purple', icon: 'image' },	
        { id: 4, name: 'Ghép Âm thanh & Từ', description: 'Lắng nghe và ghép cặp âm thanh với từ vựng đúng', difficulty: 'Trung bình', color: 'emerald', icon: 'volume-up' },
        { id: 3, name: 'Điền từ', description: 'Chọn chữ cái đúng để hoàn thành từ', difficulty: 'Khó', color: 'red', icon: 'question' }
    ],
    quizTypes: [
        { id: 1, name: 'Trắc nghiệm (+1 điểm)', description: 'Chọn đáp án đúng cho từng câu hỏi.', time: 10, difficulty: 3, icon: 'document' },
        { id: 3, name: 'Đọc hiểu (+2 điểm)', description: 'Đọc câu và chọn từ đúng để điền vào chỗ trống.', time: 5, difficulty: 4, icon: 'book-open' },
        { id: 2, name: 'Xếp chữ (+3 điểm)', description: 'Sắp xếp các chữ cái thành từ đúng.', time: 5, difficulty: 5, icon: 'question' }	
    ],
    badges: [
        { id: 1, name: 'Siêu sao', description: 'Học 7 ngày liên tục', achieved: true, icon: 'star', color: 'yellow' },
        { id: 2, name: 'Nhà từ vựng', description: 'Học 100 từ mới', achieved: true, icon: 'badge', color: 'green' },
        { id: 3, name: 'Học sinh giỏi', description: 'Hoàn thành 5 bài kiểm tra', achieved: true, icon: 'book', color: 'blue' },
        { id: 4, name: 'Chuyên gia', description: 'Hoàn thành 10 bài kiểm tra', achieved: false, progress: '5/10', icon: 'play', color: 'gray' }
    ]
};

/**
 * @description Chứa toàn bộ trạng thái động (dữ liệu thay đổi) của ứng dụng.
 */
const state = {
    // Dữ liệu chính, sẽ được tải từ server
    categories: [],
    flashcards: [],
    flashcardCache: {}, // Cache dữ liệu level trong bộ nhớ

    // Trạng thái điều hướng & Giao diện người dùng
    isCardInteractable: true,
    currentCategoryId: null,
    currentCardIndex: 0,
    currentLevel: 'a1', // Level mặc định khi bắt đầu
    isFlashcardsTabActive: false,
    
    // Trạng thái âm thanh
    soundEnabled: true,
    currentAudio: null, // Theo dõi file MP3 đang phát
    ttsToolAudio: null, // Theo dõi âm thanh của công cụ TTS
    lastSpokenAudio: { lang: null, text: null },

    // Trạng thái hoạt động hiện tại (đang chơi game hay quiz nào)
    currentActivity: null,

    // Trạng thái riêng cho từng game, được nhóm vào một đối tượng
    games: {
        matching: {
            selectedEnglishWord: null,
            selectedVietnameseWord: null,
            matchedPairs: [],
        },
        imageQuiz: {
            questions: [],
            currentQuestionIndex: 0,
            score: 0,
        },
        unscramble: {
            targetWord: '',
            targetWordId: null,
            wordPool: [],
            lastWordId: null,
        },
        soundMatch: {
            selectedCards: [],
            isChecking: false,
            wordPool: [],
        },
        fillBlank: {
            targetWord: '',
            wordPool: [],
            lastWordId: null,
        }
    },

    // Trạng thái của đồng hồ bấm giờ
    timer: {
        interval: null,
        timeRemaining: 600, // 10 phút
        isRunning: false,
        inactivityTimeout: null
    },

    // Các đối tượng biểu đồ để có thể hủy và vẽ lại
    charts: {
        activity: null,
        mastery: null,
    }
};

/**
 * @description Lưu trữ các tham chiếu đến các phần tử DOM thường xuyên sử dụng để tối ưu hiệu năng.
 * Sẽ được nạp đầy bởi hàm cacheDOMElements().
 */
const dom = {};

/**
 * @description Tìm và cache các phần tử DOM vào đối tượng `dom` để tránh truy vấn lặp lại.
 */
function cacheDOMElements() {
    // --- Các thành phần chính của ứng dụng ---
    dom.loadingIndicator = document.getElementById('loading-indicator');
    dom.tabs = document.querySelectorAll('.tab-content');
    dom.navButtons = document.querySelectorAll('nav button');
    dom.userAvatar = document.getElementById('user-avatar');
    dom.userMenuButton = document.getElementById('user-menu-button');
    dom.userMenu = document.getElementById('user-menu');
    dom.menuSettingsLink = document.getElementById('menu-settings-link');

    // --- Tab Trang chủ (Home) ---
    dom.welcomeMessage = document.getElementById('welcome-message');
    dom.levelBadges = document.querySelectorAll('.level-badge');
    dom.startNowBtn = document.getElementById('start-now-btn');
    dom.categoriesContainer = document.getElementById('categories-container');
    
    // --- Tab Thẻ từ vựng (Flashcards) ---
    dom.categoryFilters = document.getElementById('category-filters');
    dom.currentFlashcard = document.getElementById('current-flashcard');
    dom.englishWord = document.getElementById('english-word');
    dom.vietnameseWord = document.getElementById('vietnamese-word');
    dom.phoneticText = document.getElementById('phonetic-text');
    dom.cardImage = document.getElementById('card-image');
    dom.flashcardBack = document.querySelector('.flashcard-back');
    dom.cardCounter = document.getElementById('card-counter');
    dom.prevCardBtn = document.getElementById('prev-card');
    dom.nextCardBtn = document.getElementById('next-card');
    dom.markLearnedBtn = document.getElementById('mark-learned-btn');

    // --- Tab Trò chơi & Kiểm tra ---
    dom.gamesContainer = document.getElementById('games-container');
    dom.quizTypesContainer = document.getElementById('quiz-types');
    
    // --- Tab Phần thưởng ---
    dom.xpLevel = document.getElementById('xp-level');
    dom.xpText = document.getElementById('xp-text');
    dom.xpBar = document.getElementById('xp-bar');
    dom.badgesContainer = document.getElementById('badges-container');
    
    // --- Tab Thống kê ---
    dom.wordsLearned = document.getElementById('words-learned');
    dom.streakDays = document.getElementById('streak-days');
    dom.masteryChartCanvas = document.getElementById('mastery-chart');
    dom.activityHeatmap = document.getElementById('activity-heatmap');
    dom.categoryProgressContainer = document.getElementById('category-progress-container');

    // --- Tab Cài đặt (Settings) ---
    // dom.soundToggle = document.getElementById('sound-toggle');
    // dom.usernameInput = document.getElementById('username');
    // dom.ageInput = document.getElementById('age');
    
    // --- Các Modals ---
    dom.modals = document.querySelectorAll('.modal');
    dom.categorySelectionContainer = document.getElementById('category-selection-container');
}


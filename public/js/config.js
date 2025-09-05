// public/js/config.js

// Tệp này chứa các hằng số và dữ liệu cấu hình tĩnh cho toàn bộ ứng dụng.
// Việc tách ra giúp dễ dàng quản lý và thay đổi các giá trị này mà không cần động vào logic chính.

export const APP_VERSION = '1.2_4'; // Tăng phiên bản sau khi tái cấu trúc
export const MASTERY_THRESHOLD = 4; // Ngưỡng điểm để coi là "thông thạo" một từ
export const INACTIVITY_DELAY = 10000; // 10 giây không hoạt động thì dừng timer

export const GAMES_CONFIG = [
    { id: 1, name: 'Ghép từ', description: 'Ghép từ tiếng Anh với nghĩa tiếng Việt tương ứng', difficulty: 'Dễ', color: 'blue', icon: 'puzzle' },
    { id: 2, name: 'Chọn từ', description: 'Chọn từ vựng tương ứng với hình ảnh minh họa', difficulty: 'Trung bình', color: 'purple', icon: 'image' },
    { id: 4, name: 'Ghép Âm thanh & Từ', description: 'Lắng nghe và ghép cặp âm thanh với từ vựng đúng', difficulty: 'Trung bình', color: 'emerald', icon: 'volume-up' },
    { id: 3, name: 'Điền từ', description: 'Chọn chữ cái đúng để hoàn thành từ', difficulty: 'Khó', color: 'red', icon: 'question' }
];

export const QUIZ_CONFIG = [
    { id: 1, name: 'Trắc nghiệm (+1 điểm)', description: 'Chọn đáp án đúng cho từng câu hỏi.', time: 10, difficulty: 3, icon: 'document' },
    { id: 3, name: 'Đọc hiểu (+2 điểm)', description: 'Đọc câu và chọn từ đúng để điền vào chỗ trống.', time: 5, difficulty: 4, icon: 'book-open' },
    { id: 2, name: 'Xếp chữ (+3 điểm)', description: 'Sắp xếp các chữ cái thành từ đúng.', time: 5, difficulty: 5, icon: 'question' }
];

export const BADGES_CONFIG = [
    { id: 1, name: 'Siêu sao', description: 'Học 7 ngày liên tục', achieved: false, icon: 'star', color: 'yellow' },
    { id: 2, name: 'Nhà từ vựng', description: 'Học 100 từ mới', achieved: false, icon: 'badge', color: 'green' },
    { id: 3, name: 'Học sinh giỏi', description: 'Hoàn thành 5 bài kiểm tra', achieved: false, icon: 'book', color: 'blue' },
    { id: 4, name: 'Chuyên gia', description: 'Hoàn thành 10 bài kiểm tra', achieved: false, progress: '0/10', icon: 'play', color: 'gray' }
];

export const CATEGORY_COLORS = [
    'from-blue-400 to-blue-600', 'from-purple-400 to-purple-600', 'from-pink-400 to-pink-600',
    'from-green-400 to-green-600', 'from-yellow-400 to-yellow-600', 'from-red-400 to-red-600',
    'from-indigo-400 to-indigo-600', 'from-teal-400 to-teal-600', 'from-orange-400 to-orange-600',
    'from-cyan-400 to-cyan-600', 'from-lime-400 to-lime-600', 'from-amber-400 to-amber-600',
    'from-emerald-400 to-emerald-600', 'from-fuchsia-400 to-fuchsia-600', 'from-rose-400 to-rose-600',
    'from-sky-400 to-sky-600', 'from-violet-400 to-violet-600'
];

export const AVAILABLE_AVATARS = [
    'https://upload.wikimedia.org/wikipedia/commons/1/14/H%C6%B0%C6%A1u_cao_c%E1%BB%95.png',
    // Thêm các URL avatar khác ở đây nếu muốn
];
// public/js/quiz.js
// Module này chứa logic cho tất cả các bài kiểm tra (quizzes).
// Tương tự games.js, mỗi hàm quiz sẽ tự quản lý giao diện bên trong modal của nó.

import { playSound, speakWord } from './audio.js';
import { updateMasteryScore } from './state.js';

/**
 * Xáo trộn một mảng (thuật toán Fisher-Yates).
 * @param {Array} array - Mảng cần xáo trộn.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// =======================================================
// == QUIZ 1: TRẮC NGHIỆM (MULTIPLE CHOICE) ==
// =======================================================

/**
 * Khởi động bài kiểm tra trắc nghiệm.
 * @param {Array} allCards - Tất cả các thẻ trong level (để tạo đáp án sai).
 * @param {Array} categoryCards - Các thẻ trong chủ đề đã chọn.
 * @param {Function} onQuizEnd - Callback khi quiz kết thúc.
 */
export function startMultipleChoiceQuiz(allCards, categoryCards, onQuizEnd) {
    const quizContainer = document.getElementById('quiz-container');
    if (categoryCards.length < 4) {
        quizContainer.innerHTML = `<p class="text-center text-red-500">Cần ít nhất 4 từ để bắt đầu quiz này.</p>`;
        setTimeout(() => onQuizEnd(false, 0), 2000);
        return;
    }
    
    let currentQuestionIndex = 0;
    let score = 0;
    const questions = categoryCards.slice(0, 10); // Tối đa 10 câu mỗi lần
    shuffleArray(questions);
    
    function renderQuestion() {
        const questionCard = questions[currentQuestionIndex];
        
        // Tạo các lựa chọn sai từ tất cả các thẻ trong level
        let distractors = allCards
            .filter(c => c.id !== questionCard.id)
            .map(c => c.meaning);
        shuffleArray(distractors);
        
        let options = [questionCard.meaning, ...distractors.slice(0, 3)];
        shuffleArray(options);
        
        quizContainer.innerHTML = `
            <p class="text-center text-gray-600 mb-2">Câu ${currentQuestionIndex + 1}/${questions.length}</p>
            <div class="text-center mb-6">
                <p class="text-lg text-gray-600">Từ nào có nghĩa là:</p>
                <h3 class="text-4xl font-bold my-2">${questionCard.word}</h3>
                <button id="speak-quiz-word" class="text-blue-500 text-2xl hover:text-blue-700 transition-colors">🔊</button>
            </div>
            <div class="grid grid-cols-2 gap-4">
                ${options.map(opt => `
                    <button class="quiz-option p-4 bg-gray-100 rounded-lg text-lg font-semibold hover:bg-blue-100 transition-colors" data-answer="${opt === questionCard.meaning}">
                        ${opt}
                    </button>
                `).join('')}
            </div>
        `;
        
        document.getElementById('speak-quiz-word').addEventListener('click', () => speakWord(questionCard.word, 'en-US'));
        quizContainer.querySelectorAll('.quiz-option').forEach(btn => btn.addEventListener('click', handleAnswer));
    }
    
    function handleAnswer(e) {
        const isCorrect = e.currentTarget.dataset.answer === 'true';
        
        quizContainer.querySelectorAll('.quiz-option').forEach(btn => btn.disabled = true);
        
        if (isCorrect) {
            playSound('success');
            e.currentTarget.classList.add('correct');
            score++;
            updateMasteryScore(questions[currentQuestionIndex].id, 1); // +1 điểm
        } else {
            playSound('error');
            e.currentTarget.classList.add('incorrect');
            // Hiển thị đáp án đúng
            const correctBtn = quizContainer.querySelector('[data-answer="true"]');
            if (correctBtn) correctBtn.classList.add('correct');
        }
        
        setTimeout(nextQuestion, 1500);
    }
    
    function nextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            renderQuestion();
        } else {
            const xpGained = score * 10; // 10XP cho mỗi câu đúng
            onQuizEnd(true, xpGained);
        }
    }
    
    renderQuestion();
}

// =======================================================
// == QUIZ 2: XẾP CHỮ (UNSCRAMBLE) ==
// =======================================================

/**
 * Khởi động bài kiểm tra xếp chữ.
 * @param {Array} words - Các từ phù hợp cho bài kiểm tra này.
 */
export function startUnscrambleQuiz(words) {
    const quizContainer = document.getElementById('quiz-container');
    const suitableWords = words.filter(w => w.word.length > 3 && w.word.length < 8);
    if (suitableWords.length < 1) {
        quizContainer.innerHTML = `<p class="text-center text-red-500">Không có từ vựng phù hợp cho quiz này.</p>`;
        return;
    }

    let currentWord = suitableWords[Math.floor(Math.random() * suitableWords.length)];
    let targetWord = currentWord.word.toUpperCase();
    
    speakWord(currentWord.meaning, 'vi-VN');
    
    const scrambledLetters = targetWord.split('').sort(() => Math.random() - 0.5);

    quizContainer.innerHTML = `
        <p class="text-center text-gray-600 mb-4 text-xl">Sắp xếp các chữ cái để tạo thành từ có nghĩa: <strong>${currentWord.meaning}</strong></p>
        <div id="unscramble-answer-area" class="flex justify-center gap-2 mb-6 h-16">
            ${targetWord.split('').map(() => `<div class="answer-slot"></div>`).join('')}
        </div>
        <div id="unscramble-letter-tiles" class="flex justify-center gap-3 flex-wrap">
            ${scrambledLetters.map(letter => `<button class="letter-tile">${letter}</button>`).join('')}
        </div>
        <div class="text-center mt-6">
            <button id="unscramble-listen-btn" class="px-4 py-2 bg-blue-500 text-white rounded-lg">Nghe lại từ</button>
        </div>
    `;

    document.getElementById('unscramble-listen-btn').onclick = () => speakWord(targetWord, 'en-US');
    
    const letterTilesArea = document.getElementById('unscramble-letter-tiles');
    const answerArea = document.getElementById('unscramble-answer-area');

    letterTilesArea.querySelectorAll('.letter-tile').forEach(tile => tile.addEventListener('click', () => moveLetter(tile)));
    answerArea.querySelectorAll('.answer-slot').forEach(slot => slot.addEventListener('click', () => moveLetter(slot.firstChild)));

    function moveLetter(tile) {
        if (!tile) return;
        playSound('click');
        const targetContainer = tile.parentElement === letterTilesArea ? answerArea.querySelector('.answer-slot:empty') : letterTilesArea;
        if(targetContainer) targetContainer.appendChild(tile);
        checkAnswer();
    }

    function checkAnswer() {
        const slots = answerArea.querySelectorAll('.answer-slot');
        if ([...slots].every(slot => slot.firstChild)) {
            const userAnswer = [...slots].map(slot => slot.firstChild.textContent).join('');
            if (userAnswer === targetWord) {
                playSound('tada');
                updateMasteryScore(currentWord.id, 3); // +3 điểm
                slots.forEach(slot => slot.firstChild.classList.add('correct'));
                setTimeout(() => startUnscrambleQuiz(words), 1500);
            } else {
                playSound('fail');
                answerArea.classList.add('shake-animation');
                setTimeout(() => {
                    answerArea.classList.remove('shake-animation');
                    slots.forEach(slot => {
                        if (slot.firstChild) letterTilesArea.appendChild(slot.firstChild);
                    });
                }, 800);
            }
        }
    }
}


// =======================================================
// == QUIZ 3: ĐỌC HIỂU (READING COMPREHENSION) ==
// =======================================================

/**
 * Khởi động bài kiểm tra đọc hiểu.
 * @param {Array} allCards - Tất cả các thẻ trong level.
 * @param {Array} categoryCards - Các thẻ trong chủ đề đã chọn.
 * @param {Function} onQuizEnd - Callback khi kết thúc.
 */
export function startReadingQuiz(allCards, categoryCards, onQuizEnd) {
    const quizContainer = document.getElementById('quiz-container');
    const suitableWords = categoryCards.filter(w => w.example);
    if (suitableWords.length === 0) {
        quizContainer.innerHTML = `<p class="text-center text-red-500">Chủ đề này chưa có câu ví dụ để làm bài đọc hiểu.</p>`;
        setTimeout(() => onQuizEnd(false, 0), 2000);
        return;
    }

    let questions = suitableWords.slice(0, 5); // Tối đa 5 câu
    shuffleArray(questions);
    let currentQuestionIndex = 0;
    let score = 0;

    function displayQuestion() {
        if (currentQuestionIndex >= questions.length) {
            const xpGained = score * 20; // 20XP cho mỗi câu đúng
            onQuizEnd(true, xpGained);
            return;
        }

        const question = questions[currentQuestionIndex];
        const placeholder = `<span class="text-blue-500 font-bold mx-2">_________</span>`;
        const sentenceHTML = question.example.replace(/___/g, placeholder);
        
        const options = [question];
        const distractors = allCards.filter(c => c.id !== question.id && c.categoryId === question.categoryId);
        shuffleArray(distractors);
        while (options.length < 4 && distractors.length > 0) {
            options.push(distractors.pop());
        }
        shuffleArray(options);

        quizContainer.innerHTML = `
            <p class="text-center text-gray-600 mb-2">Câu ${currentQuestionIndex + 1}/${questions.length}</p>
            <div class="sentence-container bg-gray-100 p-6 rounded-lg mb-6 text-center text-xl md:text-2xl leading-relaxed">
                ${sentenceHTML}
            </div>
            <div class="grid grid-cols-2 gap-4">
                ${options.map(opt => `
                    <button class="quiz-option p-4 border rounded-lg text-lg font-semibold bg-white" data-word-id="${opt.id}">
                        ${opt.word}
                    </button>
                `).join('')}
            </div>
        `;
        quizContainer.querySelectorAll('.quiz-option').forEach(btn => btn.addEventListener('click', handleAnswer));
    }

    function handleAnswer(e) {
        const selectedId = parseInt(e.currentTarget.dataset.wordId);
        const correctId = questions[currentQuestionIndex].id;
        
        quizContainer.querySelectorAll('.quiz-option').forEach(btn => btn.disabled = true);

        if (selectedId === correctId) {
            playSound('success');
            e.currentTarget.classList.add('correct');
            score++;
            updateMasteryScore(correctId, 2); // +2 điểm
        } else {
            playSound('fail');
            e.currentTarget.classList.add('incorrect');
            const correctBtn = quizContainer.querySelector(`[data-word-id="${correctId}"]`);
            if (correctBtn) correctBtn.classList.add('correct');
        }

        setTimeout(() => {
            currentQuestionIndex++;
            displayQuestion();
        }, 1500);
    }
    
    displayQuestion();
}
// File: public/js/quiz.js
// Nhiệm vụ: Chứa logic cho tất cả các bài kiểm tra (quizzes).

import { playSound, speakWord } from './audio.js';
import { updateMasteryScore } from './state.js';
import { openModal, closeModal } from './dom.js';

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
// == QUIZ 1: TRẮC NGHIỆM (MULTIPLE CHOICE)
// =======================================================

export function startMultipleChoiceQuiz(allCards, categoryCards, onQuizEnd) {
    const quizWords = [...categoryCards].sort(() => 0.5 - Math.random()).slice(0, 10);
    const questionsContainer = document.getElementById('quiz-questions');
    questionsContainer.innerHTML = '';

    quizWords.forEach((word, index) => {
        const distractors = allCards.filter(w => w.id !== word.id);
        shuffleArray(distractors);
        const options = [word.vietnamese, ...distractors.slice(0, 3).map(d => d.vietnamese)];
        shuffleArray(options);

        const questionEl = document.createElement('div');
        questionEl.className = 'bg-white p-4 rounded-lg shadow';
        questionEl.dataset.wordId = word.id;
        questionEl.dataset.correct = word.vietnamese;
        
        let optionsHTML = '';
        options.forEach(option => {
            optionsHTML += `<div class="quiz-option p-2 border rounded-lg" data-value="${option}" onclick="selectQuizOption(this)">
                <label class="flex items-center cursor-pointer">
                    <input type="radio" name="q${index}" value="${option}" class="mr-2 hidden">
                    <span class="text-gray-700">${option}</span>
                </label>
            </div>`;
        });
        
        questionEl.innerHTML = `
            <h4 class="font-bold text-gray-800 mb-3">${index + 1}. ${word.english}</h4>
            <div class="grid grid-cols-2 gap-3">${optionsHTML}</div>`;
        questionsContainer.appendChild(questionEl);
    });

    document.getElementById('submit-quiz').onclick = () => checkQuizAnswers(onQuizEnd);
    openModal('multipleChoiceQuizModal');
}

// Hàm này cần được gọi từ global scope bởi onclick
window.selectQuizOption = function(optionElement) {
    playSound('click');
    const questionElement = optionElement.closest('.bg-white');
    questionElement.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('selected'));
    optionElement.classList.add('selected');
}

function checkQuizAnswers(onQuizEnd) {
    const questions = document.querySelectorAll('#quiz-questions > div');
    let correctCount = 0;
    
    questions.forEach(q => {
        const selectedOption = q.querySelector('.quiz-option.selected');
        if (selectedOption && selectedOption.dataset.value === q.dataset.correct) {
            correctCount++;
            updateMasteryScore(parseInt(q.dataset.wordId), 1);
            selectedOption.classList.add('correct');
        } else if (selectedOption) {
            selectedOption.classList.add('incorrect');
            q.querySelector(`[data-value="${q.dataset.correct}"]`)?.classList.add('correct');
        }
    });

    if (correctCount === questions.length) playSound('tada');
    else playSound('success');

    // Chuyển sang onGameEnd sau một khoảng trễ để người dùng xem kết quả
    setTimeout(() => onGameEnd(true, correctCount * 10), 2000);
}


// =======================================================
// == QUIZ 2: XẾP CHỮ (UNSCRAMBLE)
// =======================================================

export function startUnscrambleQuiz(words) {
    const suitableWords = words.filter(w => w.english.length > 3 && w.english.length < 8);
    if (suitableWords.length === 0) {
        alert("Chủ đề này không có từ phù hợp cho game Xếp chữ.");
        return closeModal('unscrambleGameModal');
    }

    const currentWord = suitableWords[Math.floor(Math.random() * suitableWords.length)];
    const targetWord = currentWord.english.toUpperCase();
    
    speakWord(currentWord.vietnamese, 'vi-VN');
    
    const scrambledLetters = targetWord.split('').sort(() => Math.random() - 0.5);
    const answerArea = document.getElementById('unscramble-answer-area');
    const letterTilesArea = document.getElementById('unscramble-letter-tiles');
    answerArea.innerHTML = '';
    letterTilesArea.innerHTML = '';

    // Tạo các ô trống
    for (let i = 0; i < targetWord.length; i++) {
        const slot = document.createElement('div');
        slot.className = 'answer-slot';
        slot.onclick = (e) => moveLetter(e.currentTarget.firstChild, letterTilesArea);
        answerArea.appendChild(slot);
    }

    // Tạo các chữ cái
    scrambledLetters.forEach(letter => {
        const tile = document.createElement('div');
        tile.className = 'letter-tile';
        tile.textContent = letter;
        tile.onclick = (e) => {
            const emptySlot = answerArea.querySelector('.answer-slot:empty');
            if (emptySlot) moveLetter(e.currentTarget, emptySlot);
        };
        letterTilesArea.appendChild(tile);
    });

    document.getElementById('check-unscramble-btn').onclick = () => checkUnscrambleAnswer(targetWord, currentWord.id);
    document.getElementById('unscramble-listen-btn').onclick = () => speakWord(targetWord, 'en-US');

    openModal('unscrambleGameModal');
}

function moveLetter(tile, targetContainer) {
    if (!tile) return;
    playSound('click');
    targetContainer.appendChild(tile);
}

function checkUnscrambleAnswer(targetWord, wordId) {
    const answerArea = document.getElementById('unscramble-answer-area');
    const userAnswer = Array.from(answerArea.children).map(slot => slot.textContent).join('');

    if (userAnswer === targetWord) {
        playSound('tada');
        updateMasteryScore(wordId, 3);
        speakWord(targetWord, 'en-US');
        setTimeout(() => startUnscrambleQuiz(), 1500); // Tự động bắt đầu từ mới
    } else {
        playSound('fail');
        answerArea.classList.add('error');
        setTimeout(() => answerArea.classList.remove('error'), 500);
    }
}


// =======================================================
// == QUIZ 3: ĐỌC HIỂU (READING COMPREHENSION)
// =======================================================

export function startReadingQuiz(allCards, categoryCards, onQuizEnd) {
    // Trong action.js, trường này là 'exampleSentence'
    const suitableWords = categoryCards.filter(w => w.exampleSentence);
    if (suitableWords.length === 0) {
        alert("Chủ đề này chưa có câu ví dụ để làm bài đọc hiểu.");
        return onQuizEnd(false, 0);
    }
    
    let score = 0;
    const questions = [...suitableWords].sort(() => 0.5 - Math.random()).slice(0, 5);
    let currentQuestionIndex = 0;

    function displayQuestion() {
        if (currentQuestionIndex >= questions.length) {
            onGameEnd(true, score * 20);
            return;
        }

        const question = questions[currentQuestionIndex];
        const sentenceContainer = document.getElementById('reading-quiz-sentence-container');
        const optionsContainer = document.getElementById('reading-quiz-options-container');

        const sentenceHTML = question.exampleSentence.replace('___', `<span class="text-blue-500 font-bold mx-2">_________</span>`);
        sentenceContainer.innerHTML = sentenceHTML;

        const distractors = allCards.filter(c => c.id !== question.id && c.categoryId === question.categoryId);
        shuffleArray(distractors);
        const options = [question, ...distractors.slice(0, 3)];
        shuffleArray(options);

        optionsContainer.innerHTML = '';
        options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option p-4 border rounded-lg text-lg font-semibold bg-white';
            btn.textContent = option.english;
            btn.onclick = () => handleAnswer(btn, option.id === question.id, question);
            optionsContainer.appendChild(btn);
        });
    }

    function handleAnswer(button, isCorrect, correctWord) {
        playSound('click');
        document.querySelectorAll('#reading-quiz-options-container button').forEach(btn => btn.disabled = true);

        if (isCorrect) {
            button.classList.add('correct');
            score++;
            playSound('success_2');
            updateMasteryScore(correctWord.id, 2);
        } else {
            button.classList.add('incorrect');
            playSound('fail');
            document.querySelector(`#reading-quiz-options-container button[data-word-id="${correctWord.id}"]`)?.classList.add('correct');
        }

        setTimeout(() => {
            currentQuestionIndex++;
            displayQuestion();
        }, 2000);
    }
    
    displayQuestion();
    openModal('readingQuizModal');
}
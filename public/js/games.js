// File: public/js/games.js (PHIÊN BẢN SỬA LỖI LOGIC GAME)
// Nhiệm vụ: Chứa logic cho tất cả các mini-game tương tác.

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
// == GAME 1 & 2 - Không thay đổi
// =======================================================

export function startMatchingGame(words, onGameEnd) {
    // ... (Logic của game này vẫn giữ nguyên)
    let selectedEnglishWord = null;
    let selectedVietnameseWord = null;
    let matchedPairs = [];
    const gameWords = [...words].sort(() => 0.5 - Math.random()).slice(0, 5);
    const englishContainer = document.getElementById('english-words');
    const vietnameseContainer = document.getElementById('vietnamese-words');
    englishContainer.innerHTML = '';
    vietnameseContainer.innerHTML = '';
    const shuffledVietnamese = [...gameWords].sort(() => 0.5 - Math.random());
    gameWords.forEach(word => {
        const wordEl = document.createElement('div');
        wordEl.className = 'word-card bg-blue-100 p-3 rounded-lg text-blue-800 font-semibold';
        wordEl.dataset.wordId = word.id;
        wordEl.textContent = word.english;
        wordEl.onclick = (e) => selectWord(e.currentTarget, word.id, 'english');
        englishContainer.appendChild(wordEl);
    });
    shuffledVietnamese.forEach(word => {
        const wordEl = document.createElement('div');
        wordEl.className = 'word-card bg-gray-100 p-3 rounded-lg text-gray-800';
        wordEl.dataset.wordId = word.id;
        wordEl.textContent = word.vietnamese;
        wordEl.onclick = (e) => selectWord(e.currentTarget, word.id, 'vietnamese');
        vietnameseContainer.appendChild(wordEl);
    });
    function selectWord(element, wordId, type) {
        speakWord(element.textContent, type === 'english' ? 'en-US' : 'vi-VN');
        if (element.classList.contains('matched')) return;
        const containerId = type === 'english' ? 'english-words' : 'vietnamese-words';
        document.querySelectorAll(`#${containerId} .word-card.selected`).forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
        if (type === 'english') selectedEnglishWord = wordId;
        else selectedVietnameseWord = wordId;
        if (selectedEnglishWord && selectedVietnameseWord) checkWordMatch();
    }
    function checkWordMatch() {
        const englishEl = document.querySelector(`#english-words .word-card[data-word-id="${selectedEnglishWord}"]`);
        const vietnameseEl = document.querySelector(`#vietnamese-words .word-card[data-word-id="${selectedVietnameseWord}"]`);
        if (selectedEnglishWord === selectedVietnameseWord) {
            playSound('success');
            [englishEl, vietnameseEl].forEach(el => {
                el.classList.remove('selected');
                el.classList.add('matched');
            });
            matchedPairs.push(selectedEnglishWord);
            updateMasteryScore(selectedEnglishWord, 1);
        } else {
            playSound('fail');
            [englishEl, vietnameseEl].forEach(el => el.classList.add('error'));
            setTimeout(() => {
                [englishEl, vietnameseEl].forEach(el => el.classList.remove('selected', 'error'));
            }, 800);
        }
        selectedEnglishWord = null;
        selectedVietnameseWord = null;
        if (matchedPairs.length === gameWords.length) {
            setTimeout(() => onGameEnd(true, gameWords.length * 10), 1000);
        }
    }
    document.getElementById('check-answers').onclick = () => {
        const score = Math.round((matchedPairs.length / gameWords.length) * 100);
        onGameEnd(true, score);
    };
    openModal('matchingGameModal');
}

export function startImageQuiz(allCards, categoryCards, onGameEnd) {
    // ... (Logic của game này vẫn giữ nguyên)
    let score = 0;
    const questions = [...categoryCards].sort(() => 0.5 - Math.random()).slice(0, 5);
    let currentQuestionIndex = 0;
    function displayQuestion() {
        if (currentQuestionIndex >= questions.length) {
            onGameEnd(true, score * 15);
            return;
        }
        const question = questions[currentQuestionIndex];
        const imageContainer = document.getElementById('image-quiz-image-container');
        const optionsContainer = document.getElementById('image-quiz-options');
        document.getElementById('image-quiz-progress').textContent = `Câu ${currentQuestionIndex + 1}/${questions.length}`;
        if (question.image && question.image.startsWith('http')) {
            imageContainer.innerHTML = `<img src="${question.image}" alt="Quiz image" class="max-w-full max-h-full object-contain">`;
        } else {
            imageContainer.innerHTML = `<div class="text-4xl font-bold text-center text-blue-800 p-4">${question.vietnamese}</div>`;
            speakWord(question.vietnamese, 'vi-VN');
        }
        const distractors = allCards.filter(w => w.id !== question.id);
        shuffleArray(distractors);
        const options = [question, ...distractors.slice(0, 3)];
        shuffleArray(options);
        optionsContainer.innerHTML = '';
        options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option p-4 border rounded-lg text-lg font-semibold text-gray-700 bg-white';
            btn.textContent = option.english;
            btn.onclick = () => handleAnswer(btn, option.id === question.id, question.english);
            optionsContainer.appendChild(btn);
        });
    }
    function handleAnswer(button, isCorrect, correctWord) {
        playSound('click');
        document.querySelectorAll('#image-quiz-options button').forEach(btn => btn.disabled = true);
        if (isCorrect) {
            button.classList.add('correct');
            score++;
            playSound('success_2');
        } else {
            button.classList.add('incorrect');
            playSound('fail');
            document.querySelectorAll('#image-quiz-options button').forEach(btn => {
                if (btn.textContent === correctWord) btn.classList.add('correct');
            });
        }
        speakWord(correctWord, 'en-US');
        setTimeout(() => {
            currentQuestionIndex++;
            displayQuestion();
        }, 1500);
    }
    displayQuestion();
    openModal('imageQuizModal');
}


// =======================================================
// == GAME 3: ĐIỀN TỪ (FILL IN THE BLANK) - ĐÃ SỬA LỖI
// =======================================================

export function startFillBlankGame(words) {
    const suitableWords = words.filter(w => w.english.length >= 3 && w.english.length <= 15);
    if (suitableWords.length === 0) {
        alert("Không có từ vựng phù hợp cho game này.");
        return closeModal('fillBlankGameModal');
    }

    const currentWord = suitableWords[Math.floor(Math.random() * suitableWords.length)];
    const targetWord = currentWord.english.toUpperCase();
    speakWord(currentWord.vietnamese, 'vi-VN');

    let numBlanks = 1;
    if (targetWord.length >= 6) numBlanks = 2;
    if (targetWord.length >= 9) numBlanks = 3;

    const wordChars = targetWord.split('');
    const blankIndices = [];
    while (blankIndices.length < numBlanks) {
        let randomIndex = Math.floor(Math.random() * targetWord.length);
        if (!blankIndices.includes(randomIndex)) blankIndices.push(randomIndex);
    }
    const missingLetters = blankIndices.map(i => wordChars[i]);
    blankIndices.forEach(i => wordChars[i] = '_');

    let choices = [...missingLetters];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    while (choices.length < 6) {
        const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
        if (!choices.includes(randomLetter)) choices.push(randomLetter);
    }
    shuffleArray(choices);

    const answerArea = document.getElementById('answer-area');
    const letterTilesArea = document.getElementById('letter-tiles');
    answerArea.innerHTML = '';
    letterTilesArea.innerHTML = '';

    wordChars.forEach(char => {
        const charEl = document.createElement('div');
        charEl.textContent = char;
        charEl.className = char === '_' ? 'blank-slot' : 'word-char';
        answerArea.appendChild(charEl);
    });

    choices.forEach((letter, index) => {
        const tile = document.createElement('div');
        tile.className = 'letter-choice';
        tile.textContent = letter;
        // SỬA LỖI: Thêm data-attribute để xác định duy nhất từng tile
        tile.dataset.instanceId = `${letter}-${index}`;
        tile.onclick = () => {
            // SỬA LỖI: Giới hạn querySelector vào trong modal
            const firstEmptySlot = answerArea.querySelector('.blank-slot:empty');
            if (firstEmptySlot) {
                firstEmptySlot.textContent = letter;
                tile.classList.add('hidden');
            }
        };
        letterTilesArea.appendChild(tile);
    });
    
    // SỬA LỖI: Thêm sự kiện click vào answerArea để trả chữ về
    answerArea.onclick = (e) => {
        if (e.target.classList.contains('blank-slot') && e.target.textContent) {
            const letterToReturn = e.target.textContent;
            e.target.textContent = '';
            // Tìm và hiển thị lại chữ cái đã chọn
            const hiddenTile = letterTilesArea.querySelector(`.letter-choice.hidden[data-instance-id^="${letterToReturn}-"]`);
            hiddenTile?.classList.remove('hidden');
        }
    };
    
    document.getElementById('check-fill-blank-btn').onclick = () => checkFillBlankAnswer(targetWord, currentWord.id, words);
    document.getElementById('fill-blank-listen-btn').onclick = () => speakWord(currentWord.english, 'en-US');
    document.getElementById('change-word-fill-blank-btn').onclick = () => startFillBlankGame(words);

    openModal('fillBlankGameModal');
}

function checkFillBlankAnswer(targetWord, wordId, words) {
    const userAnswer = Array.from(document.querySelectorAll('#answer-area > div')).map(el => el.textContent || '_').join('');
    if (userAnswer === targetWord) {
        playSound('success_2');
        updateMasteryScore(wordId, 2);
        setTimeout(() => startFillBlankGame(words), 1500);
    } else {
        playSound('fail');
        document.getElementById('answer-area').classList.add('error');
        setTimeout(() => document.getElementById('answer-area').classList.remove('error'), 500);
    }
}


// =======================================================
// == GAME 4: GHÉP ÂM THANH & TỪ - ĐÃ SỬA LỖI
// =======================================================

export function startSoundMatchGame(words, numCards) {
    const board = document.getElementById('sound-match-board');
    board.innerHTML = '';
    let selectedCards = [];
    let isChecking = true;

    const numPairs = numCards === 12 ? 4 : 3;
    const numBlanks = numCards - (numPairs * 2);
    
    const gameWords = [...words].sort(() => 0.5 - Math.random()).slice(0, numPairs);
    if (gameWords.length < numPairs) {
        alert(`Chủ đề này cần ít nhất ${numPairs} từ để chơi.`);
        return closeModal('soundMatchModal');
    }

    let boardItems = [];
    gameWords.forEach(word => {
        boardItems.push({ type: 'audio', word: word.english, pairId: word.id });
        boardItems.push({ type: 'text', word: word.english, pairId: word.id });
    });
    for (let i = 0; i < numBlanks; i++) boardItems.push({ type: 'blank' });
    shuffleArray(boardItems);

    boardItems.forEach((item) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'match-card w-[90px] h-[70px] cursor-pointer';
        cardEl.innerHTML = `...`; // Giữ nguyên HTML
        cardEl.onclick = () => handleCardClick(cardEl, item);
        board.appendChild(cardEl);
    });

    // SỬA LỖI: Logic xử lý lật thẻ được viết lại hoàn toàn
    function handleCardClick(element, data) {
        if (isChecking || element.classList.contains('flipped')) return;
        
        playSound('click');
        element.classList.add('flipped');
        if (data.type === 'audio') speakWord(data.word, 'en-US');
        
        selectedCards.push({ element, data });
        
        if (selectedCards.length === 2) {
            isChecking = true;
            setTimeout(checkMatch, 1200);
        }
    }

    function checkMatch() {
        const [card1, card2] = selectedCards;
        
        // Kiểm tra nếu ghép đúng (cùng ID, khác loại, và không phải thẻ trống)
        const isPair = card1.data.pairId === card2.data.pairId;
        const isAudioText = card1.data.type !== card2.data.type;
        const areBothValid = card1.data.type !== 'blank' && card2.data.type !== 'blank';

        if (isPair && isAudioText && areBothValid) {
            playSound('success_2');
            updateMasteryScore(card1.data.pairId, 1.5);
            [card1.element, card2.element].forEach(el => el.classList.add('matched'));
            
            const matchedCount = document.querySelectorAll('#sound-match-board .match-card.matched').length;
            if (matchedCount === numPairs * 2) {
                playSound('tada');
                setTimeout(() => startSoundMatchGame(words, numCards), 1500);
            }
        } else {
            // Nếu không phải là một cặp ghép đúng (bao gồm cả trường hợp lật phải ô trống)
            playSound('fail');
            [card1.element, card2.element].forEach(el => el.classList.remove('flipped'));
        }
        
        // Reset lại lượt đi
        selectedCards = [];
        isChecking = false;
    }

    openModal('soundMatchModal');
    
    const allCards = board.querySelectorAll('.match-card');
    setTimeout(() => allCards.forEach(card => card.classList.add('flipped')), 500);
    setTimeout(() => {
        allCards.forEach(card => card.classList.remove('flipped'));
        isChecking = false;
    }, 3500);
}
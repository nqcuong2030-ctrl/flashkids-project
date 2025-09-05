// public/js/games.js
// Module này chứa logic cho tất cả các mini-game tương tác.
// Mỗi hàm game sẽ nhận dữ liệu đầu vào, tự quản lý giao diện bên trong modal của nó,
// và gọi lại (callback) khi game kết thúc hoặc tự khởi động lại vòng mới.

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
// == GAME 1: GHÉP TỪ (MATCHING GAME) ==
// =======================================================

/**
 * Khởi động trò chơi Ghép Từ.
 * @param {Array} cards - Mảng các thẻ từ vựng cho chủ đề đã chọn.
 * @param {Function} onGameEnd - Callback được gọi khi game kết thúc.
 */
export function startMatchingGame(cards, onGameEnd) {
    const gameContainer = document.getElementById('game-container');
    if (cards.length < 4) {
        gameContainer.innerHTML = `<p class="text-center text-red-500">Cần ít nhất 4 từ để bắt đầu trò chơi này.</p>`;
        setTimeout(() => onGameEnd(false, 0), 2000);
        return;
    }

    const gameCards = cards.slice(0, 8);
    const words = gameCards.map(c => ({ type: 'word', value: c.word, id: c.id, matched: false }));
    const meanings = gameCards.map(c => ({ type: 'meaning', value: c.meaning, id: c.id, matched: false }));
    
    let allTiles = [...words, ...meanings];
    shuffleArray(allTiles);

    let firstSelection = null;
    let lockBoard = false;
    let pairsFound = 0;

    function renderBoard() {
        gameContainer.innerHTML = `
            <p class="text-center text-gray-600 mb-4">Tìm các cặp từ và nghĩa tương ứng.</p>
            <div class="grid grid-cols-4 gap-4">
                ${allTiles.map((tile, index) => `
                    <div class="matching-card aspect-square bg-blue-500 rounded-lg flex items-center justify-center p-2 text-center text-white font-bold cursor-pointer transform transition-transform duration-300" data-index="${index}">
                        <span>${tile.value}</span>
                    </div>
                `).join('')}
            </div>
        `;
        gameContainer.querySelectorAll('.matching-card').forEach(card => card.addEventListener('click', handleCardClick));
    }

    function handleCardClick(event) {
        if (lockBoard) return;
        const clickedCard = event.currentTarget;
        const index = parseInt(clickedCard.dataset.index);
        const tile = allTiles[index];

        if (tile.matched || clickedCard === firstSelection) return;

        playSound('click');
        clickedCard.classList.add('flipped');

        if (!firstSelection) {
            firstSelection = clickedCard;
            return;
        }

        lockBoard = true;
        checkWordMatch(clickedCard);
    }
    
    function checkWordMatch(secondSelection) {
        const firstIndex = parseInt(firstSelection.dataset.index);
        const secondIndex = parseInt(secondSelection.dataset.index);
        const firstTile = allTiles[firstIndex];
        const secondTile = allTiles[secondIndex];
        
        if (firstTile.id === secondTile.id && firstTile.type !== secondTile.type) {
            playSound('success_2');
            firstTile.matched = true;
            secondTile.matched = true;
            updateMasteryScore(firstTile.id, 1);
            pairsFound++;
            
            setTimeout(() => {
                firstSelection.classList.add('matched');
                secondSelection.classList.add('matched');
                resetTurn();
                checkGameEnd();
            }, 500);
        } else {
            playSound('fail');
            setTimeout(() => {
                firstSelection.classList.remove('flipped');
                secondSelection.classList.remove('flipped');
                resetTurn();
            }, 1000);
        }
    }
    
    function resetTurn() {
        firstSelection = null;
        lockBoard = false;
    }
    
    function checkGameEnd() {
        if (pairsFound === gameCards.length) {
            setTimeout(() => {
                playSound('tada');
                onGameEnd(true, gameCards.length * 10);
            }, 500);
        }
    }

    renderBoard();
}

// =======================================================
// == GAME 2: CHỌN TỪ THEO HÌNH/NGHĨA (IMAGE/MEANING QUIZ) ==
// =======================================================

/**
 * Khởi động trò chơi Chọn Từ.
 * @param {Array} allCardsInLevel - Tất cả các thẻ trong level (để tạo đáp án sai).
 * @param {Array} categoryCards - Các thẻ trong chủ đề đã chọn.
 * @param {Function} onGameEnd - Callback khi game kết thúc.
 */
export function startImageQuiz(allCardsInLevel, categoryCards, onGameEnd) {
    const gameContainer = document.getElementById('game-container');
    if (categoryCards.length < 4) {
        gameContainer.innerHTML = `<p class="text-center text-red-500">Cần ít nhất 4 từ để bắt đầu trò chơi này.</p>`;
        setTimeout(() => onGameEnd(false, 0), 2000);
        return;
    }

    let questions = generateImageQuizQuestions(allCardsInLevel, categoryCards);
    let currentQuestionIndex = 0;
    let score = 0;

    function generateImageQuizQuestions(allCards, categoryCards, numQuestions = 5) {
        const generatedQuestions = [];
        const wordsCopy = [...categoryCards];
        shuffleArray(wordsCopy);

        for (let i = 0; i < Math.min(numQuestions, wordsCopy.length); i++) {
            const correctWord = wordsCopy[i];
            const options = [correctWord];
            const distractors = allCards.filter(w => w.id !== correctWord.id);
            shuffleArray(distractors);

            while (options.length < 4 && distractors.length > 0) {
                options.push(distractors.pop());
            }
            shuffleArray(options);
            generatedQuestions.push({ correctAnswer: correctWord, options });
        }
        return generatedQuestions;
    }

    function displayQuestion() {
        if (currentQuestionIndex >= questions.length) {
            const xpGained = score * 15;
            onGameEnd(true, xpGained);
            return;
        }

        const question = questions[currentQuestionIndex];
        let promptHTML = '';
        if (question.correctAnswer.image && question.correctAnswer.image.startsWith('http')) {
            promptHTML = `<img src="${question.correctAnswer.image}" alt="Quiz prompt" class="max-h-48 mx-auto object-contain rounded-lg">`;
        } else {
            promptHTML = `<div class="text-3xl font-bold text-center text-blue-800 p-4">${question.correctAnswer.meaning}</div>`;
            speakWord(question.correctAnswer.meaning, 'vi-VN');
        }

        gameContainer.innerHTML = `
            <p class="text-center text-gray-600 mb-2">Câu ${currentQuestionIndex + 1}/${questions.length}</p>
            <div class="prompt-container h-52 flex items-center justify-center bg-gray-100 rounded-lg mb-4">
                ${promptHTML}
            </div>
            <div class="grid grid-cols-2 gap-4">
                ${question.options.map(option => `
                    <button class="quiz-option p-4 border rounded-lg text-lg font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors" data-word-id="${option.id}">
                        ${option.word}
                    </button>
                `).join('')}
            </div>
        `;

        gameContainer.querySelectorAll('.quiz-option').forEach(btn => btn.addEventListener('click', handleAnswer));
    }

    function handleAnswer(event) {
        const selectedButton = event.currentTarget;
        const selectedId = parseInt(selectedButton.dataset.wordId);
        const correctId = questions[currentQuestionIndex].correctAnswer.id;

        gameContainer.querySelectorAll('.quiz-option').forEach(btn => btn.disabled = true);

        if (selectedId === correctId) {
            playSound('success');
            selectedButton.classList.add('correct');
            score++;
            updateMasteryScore(correctId, 1);
        } else {
            playSound('fail');
            selectedButton.classList.add('incorrect');
            gameContainer.querySelector(`[data-word-id="${correctId}"]`).classList.add('correct');
        }

        speakWord(questions[currentQuestionIndex].correctAnswer.word, 'en-US');

        setTimeout(() => {
            currentQuestionIndex++;
            displayQuestion();
        }, 1500);
    }
    
    displayQuestion();
}


// =======================================================
// == GAME 3: ĐIỀN TỪ (FILL IN THE BLANK) ==
// =======================================================

/**
 * Khởi động trò chơi Điền Từ. Đây là chế độ luyện tập liên tục.
 * @param {Array} words - Các thẻ từ vựng phù hợp cho game này.
 */
export function startFillBlankGame(words) {
    const gameContainer = document.getElementById('game-container');
    const suitableWords = words.filter(w => w.word.length >= 3 && w.word.length <= 15);
    if (suitableWords.length === 0) {
        gameContainer.innerHTML = `<p class="text-center text-red-500">Không có từ vựng phù hợp cho game này.</p>`;
        return;
    }

    let currentWord = suitableWords[Math.floor(Math.random() * suitableWords.length)];
    let targetWord = currentWord.word.toUpperCase();
    speakWord(currentWord.meaning, 'vi-VN');

    let numBlanks = 1;
    if (targetWord.length >= 6) numBlanks = 2;
    if (targetWord.length >= 9) numBlanks = 3;

    const wordChars = targetWord.split('');
    let blankIndices = [];
    while (blankIndices.length < numBlanks) {
        let randomIndex = Math.floor(Math.random() * targetWord.length);
        if (!blankIndices.includes(randomIndex)) {
            blankIndices.push(randomIndex);
        }
    }

    let missingLetters = blankIndices.map(i => wordChars[i]);
    blankIndices.forEach(i => wordChars[i] = '_');

    let choices = [...missingLetters];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    while (choices.length < 6) {
        const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
        if (!choices.includes(randomLetter)) choices.push(randomLetter);
    }
    shuffleArray(choices);

    gameContainer.innerHTML = `
        <p class="text-center text-gray-600 mb-4 text-xl">Điền vào chỗ trống để hoàn thành từ có nghĩa: <strong>${currentWord.meaning}</strong></p>
        <div id="fill-blank-answer-area" class="flex justify-center gap-2 mb-6">
            ${wordChars.map((char, index) => 
                char === '_'
                ? `<div class="blank-slot" data-original-index="${index}"></div>`
                : `<div class="word-char">${char}</div>`
            ).join('')}
        </div>
        <div id="fill-blank-choices" class="flex justify-center gap-3 flex-wrap">
            ${choices.map((letter, i) => `<button class="letter-choice" data-letter="${letter}" data-instance="${i}">${letter}</button>`).join('')}
        </div>
        <div class="text-center mt-6">
            <button id="fill-blank-listen-btn" class="px-4 py-2 bg-blue-500 text-white rounded-lg">Nghe lại từ</button>
        </div>
    `;
    
    gameContainer.querySelectorAll('.letter-choice').forEach(btn => {
        btn.onclick = () => {
            const firstEmptySlot = gameContainer.querySelector('.blank-slot:empty');
            if (firstEmptySlot) {
                firstEmptySlot.textContent = btn.textContent;
                btn.classList.add('hidden');
                checkIfComplete();
            }
        };
    });
    
    gameContainer.querySelectorAll('.blank-slot').forEach(slot => {
        slot.onclick = () => {
            if (slot.textContent) {
                const letter = slot.textContent;
                slot.textContent = '';
                // Hiện lại nút đã chọn
                const choiceToUnhide = gameContainer.querySelector(`.letter-choice.hidden[data-letter="${letter}"]`);
                if (choiceToUnhide) {
                    choiceToUnhide.classList.remove('hidden');
                }
            }
        };
    });

    document.getElementById('fill-blank-listen-btn').onclick = () => speakWord(targetWord, 'en-US');

    function checkIfComplete() {
        const filledSlots = gameContainer.querySelectorAll('.blank-slot');
        if ([...filledSlots].every(slot => slot.textContent !== '')) {
            let userAnswer = wordChars.map((char, index) => {
                return char === '_' ? (gameContainer.querySelector(`.blank-slot[data-original-index="${index}"]`)?.textContent || '') : char;
            }).join('');

            if (userAnswer === targetWord) {
                playSound('success_2');
                updateMasteryScore(currentWord.id, 2);
                filledSlots.forEach(s => s.classList.add('correct'));
                setTimeout(() => startFillBlankGame(words), 1500);
            } else {
                playSound('fail');
                gameContainer.querySelector('#fill-blank-answer-area').classList.add('shake-animation');
                setTimeout(() => {
                    gameContainer.querySelector('#fill-blank-answer-area').classList.remove('shake-animation');
                    filledSlots.forEach(slot => {
                         if (slot.textContent) {
                             const letter = slot.textContent;
                             slot.textContent = '';
                             const choiceToUnhide = gameContainer.querySelector(`.letter-choice.hidden[data-letter="${letter}"]`);
                             if (choiceToUnhide) choiceToUnhide.classList.remove('hidden');
                         }
                    });
                }, 800);
            }
        }
    }
}

// =======================================================
// == GAME 4: GHÉP ÂM THANH & TỪ (SOUND MATCH) == (PHẦN BỊ THIẾU)
// =======================================================

/**
 * Khởi động trò chơi Ghép Âm thanh & Từ. Chế độ chơi liên tục.
 * @param {Array} words - Các thẻ từ trong chủ đề đã chọn.
 * @param {number} numCards - Số lượng thẻ trên bàn (9 hoặc 12).
 * @param {Function} onGameEnd - Callback khi người dùng thoát.
 */
export function startSoundMatchGame(words, numCards, onGameEnd) {
    const gameContainer = document.getElementById('game-container');
    if (words.length < 4) {
        gameContainer.innerHTML = `<p class="text-center text-red-500">Cần ít nhất 4 từ để bắt đầu trò chơi này.</p>`;
        setTimeout(() => onGameEnd(false, 0), 2000);
        return;
    }

    let selectedCards = [];
    let isChecking = true; // Bắt đầu với trạng thái khóa để người dùng ghi nhớ
    let matchedPairs = 0;

    const numPairs = numCards === 12 ? 4 : 3;
    const numBlanks = numCards - (numPairs * 2);

    if (words.length < numPairs) {
        gameContainer.innerHTML = `<p class="text-center text-red-500">Chủ đề này cần ít nhất ${numPairs} từ để chơi ở chế độ này.</p>`;
        setTimeout(() => onGameEnd(false, 0), 2000);
        return;
    }

    function setupNewRound() {
        const gameWords = [...words].sort(() => 0.5 - Math.random()).slice(0, numPairs);
        let boardItems = [];
        matchedPairs = 0;

        gameWords.forEach(word => {
            boardItems.push({ type: 'audio', word: word.word, id: word.id });
            boardItems.push({ type: 'text', word: word.word, id: word.id });
        });
        for (let i = 0; i < numBlanks; i++) {
            boardItems.push({ type: 'blank' });
        }
        shuffleArray(boardItems);

        gameContainer.innerHTML = `
            <p class="text-center text-gray-600 mb-4">Ghi nhớ vị trí và ghép cặp Âm thanh - Văn bản.</p>
            <div class="sound-match-board grid gap-3 ${numCards === 12 ? 'grid-cols-4' : 'grid-cols-3'}">
                ${boardItems.map((item, index) => `
                    <div class="match-card aspect-video" data-index="${index}">
                        <div class="card-face card-back">?</div>
                        <div class="card-face card-front ${item.type}">
                            ${item.type === 'audio' ? '🔊' : (item.type === 'text' ? item.word : '')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        const allCards = gameContainer.querySelectorAll('.match-card');
        allCards.forEach((card, index) => {
            card.addEventListener('click', () => handleCardClick(card, boardItems[index]));
        });

        // Giai đoạn ghi nhớ
        setTimeout(() => allCards.forEach(card => card.classList.add('flipped')), 500);
        setTimeout(() => {
            allCards.forEach(card => card.classList.remove('flipped'));
            isChecking = false;
        }, 3500);
    }

    function handleCardClick(cardElement, cardData) {
        if (isChecking || cardElement.classList.contains('flipped') || cardData.type === 'blank') return;
        
        playSound('click');
        cardElement.classList.add('flipped');
        if(cardData.type === 'audio') {
            speakWord(cardData.word, 'en-US');
        }
        
        selectedCards.push({ element: cardElement, data: cardData });

        if (selectedCards.length === 2) {
            isChecking = true;
            setTimeout(checkMatch, 1000);
        }
    }

    function checkMatch() {
        const [card1, card2] = selectedCards;

        if (card1.data.id === card2.data.id && card1.data.type !== card2.data.type) {
            playSound('success_2');
            card1.element.classList.add('matched');
            card2.element.classList.add('matched');
            updateMasteryScore(card1.data.id, 1.5); // +1.5 điểm
            matchedPairs++;

            if (matchedPairs === numPairs) {
                playSound('tada');
                setTimeout(setupNewRound, 1500);
            }
        } else {
            playSound('fail');
            card1.element.classList.remove('flipped');
            card2.element.classList.remove('flipped');
        }

        selectedCards = [];
        isChecking = false;
    }

    setupNewRound();
}
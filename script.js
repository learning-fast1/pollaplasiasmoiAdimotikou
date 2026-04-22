document.addEventListener('DOMContentLoaded', () => {
    // Game State
    let currentMode = null;
    let score = 0;
    let currentCorrectAnswer = null;
    let isWaitingForNext = false;

    // Specific operations for Mode 345
    const specificOperations = [
        [3, 3], [3, 4], [3, 5],
        [4, 4], [5, 4], [5, 5],
        [6, 3]
    ];

    // DOM Elements
    const menuScreen = document.getElementById('menu-screen');
    const gameScreen = document.getElementById('game-screen');
    const scoreDisplay = document.getElementById('score');
    const questionDisplay = document.getElementById('question');
    const optionsContainer = document.getElementById('options-container');
    const feedbackArea = document.getElementById('feedback-area');
    const feedbackIcon = document.getElementById('feedback-icon');
    const feedbackText = document.getElementById('feedback-text');
    
    // Buttons
    const btn012 = document.querySelector('.mode-012');
    const btn345 = document.querySelector('.mode-345');
    const btnAll = document.querySelector('.mode-all');
    const backBtn = document.getElementById('back-btn');

    // Event Listeners
    btn012.addEventListener('click', () => startGame('012'));
    btn345.addEventListener('click', () => startGame('345'));
    btnAll.addEventListener('click', () => startGame('all'));
    backBtn.addEventListener('click', showMenu);

    function startGame(mode) {
        currentMode = mode;
        score = 0;
        updateScoreDisplay();
        
        menuScreen.classList.remove('active');
        gameScreen.classList.add('active');
        
        generateQuestion();
    }

    function showMenu() {
        gameScreen.classList.remove('active');
        menuScreen.classList.add('active');
        currentMode = null;
        isWaitingForNext = false;
        hideFeedback();
    }

    function updateScoreDisplay() {
        scoreDisplay.textContent = score;
        scoreDisplay.style.animation = 'none';
        // Trigger reflow
        void scoreDisplay.offsetWidth;
        scoreDisplay.style.animation = 'pulse 0.5s';
    }

    function generateQuestion() {
        isWaitingForNext = false;
        hideFeedback();
        optionsContainer.innerHTML = '';

        let num1, num2;

        if (currentMode === '012') {
            num1 = Math.floor(Math.random() * 3); // 0, 1, or 2
            num2 = Math.floor(Math.random() * 11); // 0 to 10
            if (Math.random() > 0.5) {
                [num1, num2] = [num2, num1];
            }
        } else if (currentMode === '345') {
            const randomOp = specificOperations[Math.floor(Math.random() * specificOperations.length)];
            num1 = randomOp[0];
            num2 = randomOp[1];
            if (Math.random() > 0.5) {
                [num1, num2] = [num2, num1];
            }
        } else if (currentMode === 'all') {
            if (Math.random() > 0.5) {
                num1 = Math.floor(Math.random() * 3);
                num2 = Math.floor(Math.random() * 11);
                if (Math.random() > 0.5) [num1, num2] = [num2, num1];
            } else {
                const randomOp = specificOperations[Math.floor(Math.random() * specificOperations.length)];
                num1 = randomOp[0];
                num2 = randomOp[1];
                if (Math.random() > 0.5) [num1, num2] = [num2, num1];
            }
        }

        currentCorrectAnswer = num1 * num2;
        questionDisplay.textContent = `${num1} x ${num2}`;

        generateOptions(currentCorrectAnswer, num1, num2);
    }

    function generateOptions(correct, num1, num2) {
        let options = new Set();
        options.add(correct);

        while(options.size < 4) {
            let fakeAnswer;
            const errorType = Math.floor(Math.random() * 3);
            
            if (errorType === 0) {
                // Off by 1 or 2 on num1
                fakeAnswer = (num1 + (Math.random() > 0.5 ? 1 : -1)) * num2;
            } else if (errorType === 1) {
                // Off by 1 or 2 on num2
                fakeAnswer = num1 * (num2 + (Math.random() > 0.5 ? 1 : -1));
            } else {
                // Completely random near correct
                fakeAnswer = correct + (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
            }

            if (fakeAnswer >= 0 && fakeAnswer !== correct && fakeAnswer <= 100) {
                options.add(fakeAnswer);
            } else {
                options.add(Math.floor(Math.random() * 30)); // random positive integer under 30
            }
        }

        const optionsArray = Array.from(options);
        // Shuffle options
        for (let i = optionsArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [optionsArray[i], optionsArray[j]] = [optionsArray[j], optionsArray[i]];
        }

        optionsArray.forEach(optionValue => {
            const btn = document.createElement('button');
            btn.className = 'btn option-btn';
            btn.textContent = optionValue;
            btn.addEventListener('click', () => handleOptionClick(btn, optionValue));
            optionsContainer.appendChild(btn);
        });
    }

    function handleOptionClick(btn, selectedValue) {
        if (isWaitingForNext) return;

        const allButtons = document.querySelectorAll('.option-btn');
        
        if (selectedValue === currentCorrectAnswer) {
            isWaitingForNext = true;
            btn.classList.add('correct');
            score += 10;
            updateScoreDisplay();
            showFeedback(true);
            
            allButtons.forEach(b => {
                if(b !== btn) b.style.opacity = '0.5';
            });

            setTimeout(() => {
                generateQuestion();
            }, 1500);

        } else {
            btn.classList.add('wrong');
            showFeedback(false);
            
            setTimeout(() => {
                btn.classList.remove('wrong');
                hideFeedback();
            }, 800);
            
            score = Math.max(0, score - 5);
            updateScoreDisplay();
        }
    }

    function showFeedback(isCorrect) {
        feedbackArea.className = `feedback-area ${isCorrect ? 'correct' : 'wrong'}`;
        
        if (isCorrect) {
            const successMessages = ['Μπράβο!', 'Τέλεια!', 'Εξαιρετικά!', 'Φανταστικά!', 'Αστέρι!'];
            const randomMsg = successMessages[Math.floor(Math.random() * successMessages.length)];
            feedbackIcon.textContent = '🌟';
            feedbackText.textContent = randomMsg;
        } else {
            feedbackIcon.textContent = '🤔';
            feedbackText.textContent = 'Προσπάθησε ξανά!';
        }
        
        feedbackArea.classList.remove('hidden');
    }

    function hideFeedback() {
        feedbackArea.classList.add('hidden');
    }
});

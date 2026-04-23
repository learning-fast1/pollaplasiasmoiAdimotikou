document.addEventListener('DOMContentLoaded', () => {
    let currentMode = null;
    let score = 0;
    let currentCorrectAnswer = null;
    let answerValue = '';
    let isWaitingForNext = false;

    const specificOperations = [
        [3, 3], [3, 4], [3, 5],
        [4, 4], [5, 4], [5, 5],
        [6, 3]
    ];

    const menuScreen = document.getElementById('menu-screen');
    const gameScreen = document.getElementById('game-screen');
    const scoreDisplay = document.getElementById('score');
    const questionDisplay = document.getElementById('question');
    const answerDisplay = document.getElementById('answer-display');
    const feedbackInline = document.getElementById('feedback-inline');

    const btn012 = document.querySelector('.mode-012');
    const btn345 = document.querySelector('.mode-345');
    const btnAll = document.querySelector('.mode-all');
    const backBtn = document.getElementById('back-btn');

    btn012.addEventListener('click', () => startGame('012'));
    btn345.addEventListener('click', () => startGame('345'));
    btnAll.addEventListener('click', () => startGame('all'));
    backBtn.addEventListener('click', showMenu);

    document.querySelectorAll('.numpad-btn').forEach(btn => {
        btn.addEventListener('click', () => handleNumpad(btn.dataset.val));
    });

    function handleNumpad(val) {
        if (isWaitingForNext) return;

        if (val === 'del') {
            answerValue = answerValue.slice(0, -1);
            updateAnswerDisplay();
        } else if (val === 'ok') {
            if (answerValue === '') return;
            checkAnswer();
        } else {
            if (answerValue.length >= 3) return;
            answerValue += val;
            updateAnswerDisplay();
        }
    }

    function updateAnswerDisplay() {
        answerDisplay.textContent = answerValue === '' ? '?' : answerValue;
    }

    function checkAnswer() {
        const userAnswer = parseInt(answerValue);

        if (userAnswer === currentCorrectAnswer) {
            score += 10;
            updateScoreDisplay();
            showFeedback(true);
            isWaitingForNext = true;
            setTimeout(() => generateQuestion(), 1200);
        } else {
            showFeedback(false);
            answerValue = '';
            updateAnswerDisplay();
        }
    }

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
        void scoreDisplay.offsetWidth;
        scoreDisplay.style.animation = 'pulse 0.5s';
    }

    function generateQuestion() {
        isWaitingForNext = false;
        answerValue = '';
        updateAnswerDisplay();
        hideFeedback();

        let num1, num2;

        if (currentMode === '012') {
            num1 = Math.floor(Math.random() * 3);
            num2 = Math.floor(Math.random() * 11);
            if (Math.random() > 0.5) [num1, num2] = [num2, num1];
        } else if (currentMode === '345') {
            const op = specificOperations[Math.floor(Math.random() * specificOperations.length)];
            num1 = op[0];
            num2 = op[1];
            if (Math.random() > 0.5) [num1, num2] = [num2, num1];
        } else {
            if (Math.random() > 0.5) {
                num1 = Math.floor(Math.random() * 3);
                num2 = Math.floor(Math.random() * 11);
                if (Math.random() > 0.5) [num1, num2] = [num2, num1];
            } else {
                const op = specificOperations[Math.floor(Math.random() * specificOperations.length)];
                num1 = op[0];
                num2 = op[1];
                if (Math.random() > 0.5) [num1, num2] = [num2, num1];
            }
        }

        currentCorrectAnswer = num1 * num2;
        questionDisplay.textContent = `${num1} × ${num2}`;
    }

    function showFeedback(isCorrect) {
        feedbackInline.className = `feedback-inline ${isCorrect ? 'correct' : 'wrong'}`;
        feedbackInline.textContent = isCorrect ? '✓ Σωστό!' : '✗ Λάθος! Προσπάθησε πάλι.';
    }

    function hideFeedback() {
        feedbackInline.className = 'feedback-inline hidden';
        feedbackInline.textContent = '';
    }
});

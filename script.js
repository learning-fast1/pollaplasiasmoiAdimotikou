document.addEventListener('DOMContentLoaded', () => {

    // --- State ---
    let currentMode  = null;
    let playerCount  = 1;
    let selectedTime = 60;
    let timeLeft     = 60;
    let timerInterval = null;

    // Single player
    let score         = 0;
    let correctAnswer = null;
    let answerValue   = '';
    let waiting       = false;

    // Two player
    const p = {
        1: { score: 0, answer: '', correct: null, waiting: false },
        2: { score: 0, answer: '', correct: null, waiting: false }
    };

    const specificOperations = [
        [3, 3], [3, 4], [3, 5],
        [4, 4], [5, 4], [5, 5],
        [6, 3]
    ];

    // --- DOM ---
    const app        = document.getElementById('app');
    const menuScreen = document.getElementById('menu-screen');
    const gameScreen = document.getElementById('game-screen');
    const twoScreen  = document.getElementById('two-player-screen');
    const gameOver   = document.getElementById('game-over');

    const btn1p  = document.getElementById('btn-1p');
    const btn2p  = document.getElementById('btn-2p');

    const scoreEl    = document.getElementById('score');
    const questionEl = document.getElementById('question');
    const answerEl   = document.getElementById('answer-display');
    const feedbackEl = document.getElementById('feedback-inline');
    const timerEl    = document.getElementById('timer-display');
    const timerEl2p  = document.getElementById('timer-display-2p');

    const el = {
        1: {
            score:    document.getElementById('score-p1'),
            question: document.getElementById('question-p1'),
            answer:   document.getElementById('answer-p1'),
            feedback: document.getElementById('feedback-p1')
        },
        2: {
            score:    document.getElementById('score-p2'),
            question: document.getElementById('question-p2'),
            answer:   document.getElementById('answer-p2'),
            feedback: document.getElementById('feedback-p2')
        }
    };

    // --- Player count toggle ---
    btn1p.addEventListener('click', () => {
        playerCount = 1;
        btn1p.classList.add('selected');
        btn2p.classList.remove('selected');
    });
    btn2p.addEventListener('click', () => {
        playerCount = 2;
        btn2p.classList.add('selected');
        btn1p.classList.remove('selected');
    });

    // --- Time selection ---
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedTime = parseInt(btn.dataset.time);
        });
    });

    // --- Difficulty buttons ---
    document.querySelector('.mode-012').addEventListener('click', () => startGame('012'));
    document.querySelector('.mode-345').addEventListener('click', () => startGame('345'));
    document.querySelector('.mode-all').addEventListener('click', () => startGame('all'));
    document.getElementById('back-btn').addEventListener('click', showMenu);
    document.getElementById('back-btn-2p').addEventListener('click', showMenu);
    document.getElementById('play-again-btn').addEventListener('click', () => {
        gameOver.classList.add('hidden');
        startGame(currentMode);
    });
    document.getElementById('go-menu-btn').addEventListener('click', () => {
        gameOver.classList.add('hidden');
        showMenu();
    });

    // --- Single player numpad ---
    document.querySelectorAll('#game-screen .numpad-btn').forEach(btn => {
        btn.addEventListener('click', () => handleSingle(btn.dataset.val));
    });

    // --- Two player numpad ---
    document.querySelectorAll('#two-player-screen .numpad-btn').forEach(btn => {
        btn.addEventListener('click', () => handleTwo(+btn.dataset.player, btn.dataset.val));
    });

    // --- Game start ---
    function startGame(mode) {
        currentMode = mode;
        menuScreen.classList.remove('active');

        if (playerCount === 2) {
            p[1].score = 0; p[2].score = 0;
            el[1].score.textContent = '0';
            el[2].score.textContent = '0';
            app.classList.add('two-player-mode');
            twoScreen.classList.add('active');
            newQuestion(1);
            newQuestion(2);
            startTimer(timerEl2p);
        } else {
            score = 0;
            scoreEl.textContent = '0';
            gameScreen.classList.add('active');
            newQuestion(0);
            startTimer(timerEl);
        }
    }

    function showMenu() {
        stopTimer();
        gameScreen.classList.remove('active');
        twoScreen.classList.remove('active');
        menuScreen.classList.add('active');
        app.classList.remove('two-player-mode');
        currentMode = null;
        waiting = false;
        feedbackEl.className = 'feedback-inline hidden';
    }

    // --- Timer ---
    function startTimer(display) {
        stopTimer();
        timeLeft = selectedTime;
        updateTimerDisplay(display);
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay(display);
            if (timeLeft <= 0) {
                stopTimer();
                showGameOver();
            }
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        timerEl.classList.remove('warning');
        timerEl2p.classList.remove('warning');
    }

    function updateTimerDisplay(display) {
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        display.textContent = `${m}:${s.toString().padStart(2, '0')}`;
        if (timeLeft <= 10) {
            display.classList.add('warning');
        } else {
            display.classList.remove('warning');
        }
    }

    // --- Game Over ---
    function showGameOver() {
        const scoresDiv = document.getElementById('game-over-scores');

        if (playerCount === 2) {
            const s1 = p[1].score;
            const s2 = p[2].score;
            let winnerHTML = '';
            if (s1 > s2) {
                winnerHTML = `<div class="winner">🏆 Νικητής: Παίκτης 1!</div>`;
            } else if (s2 > s1) {
                winnerHTML = `<div class="winner">🏆 Νικητής: Παίκτης 2!</div>`;
            } else {
                winnerHTML = `<div class="winner">🤝 Ισοπαλία!</div>`;
            }
            scoresDiv.innerHTML = `
                ${winnerHTML}
                <div>🔵 Παίκτης 1: <strong>${s1}</strong> πόντοι</div>
                <div>🔴 Παίκτης 2: <strong>${s2}</strong> πόντοι</div>
            `;
        } else {
            scoresDiv.innerHTML = `<div>Σκορ: <strong>${score}</strong> πόντοι ⭐</div>`;
        }

        gameOver.classList.remove('hidden');
    }

    // --- Single player logic ---
    function handleSingle(val) {
        if (waiting) return;
        if (val === 'del') {
            answerValue = answerValue.slice(0, -1);
        } else if (val === 'ok') {
            if (!answerValue) return;
            if (parseInt(answerValue) === correctAnswer) {
                score += 10;
                scoreEl.textContent = score;
                scoreEl.style.animation = 'none';
                void scoreEl.offsetWidth;
                scoreEl.style.animation = 'pulse 0.5s';
                setFeedback(feedbackEl, true);
                waiting = true;
                setTimeout(() => newQuestion(0), 1200);
            } else {
                setFeedback(feedbackEl, false);
                answerValue = '';
            }
        } else {
            if (answerValue.length >= 3) return;
            answerValue += val;
        }
        answerEl.textContent = answerValue || ';';
    }

    // --- Two player logic ---
    function handleTwo(player, val) {
        const state = p[player];
        const dom   = el[player];
        if (state.waiting) return;

        if (val === 'del') {
            state.answer = state.answer.slice(0, -1);
        } else if (val === 'ok') {
            if (!state.answer) return;
            if (parseInt(state.answer) === state.correct) {
                state.score += 10;
                dom.score.textContent = state.score;
                setFeedback(dom.feedback, true);
                state.waiting = true;
                setTimeout(() => newQuestion(player), 1200);
            } else {
                setFeedback(dom.feedback, false);
                state.answer = '';
                dom.answer.textContent = ';';
            }
            return;
        } else {
            if (state.answer.length >= 3) return;
            state.answer += val;
        }
        dom.answer.textContent = state.answer || ';';
    }

    // --- Generate question ---
    function newQuestion(player) {
        const [n1, n2] = getNumbers();
        const result   = n1 * n2;

        if (player === 0) {
            waiting       = false;
            answerValue   = '';
            correctAnswer = result;
            answerEl.textContent        = ';';
            feedbackEl.className        = 'feedback-inline hidden';
            questionEl.textContent      = `${n1} × ${n2}`;
        } else {
            p[player].waiting = false;
            p[player].answer  = '';
            p[player].correct = result;
            el[player].answer.textContent   = ';';
            el[player].feedback.className   = 'feedback-inline hidden';
            el[player].question.textContent = `${n1} × ${n2}`;
        }
    }

    // --- Helpers ---
    function getNumbers() {
        let n1, n2;
        if (currentMode === '012') {
            n1 = Math.floor(Math.random() * 3);
            n2 = Math.floor(Math.random() * 11);
        } else if (currentMode === '345') {
            [n1, n2] = specificOperations[Math.floor(Math.random() * specificOperations.length)];
        } else {
            if (Math.random() > 0.5) {
                n1 = Math.floor(Math.random() * 3);
                n2 = Math.floor(Math.random() * 11);
            } else {
                [n1, n2] = specificOperations[Math.floor(Math.random() * specificOperations.length)];
            }
        }
        if (Math.random() > 0.5) [n1, n2] = [n2, n1];
        return [n1, n2];
    }

    function setFeedback(el, isCorrect) {
        el.className   = `feedback-inline ${isCorrect ? 'correct' : 'wrong'}`;
        el.textContent = isCorrect ? '✓ Σωστό!' : '✗ Λάθος! Προσπάθησε πάλι.';
    }
});

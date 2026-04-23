document.addEventListener('DOMContentLoaded', () => {

    // --- State ---
    let currentMode = null;
    let playerCount = 1;

    // Single player
    let score = 0;
    let correctAnswer = null;
    let answerValue = '';
    let waiting = false;

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
    const app            = document.getElementById('app');
    const menuScreen     = document.getElementById('menu-screen');
    const gameScreen     = document.getElementById('game-screen');
    const twoScreen      = document.getElementById('two-player-screen');

    const btn1p          = document.getElementById('btn-1p');
    const btn2p          = document.getElementById('btn-2p');

    // Single player elements
    const scoreEl        = document.getElementById('score');
    const questionEl     = document.getElementById('question');
    const answerEl       = document.getElementById('answer-display');
    const feedbackEl     = document.getElementById('feedback-inline');

    // Two player elements
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

    // --- Difficulty buttons ---
    document.querySelector('.mode-012').addEventListener('click', () => startGame('012'));
    document.querySelector('.mode-345').addEventListener('click', () => startGame('345'));
    document.querySelector('.mode-all').addEventListener('click', () => startGame('all'));
    document.getElementById('back-btn').addEventListener('click', showMenu);
    document.getElementById('back-btn-2p').addEventListener('click', showMenu);

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
        } else {
            score = 0;
            scoreEl.textContent = '0';
            gameScreen.classList.add('active');
            newQuestion(0);
        }
    }

    function showMenu() {
        gameScreen.classList.remove('active');
        twoScreen.classList.remove('active');
        menuScreen.classList.add('active');
        app.classList.remove('two-player-mode');
        currentMode = null;
        waiting = false;
        feedbackEl.className = 'feedback-inline hidden';
    }

    // --- Single player logic ---
    function handleSingle(val) {
        if (waiting) return;
        if (val === 'del') {
            answerValue = answerValue.slice(0, -1);
        } else if (val === 'ok') {
            if (!answerValue) return;
            const userAns = parseInt(answerValue);
            if (userAns === correctAnswer) {
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
            const userAns = parseInt(state.answer);
            if (userAns === state.correct) {
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
        const result = n1 * n2;

        if (player === 0) {
            // single player
            waiting = false;
            answerValue = '';
            answerEl.textContent = ';';
            feedbackEl.className = 'feedback-inline hidden';
            correctAnswer = result;
            questionEl.textContent = `${n1} × ${n2}`;
        } else {
            p[player].waiting = false;
            p[player].answer = '';
            p[player].correct = result;
            el[player].answer.textContent = ';';
            el[player].feedback.className = 'feedback-inline hidden';
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
            const op = specificOperations[Math.floor(Math.random() * specificOperations.length)];
            [n1, n2] = op;
        } else {
            if (Math.random() > 0.5) {
                n1 = Math.floor(Math.random() * 3);
                n2 = Math.floor(Math.random() * 11);
            } else {
                const op = specificOperations[Math.floor(Math.random() * specificOperations.length)];
                [n1, n2] = op;
            }
        }
        if (Math.random() > 0.5) [n1, n2] = [n2, n1];
        return [n1, n2];
    }

    function setFeedback(el, isCorrect) {
        el.className = `feedback-inline ${isCorrect ? 'correct' : 'wrong'}`;
        el.textContent = isCorrect ? '✓ Σωστό!' : '✗ Λάθος! Προσπάθησε πάλι.';
    }
});

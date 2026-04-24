document.addEventListener('DOMContentLoaded', () => {

    // --- Constants ---
    const OPS_345 = [[3,3],[3,4],[3,5],[4,4],[4,5],[5,5],[3,6]];

    // --- State ---
    let currentMode   = null;
    let playerCount   = 1;
    let selectedTime  = 60;
    let timeLeft      = 60;
    let timerInterval = null;
    let isReviewMode  = false;

    // Question pools: 0=single player, 1=player1, 2=player2
    const pools = {
        0: { list: [], idx: 0 },
        1: { list: [], idx: 0 },
        2: { list: [], idx: 0 }
    };

    // Wrong answers (Map: "min,max" -> [min,max])
    const wrongMap = new Map();

    // Single player
    let score         = 0;
    let correctAnswer = null;
    let currentPair   = [0, 0];
    let answerValue   = '';
    let waiting       = false;

    // Two player
    const p = {
        1: { score: 0, answer: '', correct: null, pair: [0,0], waiting: false },
        2: { score: 0, answer: '', correct: null, pair: [0,0], waiting: false }
    };

    // --- DOM ---
    const app        = document.getElementById('app');
    const menuScreen = document.getElementById('menu-screen');
    const gameScreen = document.getElementById('game-screen');
    const twoScreen  = document.getElementById('two-player-screen');
    const gameOver   = document.getElementById('game-over');

    const btn1p  = document.getElementById('btn-1p');
    const btn2p  = document.getElementById('btn-2p');

    const scoreEl       = document.getElementById('score');
    const questionEl    = document.getElementById('question');
    const answerEl      = document.getElementById('answer-display');
    const feedbackEl    = document.getElementById('feedback-inline');
    const timerEl       = document.getElementById('timer-display');
    const timerEl2p     = document.getElementById('timer-display-2p');
    const gameOverTitle = document.getElementById('game-over-title');
    const reviewBtn     = document.getElementById('review-btn');

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

    // --- Player toggle ---
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

    // --- Menu / game over buttons ---
    document.querySelector('.mode-012').addEventListener('click', () => startGame('012'));
    document.querySelector('.mode-345').addEventListener('click', () => startGame('345'));
    document.querySelector('.mode-all').addEventListener('click', () => startGame('all'));
    document.getElementById('back-btn').addEventListener('click', showMenu);
    document.getElementById('back-btn-2p').addEventListener('click', showMenu);
    document.getElementById('play-again-btn').addEventListener('click', () => {
        gameOver.classList.add('hidden');
        isReviewMode = false;
        startGame(currentMode);
    });
    document.getElementById('go-menu-btn').addEventListener('click', () => {
        gameOver.classList.add('hidden');
        isReviewMode = false;
        showMenu();
    });
    reviewBtn.addEventListener('click', () => {
        gameOver.classList.add('hidden');
        startReview();
    });

    // --- Numpad listeners ---
    document.querySelectorAll('#game-screen .numpad-btn').forEach(btn => {
        btn.addEventListener('click', () => handleSingle(btn.dataset.val));
    });
    document.querySelectorAll('#two-player-screen .numpad-btn').forEach(btn => {
        btn.addEventListener('click', () => handleTwo(+btn.dataset.player, btn.dataset.val));
    });

    // ─── Pool management ───────────────────────────────────────────────────────

    function buildPool(mode) {
        const seen  = new Set();
        const pairs = [];
        const add   = (a, b) => {
            const key = `${Math.min(a,b)},${Math.max(a,b)}`;
            if (!seen.has(key)) { seen.add(key); pairs.push([Math.min(a,b), Math.max(a,b)]); }
        };
        if (mode === '012' || mode === 'all') {
            for (let a = 0; a <= 2; a++)
                for (let b = 0; b <= 10; b++) add(a, b);
        }
        if (mode === '345' || mode === 'all') {
            OPS_345.forEach(([a,b]) => add(a, b));
        }
        return shuffle(pairs);
    }

    function initPools(mode) {
        [0, 1, 2].forEach(k => { pools[k].list = buildPool(mode); pools[k].idx = 0; });
    }

    function nextFromPool(key) {
        const pool = pools[key];
        if (pool.idx >= pool.list.length) { shuffle(pool.list); pool.idx = 0; }
        const [a, b] = pool.list[pool.idx++];
        return Math.random() > 0.5 ? [a, b] : [b, a];
    }

    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // ─── Wrong answer tracking ─────────────────────────────────────────────────

    function trackWrong(n1, n2) {
        const key = `${Math.min(n1,n2)},${Math.max(n1,n2)}`;
        if (!wrongMap.has(key)) wrongMap.set(key, [Math.min(n1,n2), Math.max(n1,n2)]);
    }

    // ─── Game flow ──────────────────────────────────────────────────────────────

    function startGame(mode) {
        currentMode = mode;
        wrongMap.clear();
        initPools(mode);
        menuScreen.classList.remove('active');

        gtag('event', 'page_view', {
            page_title:    'Παιχνίδι - ' + mode,
            page_location: window.location.href + '#game'
        });
        gtag('event', 'game_start', {
            mode:    mode,
            players: playerCount,
            time:    selectedTime
        });

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

    function startReview() {
        gtag('event', 'review_start', { wrong_count: wrongMap.size });
        const reviewPairs = shuffle(Array.from(wrongMap.values()));
        wrongMap.clear();

        pools[0].list = reviewPairs;
        pools[0].idx  = 0;

        isReviewMode = true;
        score        = 0;
        scoreEl.textContent = '0';

        twoScreen.classList.remove('active');
        app.classList.remove('two-player-mode');
        gameScreen.classList.add('active');

        newQuestion(0);
        startTimer(timerEl);
    }

    function showMenu() {
        stopTimer();
        gameScreen.classList.remove('active');
        twoScreen.classList.remove('active');
        menuScreen.classList.add('active');
        app.classList.remove('two-player-mode');
        currentMode  = null;
        waiting      = false;
        isReviewMode = false;
        feedbackEl.className = 'feedback-inline hidden';
        gtag('event', 'page_view', {
            page_title:    'Μενού',
            page_location: window.location.href + '#menu'
        });
    }

    // ─── Timer ─────────────────────────────────────────────────────────────────

    function startTimer(display) {
        stopTimer();
        timeLeft = selectedTime;
        updateTimerDisplay(display);
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay(display);
            if (timeLeft <= 0) { stopTimer(); showGameOver(); }
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
        timerEl.classList.remove('warning');
        timerEl2p.classList.remove('warning');
    }

    function updateTimerDisplay(display) {
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        display.textContent = `${m}:${s.toString().padStart(2, '0')}`;
        display.classList.toggle('warning', timeLeft <= 10);
    }

    // ─── Game over ─────────────────────────────────────────────────────────────

    function showGameOver() {
        const scoresDiv = document.getElementById('game-over-scores');

        gameOverTitle.textContent = isReviewMode
            ? '📝 Τέλος Επανάληψης!'
            : '⏰ Τελείωσε ο χρόνος!';

        if (playerCount === 2 && !isReviewMode) {
            const s1 = p[1].score, s2 = p[2].score;
            const winner = s1 > s2
                ? `<div class="winner">🏆 Νικητής: Παίκτης 1!</div>`
                : s2 > s1
                    ? `<div class="winner">🏆 Νικητής: Παίκτης 2!</div>`
                    : `<div class="winner">🤝 Ισοπαλία!</div>`;
            scoresDiv.innerHTML = `
                ${winner}
                <div>🔵 Παίκτης 1: <strong>${s1}</strong> πόντοι</div>
                <div>🔴 Παίκτης 2: <strong>${s2}</strong> πόντοι</div>`;
        } else {
            scoresDiv.innerHTML = `<div>Σκορ: <strong>${score}</strong> πόντοι ⭐</div>`;
        }

        if (wrongMap.size > 0) {
            reviewBtn.style.display = '';
            reviewBtn.textContent   = `📝 Επανάληψη Λαθών (${wrongMap.size})`;
        } else {
            reviewBtn.style.display = 'none';
        }

        if (playerCount === 2 && !isReviewMode) {
            gtag('event', 'game_end', {
                score_p1:    p[1].score,
                score_p2:    p[2].score,
                wrong_count: wrongMap.size,
                mode:        currentMode,
                time:        selectedTime
            });
        } else {
            gtag('event', 'game_end', {
                score:       score,
                wrong_count: wrongMap.size,
                mode:        currentMode,
                time:        selectedTime,
                review:      isReviewMode
            });
        }

        gameOver.classList.remove('hidden');
    }

    // ─── Single player logic ───────────────────────────────────────────────────

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
                trackWrong(...currentPair);
                setFeedback(feedbackEl, false);
                answerValue = '';
            }
        } else {
            if (answerValue.length >= 3) return;
            answerValue += val;
        }
        answerEl.textContent = answerValue || ';';
    }

    // ─── Two player logic ──────────────────────────────────────────────────────

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
                trackWrong(...state.pair);
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

    // ─── Generate question ─────────────────────────────────────────────────────

    function newQuestion(player) {
        const [n1, n2] = nextFromPool(player);
        const result   = n1 * n2;

        if (player === 0) {
            waiting       = false;
            answerValue   = '';
            correctAnswer = result;
            currentPair   = [n1, n2];
            answerEl.textContent   = ';';
            feedbackEl.className   = 'feedback-inline hidden';
            questionEl.textContent = `${n1} × ${n2}`;
        } else {
            p[player].waiting = false;
            p[player].answer  = '';
            p[player].correct = result;
            p[player].pair    = [n1, n2];
            el[player].answer.textContent   = ';';
            el[player].feedback.className   = 'feedback-inline hidden';
            el[player].question.textContent = `${n1} × ${n2}`;
        }
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    function setFeedback(el, isCorrect) {
        el.className   = `feedback-inline ${isCorrect ? 'correct' : 'wrong'}`;
        el.textContent = isCorrect ? '✓ Σωστό!' : '✗ Λάθος! Προσπάθησε πάλι.';
    }
});

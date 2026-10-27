const output = document.getElementById('cli-output');
const input = document.getElementById('cli-input');
const browser = document.getElementById('internet-browser');
const glitch = document.getElementById('matrix-glitch');
const canvas = document.getElementById('galaga-canvas');
const ctx = canvas.getContext('2d');

let state = 'LOGIN'; 
let tttBoard = Array(9).fill('');
let audioCtx = null;
let galagaInterval = null;

let sessionScores = JSON.parse(localStorage.getItem('wopr_scores')) || {
    playerWins: 0,
    woprWins: 0,
    ties: 0,
    galagaScore: 0
};

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playBeep(freq, duration, type = 'sine') {
    try {
        initAudio();
        if (!audioCtx) return;
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
}

function printText(text, delay = 10) {
    return new Promise((resolve) => {
        let index = 0;
        if (text.startsWith("\n> ")) {
            output.textContent += "\n> ";
            text = text.substring(3);
        } else {
            output.textContent += "\n";
        }

        function typeChar() {
            if (index < text.length) {
                output.textContent += text.charAt(index);
                output.scrollTop = output.scrollHeight;
                if (text.charAt(index) !== ' ' && text.charAt(index) !== '\n') {
                    playBeep(900, 0.01, 'square');
                }
                index++;
                setTimeout(typeChar, delay);
            } else {
                output.textContent += "\n";
                resolve();
            }
        }
        typeChar();
    });
}

input.addEventListener('keydown', async function(e) {
    if (e.key === 'Enter') {
        let val = input.value.trim();
        input.value = '';
        if (val === '') return;

        // Clean user echoing without waiting for type layout blocking loops
        output.textContent += "\n> " + val + "\n";
        output.scrollTop = output.scrollHeight;
        processCommand(val);
    }
});

function triggerGlitchEffect() {
    glitch.classList.remove('active-glitch');
    void glitch.offsetWidth; 
    glitch.classList.add('active-glitch');
    for (let i = 0; i < 4; i++) {
        setTimeout(() => playBeep(Math.random() * 600 + 100, 0.04, 'sawtooth'), i * 30);
    }
}

function updateDB() {
    localStorage.setItem('wopr_scores', JSON.stringify(sessionScores));
}

async function processCommand(val) {
    let cleanVal = val.toLowerCase();

    if (state === 'LOGIN') {
        if (cleanVal === 'joshua') {
            state = 'COMMAND';
            playBeep(600, 0.15, 'sine');
            await printText("GREETINGS PROFESSOR FALKEN.\n\nSHALL WE PLAY A GAME?\n\nAvailable operations:\n- [games] : List available simulation engines\n- [browser] : Open Core Network View\n- [galaga] : Run tactical array emulation\n- [stats] : Fetch tracking ledger indices\n- [logout] : Drop connection mapping", 4);
        } else {
            playBeep(140, 0.3, 'sawtooth');
            await printText("IDENTIFICATION NOT RECOGNIZED BY CENTRAL TERMINAL.\nTRY AGAIN.", 4);
        }
        return;
    }

    if (state === 'COMMAND') {
        if (cleanVal === 'logout') {
            state = 'LOGIN';
            playBeep(300, 0.2, 'sine');
            await printText("CONNECTION TERMINATED.\n--- WOPR MULTI-FRAME SYSTEM ONLINE ---", 4);
            return;
        }
        if (cleanVal === 'browser') {
            triggerGlitchEffect();
            setTimeout(() => { browser.style.display = 'flex'; }, 100);
            await printText("DECRYPTING INTERNET PACKET PIPELINE CONFIGURATIONS...", 4);
            return;
        }
        if (cleanVal === 'galaga') {
            runGalagaSimulation();
            return;
        }
        if (cleanVal === 'stats') {
            await printText(`--- WOPR HISTORICAL RECORDS ---\nTIC-TAC-TOE:\n USER: ${sessionScores.playerWins}  WOPR: ${sessionScores.woprWins}  TIES: ${sessionScores.ties}\nGALAGA REMOVALS: ${sessionScores.galagaScore}`, 2);
            return;
        }
        if (cleanVal === 'games') {
            await printText("AVAILABLE MATRIX SYSTEMS:\n- TIC-TAC-TOE\n- GLOBAL THERMONUCLEAR WAR\n\nType game name to mount engine.", 4);
            return;
        }
        if (cleanVal === 'tic-tac-toe' || cleanVal === 'tictactoe') {
            startTTT();
            return;
        }
        if (cleanVal === 'global thermonuclear war' || cleanVal === 'war') {
            startNuclearSimulation();
            return;
        }
        playBeep(200, 0.15, 'sawtooth');
        await printText("COMMAND UNRECOGNIZED.", 4);
        return;
    }

    if (state === 'TTT') {
        if (cleanVal === 'exit' || cleanVal === 'quit') {
            state = 'COMMAND';
            await printText("GAME CORE UNMOUNTED.", 4);
            return;
        }

        let move = parseInt(cleanVal);
        if (isNaN(move) || move < 1 || move > 9 || tttBoard[move - 1] !== '') {
            playBeep(200, 0.15, 'sawtooth');
            await printText("SECTOR INVALID. RE-ENTER (1-9).", 4);
            return;
        }

        tttBoard[move - 1] = 'X';
        playBeep(523, 0.05, 'sine');
        await renderBoard();

        if (checkWin('X')) {
            sessionScores.playerWins++; updateDB();
            await printText("IMPOSSIBLE ANOMALY: YOU WIN.", 4);
            state = 'COMMAND'; return;
        }
        if (tttBoard.every(c => c !== '')) { tieSequence(); return; }

        let bestMove = getBestMove();
        tttBoard[bestMove] = 'O';
        playBeep(392, 0.05, 'sine');
        await renderBoard();
        
        if (checkWin('O')) {
            sessionScores.woprWins++; updateDB();
            await printText("WOPR WINS.", 4);
            state = 'COMMAND'; return;
        }
        if (tttBoard.every(c => c !== '')) { tieSequence(); }
    }

    if (state === 'WAR_TARGET') {
        if (cleanVal === 'exit' || cleanVal === 'abort') {
            state = 'COMMAND';
            await printText("SIMULATION ABORTED.", 4);
            return;
        }
        state = 'WAR_EXECUTE';
        await printText(`TARGET LOCKED. CALCULATING INTERCONTINENTAL TRAJECTORIES...`, 4);
        executeWarAnimation();
    }
}

function startTTT() {
    state = 'TTT';
    tttBoard = Array(9).fill('');
    printText("INITIALIZING TIC-TAC-TOE GAME MATRIX.\nENTER POSITIONS 1-9:\n  1 | 2 | 3 \n ---|---|---\n  4 | 5 | 6 \n ---|---|---\n  7 | 8 | 9 \n", 2);
}

function renderBoard() {
    let b = tttBoard;
    let grid = `  ${b[0]||'1'} | ${b[1]||'2'} | ${b[2]||'3'} \n ---|---|---\n  ${b[3]||'4'} | ${b[4]||'5'} | ${b[5]||'6'} \n ---|---|---\n  ${b[6]||'7'} | ${b[7]||'8'} | ${b[8]||'9'} `;
    return printText(grid, 2);
}

function checkWin(p) {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return wins.some(c => c.every(i => tttBoard[i] === p));
}

function tieSequence() {
    sessionScores.ties++; updateDB();
    playBeep(440, 0.3, 'sine');
    printText("A STRANGE GAME.\nTHE ONLY WINNING MOVE IS NOT TO PLAY.\n\nRETURNING...", 4);
    state = 'COMMAND';
}

function getBestMove() {
    let score = -Infinity, move = 0;
    for (let i = 0; i < 9; i++) {
        if (tttBoard[i] === '') {
            tttBoard[i] = 'O';
            let s = minimax(tttBoard, 0, false);
            tttBoard[i] = '';
            if (s > score) { score = s; move = i; }
        }
    }
    return move;
}

function minimax(board, d, isMax) {
    if (checkWin('O')) return 10 - d;
    if (checkWin('X')) return d - 10;
    if (board.every(c => c !== '')) return 0;
    if (isMax) {
        let s = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O'; s = Math.max(s, minimax(board, d + 1, false)); board[i] = '';
            }
        }
        return s;
    } else {
        let s = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X'; s = Math.min(s, minimax(board, d + 1, true)); board[i] = '';
            }
        }
        return s;
    }
}

function runGalagaSimulation() {
    canvas.style.display = 'block';
    let shipX = 300, laser = null, enemies = [];
    for(let r=0; r<2; r++) {
        for(let c=0; c<8; c++) { enemies.push({ x: 70 + c*60, y: 30 + r*35, alive: true }); }
    }
    if (galagaInterval) clearInterval(galagaInterval);
    galagaInterval = setInterval(() => {
        ctx.clearRect(0,0,600,200);
        ctx.strokeStyle = '#00ffcc'; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(shipX, 170); ctx.lineTo(shipX - 12, 190); ctx.lineTo(shipX + 12, 190); ctx.closePath(); ctx.stroke();
        let target = enemies.find(e => e.alive);
        if (target) {
            if (shipX < target.x) shipX += 4; else if (shipX > target.x) shipX -= 4;
            if (Math.abs(shipX - target.x) < 10 && !laser) { laser = { x: shipX, y: 170 }; playBeep(1100, 0.04, 'square'); }
        } else {
            clearInterval(galagaInterval); canvas.style.display = 'none';
            sessionScores.galagaScore += 16; updateDB();
            printText("ALL THREATS ELIMINATED.", 4);
        }
        if (laser) {
            laser.y -= 7; ctx.fillStyle = '#ff0055'; ctx.fillRect(laser.x - 1, laser.y, 2, 8);
            if (laser.y < 0) laser = null;
        }
        enemies.forEach(e => {
            if (!e.alive) return;

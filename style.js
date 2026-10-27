const output = document.getElementById('cli-output');
const input = document.getElementById('cli-input');
const browser = document.getElementById('internet-browser');
const glitch = document.getElementById('matrix-glitch');
const jsPane = document.getElementById('code-frontend-view');
const canvas = document.getElementById('galaga-canvas');
const ctx = canvas.getContext('2d');

let state = 'LOGIN'; 
let tttBoard = Array(9).fill('');
let isTyping = false;
let audioCtx = null;
let galagaInterval = null;

// 1. Web Audio API Retro Synth Engine
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
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
}

function playGlitchStatic() {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            playBeep(Math.random() * 800 + 100, 0.05, 'sawtooth');
        }, i * 40);
    }
}

// 2. Simulated Typewriter Engine
function printText(text, delay = 15) {
    return new Promise((resolve) => {
        isTyping = true;
        input.disabled = true;
        let index = 0;
        
        // Output prompt token cleanly immediately
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
                    playBeep(880, 0.01, 'square');
                }
                index++;
                setTimeout(typeChar, delay);
            } else {
                output.textContent += "\n";
                isTyping = false;
                input.disabled = false;
                input.focus();
                resolve();
            }
        }
        typeChar();
    });
}

// Input Routing Hooks
input.addEventListener('keydown', async function(e) {
    if (isTyping) {
        e.preventDefault();
        return;
    }
    if (e.key === 'Enter') {
        let val = input.value.trim();
        input.value = '';
        if (val === '') return;

        await printText("\n> " + val, 5);
        processCommand(val);
    }
});

function triggerGlitchEffect() {
    glitch.classList.remove('active-glitch');
    void glitch.offsetWidth; 
    glitch.classList.add('active-glitch');
    playGlitchStatic();
}

function fetchSelfSource() {
    fetch('script.js')
        .then(res => res.text())
        .then(code => { jsPane.textContent = code; })
        .catch(() => { jsPane.textContent = "// Error dynamically extracting local runtime stream."; });
}

async function processCommand(val) {
    let cleanVal = val.toLowerCase();

    if (state === 'LOGIN') {
        if (cleanVal === 'joshua') {
            state = 'COMMAND';
            playBeep(600, 0.2, 'sine');
            await printText("GREETINGS PROFESSOR FALKEN.\n\nSHALL WE PLAY A GAME?\n\nAvailable operations:\n- [games] : List available network simulation layers\n- [browser] : Open Core Network View\n- [galaga] : Run tactical array emulation\n- [logout] : Drop connection mapping");
        } else {
            playBeep(150, 0.4, 'sawtooth');
            await printText("IDENTIFICATION NOT RECOGNIZED BY CENTRAL TERMINAL.\nTRY AGAIN.");
        }
        return;
    }

    if (state === 'COMMAND') {
        if (cleanVal === 'logout') {
            state = 'LOGIN';
            playBeep(300, 0.3, 'sine');
            await printText("CONNECTION TERMINATED.\n--- WOPR MULTI-FRAME SYSTEM ONLINE ---");
            return;
        }
        if (cleanVal === 'browser') {
            triggerGlitchEffect();
            fetchSelfSource();
            setTimeout(() => { browser.style.display = 'flex'; }, 150);
            await printText("DECRYPTING INTERNET PACKET PIPELINE CONFIGURATIONS...");
            return;
        }
        if (cleanVal === 'galaga') {
            runGalagaSimulation();
            return;
        }
        if (cleanVal === 'games') {
            await printText("AVAILABLE MATRIX SYSTEMS:\n- TIC-TAC-TOE\n- CHESS\n- GLOBAL THERMONUCLEAR WAR\n\nType game name to mount engine.");
            return;
        }
        if (cleanVal === 'tic-tac-toe' || cleanVal === 'tictactoe') {
            startTTT();
            return;
        }
        playBeep(200, 0.2, 'sawtooth');
        await printText("COMMAND UNRECOGNIZED. ATTEMPT VALID INTERFACE.");
        return;
    }

    if (state === 'TTT') {
        if (cleanVal === 'exit' || cleanVal === 'quit') {
            state = 'COMMAND';
            await printText("GAME CORE UNMOUNTED. BACK TO SYSTEM.");
            return;
        }

        let move = parseInt(cleanVal);
        if (isNaN(move) || move < 1 || move > 9 || tttBoard[move - 1] !== '') {
            playBeep(200, 0.2, 'sawtooth');
            await printText("SECTOR INVALID. RE-ENTER MATRIX COORDINATE (1-9).");
            return;
        }

        tttBoard[move - 1] = 'X';
        playBeep(523.25, 0.08, 'sine');
        await renderBoard();

        if (checkWin('X')) return;
        if (tttBoard.every(c => c !== '')) { tieSequence(); return; }

        await printText("WOPR MATRIX CALCULATING RESPONSE...");
        let bestMove = getBestMove();
        tttBoard[bestMove] = 'O';
        
        playBeep(392.00, 0.08, 'sine');
        await renderBoard();
        
        if (checkWin('O')) {
            await printText("WOPR WINS. STRATEGIC POSITION SECURED.");
            state = 'COMMAND';
        }
        if (tttBoard.every(c => c !== '')) { tieSequence(); }
    }
}

function startTTT() {
    state = 'TTT';
    tttBoard = Array(9).fill('');
    printText("INITIALIZING TIC-TAC-TOE GAME MATRIX.\nENTER FIELDS VIA INDEX POSITIONS 1 THROUGH 9:\n  1 | 2 | 3 \n ---|---|---\n  4 | 5 | 6 \n ---|---|---\n  7 | 8 | 9 \n");
}

function renderBoard() {
    let b = tttBoard;
    let grid = `  ${b[0]||'1'} | ${b[1]||'2'} | ${b[2]||'3'} \n ---|---|---\n  ${b[3]||'4'} | ${b[4]||'5'} | ${b[5]||'6'} \n ---|---|---\n  ${b[6]||'7'} | ${b[7]||'8'} | ${b[8]||'9'} `;
    return printText(grid, 5);
}

function checkWin(p) {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return wins.some(c => c.every(i => tttBoard[i] === p));
}

function tieSequence() {
    playBeep(440, 0.5, 'sine');
    printText("A STRANGE GAME.\nTHE ONLY WINNING MOVE IS NOT TO PLAY.\n\nRETURNING TO MAIN ROUTER...");
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
                board[i] = 'O';
                s = Math.max(s, minimax(board, d + 1, false));
                board[i] = '';
            }
        }
        return s;
    } else {
        let s = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                s = Math.min(s, minimax(board, d + 1, true));
                board[i] = '';
            }
        }
        return s;
    }
}

// 3. HTML5 Canvas Vector Galaga Simulation Engine
function runGalagaSimulation() {
    canvas.style.display = 'block';
    printText("LAUNCHING TACTICAL ARRAY EMULATION ENGINE...");
    
    let shipX = 300, laser = null, enemies = [];
    for(let r=0; r<2; r++) {
        for(let c=0; c<8; c++) {
            enemies.push({ x: 70 + c*60, y: 40 + r*40, alive: true });
        }
    }

    if (galagaInterval) clearInterval(galagaInterval);
    
    galagaInterval = setInterval(() => {
        ctx.clearRect(0,0,600,300);
        
        // Draw Player Ship (Vector wireframe styling)
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(shipX, 260); ctx.lineTo(shipX - 15, 285);
        ctx.lineTo(shipX + 15, 285); ctx.closePath(); ctx.stroke();

        // Ship Automated AI Movements
        let target = enemies.find(e => e.alive);
        if (target) {
            if (shipX < target.x) shipX += 3;
            else if (shipX > target.x) shipX -= 3;
            
            if (Math.abs(shipX - target.x) < 10 && !laser) {
                laser = { x: shipX, y: 260 };
                playBeep(1200, 0.05, 'square');
            }
        } else {
            clearInterval(galagaInterval);
            canvas.style.display = 'none';
            printText("EMULATION COMPLETED. ALL VECTOR TARGETS ELIMINATED.");
        }

        // Handle Active Lasers
        if (laser) {
            laser.y -= 8;
            ctx.fillStyle = '#ff0055';
            ctx.fillRect(laser.x - 1, laser.y, 3, 10);
            if (laser.y < 0) laser = null;
        }

        // Draw and Collision Detect Enemies
        enemies.forEach(e => {
            if (!e.alive) return;

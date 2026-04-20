function speak(text, gender = 'female') {
    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';

    // Try to find a specific French voice based on gender
    const voices = window.speechSynthesis.getVoices();
    const frVoices = voices.filter(v => v.lang.startsWith('fr'));

    if (frVoices.length > 0) {
        let selectedVoice = null;
        if (gender === 'male') {
            selectedVoice = frVoices.find(v =>
                v.name.toLowerCase().includes('male') ||
                v.name.toLowerCase().includes('paul') ||
                v.name.toLowerCase().includes('thomas') ||
                v.name.toLowerCase().includes('daniel') ||
                v.name.toLowerCase().includes('julien')
            );
        } else {
            selectedVoice = frVoices.find(v =>
                v.name.toLowerCase().includes('female') ||
                v.name.toLowerCase().includes('audrey') ||
                v.name.toLowerCase().includes('julie') ||
                v.name.toLowerCase().includes('hortense') ||
                v.name.toLowerCase().includes('celine') ||
                v.name.toLowerCase().includes('lea')
            );
        }
        // Fallback to first French voice if gender match is not found
        utterance.voice = selectedVoice || frVoices[0];
    }

    utterance.rate = 0.9;
    // Slight pitch adjustment as a backup for gender differentiation
    utterance.pitch = gender === 'male' ? 0.8 : 1.1;

    window.speechSynthesis.speak(utterance);
}

// --- Sound Logic ---
let isMuted = false;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (isMuted) return;
    initAudio();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    switch (type) {
        case 'click':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            break;

        case 'correct':
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.2); // C6
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
            break;

        case 'incorrect':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now); // A3
            osc.frequency.linearRampToValueAtTime(110, now + 0.2); // A2
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
            break;

        case 'win':
            // Simple fanfare
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, i) => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.connect(g);
                g.connect(audioCtx.destination);
                o.frequency.setValueAtTime(freq, now + (i * 0.15));
                g.gain.setValueAtTime(0.1, now + (i * 0.15));
                g.gain.exponentialRampToValueAtTime(0.0001, now + (i * 0.15) + 0.4);
                o.start(now + (i * 0.15));
                o.stop(now + (i * 0.15) + 0.4);
            });
            break;
    }
}

function toggleMute() {
    isMuted = !isMuted;
    const btn = document.getElementById('mute-toggle');
    const icon = document.getElementById('mute-icon');

    if (isMuted) {
        btn.classList.add('muted');
        icon.textContent = '🔇';
    } else {
        btn.classList.remove('muted');
        icon.textContent = '🔊';
        // Resume context if it was suspended (browser policy)
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }
}

// --- Matching Game Logic ---
let selectedEn = null;
let selectedFr = null;
let matches = 0;
let attempts = 0;
let currentSet = 0;

const allPairs = [
    [
        { en: "Hello", fr: "Bonjour" },
        { en: "Good afternoon", fr: "Bon après-midi" },
        { en: "Good evening", fr: "Bonsoir" },
        { en: "Good night", fr: "Bonne nuit" },
        { en: "Hi / Bye", fr: "Salut" },
        { en: "Goodbye", fr: "Au revoir" },
        { en: "Thank you", fr: "Merci" },
        { en: "Welcome", fr: "Bienvenue" }
    ],
    [
        { en: "You're welcome", fr: "De rien" },
        { en: "Nice to meet you", fr: "Enchanté" },
        { en: "See you soon", fr: "À bientôt" },
        { en: "See you tomorrow", fr: "À demain" },
        { en: "See you later", fr: "À plus tard" },
        { en: "Until next time", fr: "À la prochaine" },
        { en: "Please", fr: "S'il vous plaît" },
        { en: "Sorry", fr: "Désolé" }
    ],
    [
        { en: "Have a good day", fr: "Bonne journée" },
        { en: "Have a good evening", fr: "Bonne soirée" },
        { en: "Excuse me", fr: "Excusez-moi" },
        { en: "Pardon?", fr: "Pardon?" },
        { en: "Sir", fr: "Monsieur" },
        { en: "Madam", fr: "Madame" },
        { en: "Miss", fr: "Mademoiselle" },
        { en: "Hello Sir", fr: "Bonjour Monsieur" }
    ],
    [
        { en: "How are you? (Tu)", fr: "Comment vas-tu?" },
        { en: "How are you? (Vous)", fr: "Comment allez-vous?" },
        { en: "How's it going?", fr: "Comment ça va?" },
        { en: "Are you well? (Tu)", fr: "Tu vas bien?" },
        { en: "Are you well? (Vous)", fr: "Vous allez bien?" },
        { en: "I am doing well", fr: "Je vais bien" },
        { en: "Things are going well", fr: "Ça va bien" },
        { en: "Things are going badly", fr: "Ça va mal" }
    ],
    [
        { en: "My name is...", fr: "Je m'appelle..." },
        { en: "I am...", fr: "Je suis..." },
        { en: "Me, This is...", fr: "Moi, c'est..." },
        { en: "What is your name? (Tu)", fr: "Comment tu t'appelles?" },
        { en: "What is your name? (Vous)", fr: "Comment vous appelez-vous?" },
        { en: "How do you spell it?", fr: "Comment ça s'épelle?" },
        { en: "So-so", fr: "Comme ci comme ça" },
        { en: "I'm fine", fr: "Ça va" }
    ]
];

function initGame() {
    const enCol = document.getElementById('english-column');
    const frCol = document.getElementById('french-column');
    const setIndicator = document.getElementById('set-indicator');
    if (!enCol || !frCol) return;

    const currentPairs = allPairs[currentSet];

    // Update set indicator
    if (setIndicator) {
        setIndicator.textContent = `Set ${currentSet + 1} / ${allPairs.length}`;
    }

    // Reset stats for the current set
    matches = 0;
    attempts = 0;
    updateStats();

    // Hide submit button
    const submitBtn = document.getElementById('submit-container');
    if (submitBtn) submitBtn.style.display = 'none';

    // Enable interaction
    enCol.style.pointerEvents = 'auto';
    frCol.style.pointerEvents = 'auto';

    // Clear columns
    enCol.innerHTML = '';
    frCol.innerHTML = '';

    // Shuffle and create English items
    const shuffledEn = [...currentPairs].sort(() => Math.random() - 0.5);
    shuffledEn.forEach(pair => {
        const div = document.createElement('div');
        div.className = 'match-item';
        div.innerHTML = `<span>${pair.en}</span>`;
        div.dataset.value = pair.en;
        div.onclick = () => selectItem(div, 'en');
        enCol.appendChild(div);
    });

    // Shuffle and create French items
    const shuffledFr = [...currentPairs].sort(() => Math.random() - 0.5);
    shuffledFr.forEach(pair => {
        const div = document.createElement('div');
        div.className = 'match-item';
        div.innerHTML = `<span>${pair.fr}</span>`;
        div.dataset.value = pair.fr;
        div.onclick = () => selectItem(div, 'fr');
        frCol.appendChild(div);
    });
}

function loadPreviousSet() {
    if (currentSet > 0) {
        currentSet--;
        initGame();
    }
}

function loadNextSetManually() {
    if (currentSet < allPairs.length - 1) {
        currentSet++;
        initGame();
    }
}

function selectItem(element, side) {
    if (element.classList.contains('matched')) return;

    playSound('click');

    if (side === 'fr') {
        speak(element.dataset.value);
    }

    if (side === 'en') {
        if (selectedEn) selectedEn.classList.remove('selected');
        selectedEn = element;
        element.classList.add('selected');
    } else {
        if (selectedFr) selectedFr.classList.remove('selected');
        selectedFr = element;
        element.classList.add('selected');
    }

    if (selectedEn && selectedFr) {
        checkMatch();
    }
}

function checkMatch() {
    attempts++;
    const currentPairs = allPairs[currentSet];
    const match = currentPairs.find(p => p.en === selectedEn.dataset.value && p.fr === selectedFr.dataset.value);

    if (match) {
        playSound('correct');
        selectedEn.classList.remove('selected');
        selectedFr.classList.remove('selected');
        selectedEn.classList.add('matched');
        selectedFr.classList.add('matched');
        matches++;

        selectedEn = null;
        selectedFr = null;

        if (matches === currentPairs.length) {
            handleSetCompletion();
        }
    } else {
        playSound('incorrect');
        const enObj = selectedEn;
        const frObj = selectedFr;
        enObj.classList.add('incorrect');
        frObj.classList.add('incorrect');

        selectedEn = null;
        selectedFr = null;

        setTimeout(() => {
            enObj.classList.remove('selected', 'incorrect');
            frObj.classList.remove('selected', 'incorrect');
        }, 500);
    }
    updateStats();
}

function handleSetCompletion() {
    // Show submit button when 8 words are matched
    setTimeout(() => {
        playSound('win');
        const submitBtn = document.getElementById('submit-container');
        if (submitBtn) submitBtn.style.display = 'block';

        // Disable further clicks
        document.getElementById('english-column').style.pointerEvents = 'none';
        document.getElementById('french-column').style.pointerEvents = 'none';
    }, 500);
}

function submitSet() {
    showSuccess();
}

function updateStats() {
    const matchesEl = document.getElementById('matches-count');
    const attemptsEl = document.getElementById('attempts-count');
    const currentPairs = allPairs[currentSet];
    if (matchesEl) matchesEl.textContent = `${matches}/${currentPairs.length}`;
    if (attemptsEl) attemptsEl.textContent = attempts;
}

function showSuccess() {
    const modal = document.getElementById('success-modal');
    const finalAttempts = document.getElementById('final-attempts');
    const modalTitle = modal.querySelector('h2');
    const modalText = modal.querySelector('p');
    const modalBtn = modal.querySelector('.btn-reset');

    if (modal && finalAttempts) {
        finalAttempts.textContent = attempts;

        // Appreciation logic
        if (currentSet < allPairs.length - 1) {
            modalTitle.textContent = "Fantastique!";
            modalText.textContent = `You finished Set ${currentSet + 1}! You are doing great!`;
            modalBtn.textContent = "Next Set ➡️";
            modalBtn.onclick = () => {
                modal.style.display = 'none';
                currentSet++;
                initGame();
            };
        } else {
            modalTitle.textContent = "Magnifique!";
            modalText.textContent = "You have completed all sets for Lesson 1!";
            modalBtn.textContent = "Play Again 🔄";
            modalBtn.onclick = () => resetGame();
        }

        modal.style.display = 'flex';
    }
}

function resetGame() {
    const modal = document.getElementById('success-modal');
    if (modal) modal.style.display = 'none';
    currentSet = 0;
    initGame();
}

// Ensure cards on other pages still work and initialize game if relevant
document.addEventListener('DOMContentLoaded', () => {
    initGame();
});


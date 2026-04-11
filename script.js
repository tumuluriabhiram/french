function speak(element) {
    // Stop any current speech
    window.speechSynthesis.cancel();

    let text = "";
    
    // Find the French word based on the type of card
    if (element.classList.contains('alphabet-card')) {
        text = element.textContent.trim();
    } else if (element.classList.contains('vocab-card')) {
        const h3 = element.querySelector('h3');
        const h4 = element.querySelector('h4');
        // Prefer h3 for greetings, h4 for time expressions/verbs
        text = h3 ? h3.textContent : (h4 ? h4.textContent : "");
    } else if (element.classList.contains('number-card')) {
        const frenchWord = element.querySelector('.french-word');
        text = frenchWord ? frenchWord.textContent : "";
    } else if (element.classList.contains('conjugation-row')) {
        const pronoun = element.querySelector('.pronoun').textContent;
        const verb = element.querySelector('.verb').textContent;
        text = pronoun + " " + verb;
    } else {
        // Fallback: search for h3/h4/french-word
        const target = element.querySelector('h3, h4, .french-word, .french');
        text = target ? target.textContent : element.textContent;
    }

    text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    
    // Remove text in parentheses for cleaner speech
    text = text.replace(/\(.*\)/g, '').trim();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9; // Slightly slower for better learning
    utterance.pitch = 1.0;
    
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

    switch(type) {
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
        { en: "Good night", fr: "Bonne nuit" },
        { en: "Thank you", fr: "Merci" },
        { en: "Goodbye", fr: "Au revoir" },
        { en: "Please", fr: "S'il vous plaît" },
        { en: "See you soon", fr: "À bientôt" },
        { en: "Welcome", fr: "Bienvenue" },
        { en: "Hi / Bye", fr: "Salut" }
    ],
    [
        { en: "Good afternoon", fr: "Bon après-midi" },
        { en: "Good evening", fr: "Bonsoir" },
        { en: "You're welcome", fr: "De rien" },
        { en: "Nice to meet you", fr: "Enchanté" },
        { en: "See you tomorrow", fr: "À demain" },
        { en: "See you later", fr: "À plus tard" },
        { en: "Until next time", fr: "À la prochaine" },
        { en: "Sorry", fr: "Désolé" }
    ]
];

function initGame() {
    const enCol = document.getElementById('english-column');
    const frCol = document.getElementById('french-column');
    if (!enCol || !frCol) return;

    const currentPairs = allPairs[currentSet];

    // Reset stats for the current set
    matches = 0;
    attempts = 0;
    updateStats();

    // Hide next button
    const nextBtn = document.getElementById('next-set-container');
    if (nextBtn) nextBtn.style.display = 'none';

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

function selectItem(element, side) {
    if (element.classList.contains('matched')) return;
    
    playSound('click');

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
    if (currentSet < allPairs.length - 1) {
        // Show next button
        setTimeout(() => {
            playSound('win');
            const nextBtn = document.getElementById('next-set-container');
            if (nextBtn) nextBtn.style.display = 'block';
            
            // Disable further clicks until next set
            document.getElementById('english-column').style.pointerEvents = 'none';
            document.getElementById('french-column').style.pointerEvents = 'none';
        }, 500);
    } else {
        // Final completion
        setTimeout(() => {
            playSound('win');
            showSuccess();
        }, 500);
    }
}

function loadNextSet() {
    currentSet++;
    initGame();
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
    if (modal && finalAttempts) {
        finalAttempts.textContent = attempts;
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
    const cards = document.querySelectorAll('.vocab-card, .number-card, .alphabet-card, .lesson-card');
    
    cards.forEach(card => {
        if (!card.hasAttribute('onclick')) {
            card.setAttribute('onclick', 'speak(this)');
        }
    });

    initGame();
});


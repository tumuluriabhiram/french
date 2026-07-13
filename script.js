import { md5 } from 'https://cdn.jsdelivr.net/npm/js-md5@0.8.3/+esm'
function speak(word) {
    let fileHash = md5(word);
    // 1. Construct the path to the voice file
    // Assumes 'public' is the root directory of your web server
    const audioPath = `/voices/${fileHash}.mp3`;

    // 2. Create a new Audio object and play it
    const audio = new Audio(audioPath);

    audio.play().catch(error => {
        console.error(`Failed to play audio for hash [${fileHash}]:`, error);
        speakWithBrowserVoice(word);
    });
}

function speakWithBrowserVoice(text) {
    if (!('speechSynthesis' in window)) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.95;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
}

window.speak = speak;



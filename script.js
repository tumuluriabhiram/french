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

function numberToFrench(number) {
    const units = [
        'zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept',
        'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze',
        'quinze', 'seize'
    ];

    if (number <= 16) return units[number];
    if (number < 20) return `dix-${units[number - 10]}`;
    if (number === 20) return 'vingt';
    if (number < 30) return number === 21 ? 'vingt et un' : `vingt-${units[number - 20]}`;
    if (number === 30) return 'trente';
    if (number < 40) return number === 31 ? 'trente et un' : `trente-${units[number - 30]}`;
    if (number === 40) return 'quarante';
    if (number < 50) return number === 41 ? 'quarante et un' : `quarante-${units[number - 40]}`;
    if (number === 50) return 'cinquante';
    if (number < 60) return number === 51 ? 'cinquante et un' : `cinquante-${units[number - 50]}`;
    if (number === 60) return 'soixante';

    if (number < 70) return `soixante-${units[number - 60]}`;
    if (number === 70) return 'soixante-dix';
    if (number === 71) return 'soixante et onze';
    if (number < 80) return `soixante-${numberToFrench(number - 60)}`;
    if (number === 80) return 'quatre-vingts';
    if (number === 81) return 'quatre-vingt-un';
    if (number < 90) return `quatre-vingt-${units[number - 80]}`;
    if (number === 90) return 'quatre-vingt-dix';
    if (number === 91) return 'quatre-vingt-onze';
    if (number < 100) return `quatre-vingt-${numberToFrench(number - 80)}`;
    if (number === 100) return 'cent';

    return String(number);
}

window.numberToFrench = numberToFrench;
window.speak = speak;



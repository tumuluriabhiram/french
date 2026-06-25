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
    });
}
window.speak = speak;



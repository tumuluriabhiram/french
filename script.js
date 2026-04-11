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

    // Clean up emojis from text
    text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9; // Slightly slower for better learning
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
}

// Add hover sound effect (optional but nice)
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.vocab-card, .number-card, .alphabet-card, .lesson-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            // Subtle feedback if needed
        });
        
        // Ensure all cards have the clicking functionality
        if (!card.hasAttribute('onclick')) {
            card.setAttribute('onclick', 'speak(this)');
        }
    });
});

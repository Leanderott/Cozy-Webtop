// Drag and Drop Logik für unbegrenzt viele Widgets
const widgets = document.querySelectorAll('.widget');
let activeWidget = null;
let offsetX = 0;
let offsetY = 0;

widgets.forEach(widget => {
    const header = widget.querySelector('.widget-header');
    
    // Positionen beim Laden aus localStorage holen
    const savedPos = localStorage.getItem(`pos-${widget.id}`);
    if (savedPos) {
        const { top, left } = JSON.parse(savedPos);
        widget.style.top = top;
        widget.style.left = left;
    }

    header.addEventListener('mousedown', (e) => {
        activeWidget = widget;
        // Z-Index erhöhen, damit das gezogene Widget immer oben liegt
        widgets.forEach(w => w.style.zIndex = 10);
        widget.style.zIndex = 100;
        
        offsetX = e.clientX - widget.getBoundingClientRect().left;
        offsetY = e.clientY - widget.getBoundingClientRect().top;
    });
});

document.addEventListener('mousemove', (e) => {
    if (!activeWidget) return;
    
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    
    activeWidget.style.left = `${x}px`;
    activeWidget.style.top = `${y}px`;
});

document.addEventListener('mouseup', () => {
    if (activeWidget) {
        // Position im Speicher sichern
        localStorage.setItem(`pos-${activeWidget.id}`, JSON.stringify({
            top: activeWidget.style.top,
            left: activeWidget.style.left
        }));
        activeWidget = null;
    }
});

// Uhrzeit & Datum aktualisieren
function updateClock() {
    const timeEl = document.getElementById('clock-time');
    const dateEl = document.getElementById('clock-date');
    const now = new Date();
    
    timeEl.textContent = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    dateEl.textContent = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}
setInterval(updateClock, 1000);
updateClock();

// Widget ein- und ausblenden (Dock Logik)
function minimizeWidget(id) {
    const w = document.getElementById(id);
    w.style.opacity = '0';
    setTimeout(() => w.style.display = 'none', 200);
}

function restoreWidget(id) {
    const w = document.getElementById(id);
    w.style.display = 'block';
    setTimeout(() => w.style.opacity = '1', 50);
}

// Hintergrundbild Upload (Lokal im Browser gespeichert)
const bgUpload = document.getElementById('bg-upload');
const bgOverlay = document.getElementById('bgOverlay');

bgUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const imgData = event.target.result;
            document.documentElement.style.setProperty('--bg-image', `url(${imgData})`);
            localStorage.setItem('custom-bg', imgData);
        };
        reader.readAsDataURL(file);
    }
});

// Beim Laden gespeicherten Hintergrund laden
const savedBg = localStorage.getItem('custom-bg');
if (savedBg) {
    document.documentElement.style.setProperty('--bg-image', `url(${savedBg})`);
}

// Sticky Notes Autosave
const notesTextarea = document.getElementById('notes-textarea');
notesTextarea.value = localStorage.getItem('saved-notes') || '';
notesTextarea.addEventListener('input', () => {
    localStorage.setItem('saved-notes', notesTextarea.value);
});

// Spotify Embed Link updaten
function updateSpotifyLink() {
    const input = document.getElementById('spotify-link-input');
    let url = input.value.trim();
    
    if (url) {
        // Konvertiert normalen Spotify Link in einen Embed-Link
        if (url.includes('spotify.com') && !url.includes('/embed')) {
            url = url.replace('spotify.com/', 'spotify.com/embed/');
        }
        
        const iframe = document.getElementById('spotify-iframe');
        iframe.src = url;
        localStorage.setItem('spotify-embed-url', url);
        input.value = '';
    }
}

// Gespeicherten Spotify Link laden
const savedSpotify = localStorage.getItem('spotify-embed-url');
if (savedSpotify) {
    document.getElementById('spotify-iframe').src = savedSpotify;
}

// Cartoon-Haustier Logik (Animationen über File-Wechsel)
const petImg = document.getElementById('pet-img');
const petBubble = document.getElementById('petBubble');
const petContainer = document.getElementById('pet-container');

// Liste der Verhaltenszustände (Diese SVGs erstellst du im Ordner assets/pets/cat/)
const petStates = {
    idle: 'assets/pets/cat/cat-idle.svg',
    sleep: 'assets/pets/cat/cat-sleep.svg',
    play: 'assets/pets/cat/cat-play.svg'
};

const dialogueOptions = [
    "Miau! ✨", 
    "Lofi-Beats sind heute wieder gut...", 
    "Hast du genug Wasser getrunken? 💧", 
    "Lass uns produktiv sein! 🚀", 
    "Zzz...", 
    "Fütterst du mich gleich? 🐟"
];

// Tier klickbar machen für Bubble-Nachrichten und State-Wechsel
petContainer.addEventListener('click', () => {
    // Bubble anzeigen
    const randomText = dialogueOptions[Math.floor(Math.random() * dialogueOptions.length)];
    petBubble.textContent = randomText;
    petBubble.style.opacity = '1';
    
    // Zustand kurzfristig ändern (Katze "spielt" wenn angeklickt)
    petImg.src = petStates.play;
    petContainer.style.transform = 'scale(1.15)';
    
    setTimeout(() => {
        petBubble.style.opacity = '0';
        petImg.src = petStates.idle;
        petContainer.style.transform = 'scale(1)';
    }, 3000);
});

// Gelegentlicher automatischer Verhaltenswechsel (z.B. Katze schläft ein)
setInterval(() => {
    const rand = Math.random();
    if (rand < 0.3) {
        petImg.src = petStates.sleep;
        petBubble.textContent = "Zzz...";
        petBubble.style.opacity = '0.7';
    } else {
        petImg.src = petStates.idle;
        petBubble.style.opacity = '0';
    }
}, 15000);

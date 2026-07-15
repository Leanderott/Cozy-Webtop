// ==========================================
// 1. DASHBOARD & WIDGET LOGIK
// ==========================================
const widgets = document.querySelectorAll('.widget');
let activeWidget = null;
let offsetX = 0; let offsetY = 0;

widgets.forEach(widget => {
    const header = widget.querySelector('.widget-header');
    const savedPos = localStorage.getItem(`pos-${widget.id}`);
    if (savedPos) {
        const { top, left } = JSON.parse(savedPos);
        widget.style.top = top;
        widget.style.left = left;
    }

    header.addEventListener('mousedown', (e) => {
        activeWidget = widget;
        widgets.forEach(w => w.style.zIndex = 10);
        widget.style.zIndex = 12;
        offsetX = e.clientX - widget.getBoundingClientRect().left;
        offsetY = e.clientY - widget.getBoundingClientRect().top;
    });
});

document.addEventListener('mousemove', (e) => {
    if (!activeWidget) return;
    activeWidget.style.left = `${e.clientX - offsetX}px`;
    activeWidget.style.top = `${e.clientY - offsetY}px`;
});

document.addEventListener('mouseup', () => {
    if (activeWidget) {
        localStorage.setItem(`pos-${activeWidget.id}`, JSON.stringify({
            top: activeWidget.style.top,
            left: activeWidget.style.left
        }));
        activeWidget = null;
    }
});

// UI Helper (Uhr, Dock, Background, Spotify, Notes)
setInterval(() => {
    document.getElementById('clock-time').textContent = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('clock-date').textContent = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}, 1000);

function minimizeWidget(id) { document.getElementById(id).style.display = 'none'; }
function restoreWidget(id) { document.getElementById(id).style.display = 'block'; }

document.getElementById('bg-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            document.documentElement.style.setProperty('--bg-image', `url(${event.target.result})`);
            localStorage.setItem('custom-bg', event.target.result);
        };
        reader.readAsDataURL(file);
    }
});
if (localStorage.getItem('custom-bg')) {
    document.documentElement.style.setProperty('--bg-image', `url(${localStorage.getItem('custom-bg')})`);
}

const notes = document.getElementById('notes-textarea');
notes.value = localStorage.getItem('saved-notes') || '';
notes.addEventListener('input', () => localStorage.setItem('saved-notes', notes.value));

function updateSpotifyLink() {
    let url = document.getElementById('spotify-link-input').value.trim();
    if (url) {
        if (url.includes('spotify.com') && !url.includes('/embed')) url = url.replace('spotify.com', 'spotify.com/embed');
        document.getElementById('spotify-iframe').src = url;
        localStorage.setItem('spotify-embed-url', url);
    }
}
document.getElementById('spotify-iframe').src = localStorage.getItem('spotify-embed-url') || 'about:blank';


// ==========================================
// 2. 3D SCENE & PET INITIALIZATION
// ==========================================
let scene, camera, renderer, myCat;
let raycaster, mouse, time = 0;
let targetX = 0;
const petBubble = document.getElementById('petBubble');

function init3D() {
    const canvas = document.getElementById('pet-3d-canvas');
    scene = new THREE.Scene();

    const aspect = window.innerWidth / window.innerHeight;
    const d = 6; // Sichtfeld etwas vergrößert für die größere Katze
    camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
    camera.position.set(0, 4, 10);
    camera.lookAt(0, -1, 0);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Licht
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dirLight = new THREE.DirectionLight(0xffffff, 0.5);
    dirLight.position.set(5, 10, 8);
    scene.add(dirLight);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // HIER ERSCHAFFEN WIR DIE KATZE AUS DER EXTERNEN DATEI
    myCat = new KawaiiCat(scene);

    window.addEventListener('resize', () => {
        const aspect = window.innerWidth / window.innerHeight;
        camera.left = -d * aspect; camera.right = d * aspect;
        camera.top = d; camera.bottom = -d;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('click', onDesktopClick);
    animate();
}

function onDesktopClick(event) {
    if (event.target.closest('.widget') || event.target.closest('.dock')) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // Prüfen ob die Katze (oder ein Teil davon) angeklickt wurde
    const intersects = raycaster.intersectObjects(myCat.group.children, true);

    if (intersects.length > 0) {
        myCat.triggerJump();
        showBubble();
    } else {
        targetX = mouse.x * camera.right; // Katze soll dorthin laufen
    }
}

function showBubble() {
    const texts = ["Miau! ✨", "Lofi-Vibes... ☕", "Streichel mich! 🐾", "Zzz...", "Salto! 🚀"];
    petBubble.textContent = texts[Math.floor(Math.random() * texts.length)];
    petBubble.style.opacity = '1';
    setTimeout(() => petBubble.style.opacity = '0', 3500);
}

function updateBubblePosition() {
    if (!myCat || !myCat.headGroup) return;
    const vector = new THREE.Vector3();
    myCat.headGroup.getWorldPosition(vector);
    vector.project(camera);
    const x = (vector.x * .5 + .5) * window.innerWidth;
    const y = (vector.y * -.5 + .5) * window.innerHeight;
    petBubble.style.left = `${x}px`;
    petBubble.style.top = `${y - 120}px`;
}

function animate() {
    requestAnimationFrame(animate);
    time += 0.02;
    
    // Wir übergeben die Zeit und das Ziel an unsere externe Klasse
    if (myCat) {
        myCat.update(time, targetX);
        updateBubblePosition();
    }
    
    renderer.render(scene, camera);
}

window.onload = init3D;

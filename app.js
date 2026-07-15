// ==========================================
// 1. STANDARD DASHBOARD LOGIK (Drag, Save, etc.)
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
        widget.style.zIndex = 12; // Immer über dem Canvas (z-index 5) und anderen Widgets
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

// Uhr, Notes, Background & Spotify wie gehabt...
function updateClock() {
    document.getElementById('clock-time').textContent = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('clock-date').textContent = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}
setInterval(updateClock, 1000); updateClock();

function minimizeWidget(id) { document.getElementById(id).style.display = 'none'; }
function restoreWidget(id) { document.getElementById(id).style.display = 'block'; }

const bgUpload = document.getElementById('bg-upload');
bgUpload.addEventListener('change', (e) => {
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
const savedBg = localStorage.getItem('custom-bg');
if (savedBg) document.documentElement.style.setProperty('--bg-image', `url(${savedBg})`);

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
// 2. 3D PET ENGINE (Three.js)
// ==========================================

let scene, camera, renderer, clock, mixer, petModel;
let raycaster, mouse; // Für Klicks auf die 3D-Katze
let targetX = 0, targetY = -2; // Zielkoordinaten für die Bewegung
let currentAction, idleAction, walkAction;

const petBubble = document.getElementById('petBubble');

function init3D() {
    const canvas = document.getElementById('pet-3d-canvas');
    clock = new THREE.Clock();

    // Szene erstellen
    scene = new THREE.Scene();

    // Kamera (Orthographisch für den perfekten Flat-3D-Look)
    const aspect = window.innerWidth / window.innerHeight;
    const d = 5;
    camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    // Renderer (mit transparentem Hintergrund alpha: true)
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Licht
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionLight(0xffffff, 0.6);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // Raycaster für Klick-Erkennung initialisieren
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // 3D-Modell laden
    const loader = new THREE.GLTFLoader();
    
    // WICHTIG: Pfad zu deinem 3D-Modell (.glb oder .gltf)
    loader.load('assets/pets/cat/cat.glb', function (gltf) {
        petModel = gltf.scene;
        petModel.scale.set(1.5, 1.5, 1.5); // Größe anpassen
        petModel.position.set(0, -2, 0); // Startposition
        scene.add(petModel);

        // Animationen einrichten (falls das Modell welche hat!)
        mixer = new THREE.AnimationMixer(petModel);
        if (gltf.animations.length > 0) {
            // Wir nehmen an, Animation 0 ist Idle, Animation 1 ist Walk
            idleAction = mixer.clipAction(gltf.animations[0]);
            if (gltf.animations[1]) {
                walkAction = mixer.clipAction(gltf.animations[1]);
            }
            idleAction.play();
            currentAction = idleAction;
        }

        animate();
    }, undefined, function (error) {
        console.error('Fehler beim Laden des 3D-Modells:', error);
    });

    // Event Listener
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onPetClick);
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const d = 5;
    camera.left = -d * aspect;
    camera.right = d * aspect;
    camera.top = d;
    camera.bottom = -d;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 3D-Animation Loop
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    if (petModel) {
        // Sanfte Drehung und Bewegung zum Zielpunkt (targetX, targetY)
        const dx = targetX - petModel.position.x;
        const dy = targetY - petModel.position.y;
        const distance = Math.sqrt(dx*dx + dy*dy);

        if (distance > 0.1) {
            // Katze bewegt sich
            petModel.position.x += (dx / distance) * 0.02;
            petModel.position.y += (dy / distance) * 0.02;

            // Drehung der Katze in Gehrichtung (Winkel berechnen)
            const angle = Math.atan2(dx, dy);
            petModel.rotation.y = angle;

            if (walkAction && currentAction !== walkAction) {
                fadeToAction(walkAction, 0.2);
            }
        } else {
            // Katze steht still
            if (idleAction && currentAction !== idleAction) {
                fadeToAction(idleAction, 0.2);
            }
        }

        // Aktualisiere die Position der HTML-Sprechblase, damit sie über dem 3D-Modell schwebt
        updateBubblePosition();
    }

    renderer.render(scene, camera);
}

// Übergang zwischen Animationen (z.B. von Gehen zu Stehen)
function fadeToAction(nextAction, duration) {
    if (currentAction === nextAction) return;
    const previousAction = currentAction;
    currentAction = nextAction;
    if (previousAction) previousAction.fadeOut(duration);
    currentAction.reset().fadeIn(duration).play();
}

// Klick auf die 3D-Katze erkennen
function onPetClick(event) {
    if (!petModel) return;

    // Normalisierte Mauskoordinaten berechnen
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(petModel.children, true);

    if (intersects.length > 0) {
        // GETROFFEN! Die Katze wurde angeklickt.
        showBubble();
    } else {
        // Wenn man irgendwo auf den Desktop klickt, läuft die Katze dorthin!
        // Wir rechnen den Klick in 3D-Koordinaten um:
        targetX = mouse.x * (camera.right);
        targetY = mouse.y * (camera.top) - 1.5; // Leicht versetzt, damit sie auf dem Boden steht
    }
}

function showBubble() {
    const texts = ["Miau! 🐾", "Ich kann mich in 3D drehen! 😎", "Kratz mich am Ohr!", "Zzz... 💤"];
    petBubble.textContent = texts[Math.floor(Math.random() * texts.length)];
    petBubble.style.opacity = '1';
    setTimeout(() => petBubble.style.opacity = '0', 3000);
}

// Sprechblase an 3D-Modell anheften
function updateBubblePosition() {
    if (!petModel) return;
    
    // 3D Position des Modells in 2D Screen-Pixel umrechnen
    const vector = new THREE.Vector3();
    petModel.getWorldPosition(vector);
    vector.project(camera);

    const x = (vector.x * .5 + .5) * window.innerWidth;
    const y = (vector.y * -.5 + .5) * window.innerHeight;

    petBubble.style.left = `${x}px`;
    petBubble.style.top = `${y - 80}px`; // Etwas über dem Kopf platziert
}

// Start der 3D Engine
window.onload = () => {
    init3D();
};

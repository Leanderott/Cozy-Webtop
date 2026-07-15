// ==========================================
// KAWAI ANIME CAT (Prozedurales 3D Modul)
// ==========================================

class KawaiiCat {
    constructor(scene) {
        this.group = new THREE.Group();
        this.scene = scene;
        
        // Animations-States
        this.isJumping = false;
        this.jumpTime = 0;
        this.targetY = -1.8; // Standard Boden-Höhe

        this.buildCat();
        this.scene.add(this.group);
    }

    buildCat() {
        // --- MATERIALIEN (Weich, Anime-Style) ---
        const matBody = new THREE.MeshToonMaterial({ color: 0xfdfbf7 }); // Creme-Weiß
        const matPink = new THREE.MeshToonMaterial({ color: 0xffa6a6 }); // Weiches Rosa
        const matDark = new THREE.MeshToonMaterial({ color: 0x2a2a35 }); // Dunkles Grau/Schwarz für Augen
        const matWhite = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Glanzlichter (Basic = leuchtet immer)

        // 1. KÖRPER (Klein & rundlich)
        const bodyGeo = new THREE.SphereGeometry(0.9, 32, 32);
        this.body = new THREE.Mesh(bodyGeo, matBody);
        this.body.scale.set(1.1, 0.85, 0.9);
        this.body.position.y = 0.5;
        this.group.add(this.body);

        // 2. KOPF (Extra groß für den Kawaii-Faktor)
        this.headGroup = new THREE.Group();
        this.headGroup.position.set(0.7, 1.2, 0);
        
        const headGeo = new THREE.SphereGeometry(1.1, 32, 32);
        const head = new THREE.Mesh(headGeo, matBody);
        this.headGroup.add(head);

        // 3. AUGEN (Riesig mit doppeltem Lichtreflex)
        const eyeGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const eyeL = new THREE.Mesh(eyeGeo, matDark);
        eyeL.position.set(0.95, 0.1, 0.4);
        eyeL.scale.set(0.4, 1.3, 1); // Vertikal gestreckt
        const eyeR = eyeL.clone();
        eyeR.position.z = -0.4;

        // Großer Lichtreflex (Oben)
        const glint1Geo = new THREE.SphereGeometry(0.04, 8, 8);
        const glintL1 = new THREE.Mesh(glint1Geo, matWhite);
        glintL1.position.set(1.0, 0.18, 0.43);
        const glintR1 = glintL1.clone();
        glintR1.position.z = -0.37;

        // Kleiner Lichtreflex (Unten)
        const glint2Geo = new THREE.SphereGeometry(0.02, 8, 8);
        const glintL2 = new THREE.Mesh(glint2Geo, matWhite);
        glintL2.position.set(1.02, 0.02, 0.38);
        const glintR2 = glintL2.clone();
        glintR2.position.z = -0.42;

        this.headGroup.add(eyeL, eyeR, glintL1, glintR1, glintL2, glintR2);

        // 4. WANGEN / BLUSH
        const blushGeo = new THREE.SphereGeometry(0.15, 16, 16);
        const blushL = new THREE.Mesh(blushGeo, matPink);
        blushL.position.set(0.9, -0.1, 0.6);
        blushL.scale.set(0.2, 0.5, 1);
        const blushR = blushL.clone();
        blushR.position.z = -0.6;
        this.headGroup.add(blushL, blushR);

        // 5. NASE
        const noseGeo = new THREE.SphereGeometry(0.06, 16, 16);
        const nose = new THREE.Mesh(noseGeo, matPink);
        nose.position.set(1.08, -0.05, 0);
        nose.scale.set(0.5, 0.8, 1);
        this.headGroup.add(nose);

        // 6. OHREN (Mit Zuck-Animation)
        this.earL = new THREE.Group();
        this.earL.position.set(0.2, 0.9, 0.5);
        this.earR = new THREE.Group();
        this.earR.position.set(0.2, 0.9, -0.5);

        const earGeo = new THREE.ConeGeometry(0.3, 0.6, 16);
        earGeo.translate(0, 0.3, 0); // Drehpunkt nach unten verschieben
        
        const earMeshL = new THREE.Mesh(earGeo, matBody);
        earMeshL.rotation.set(0.2, 0, -0.3);
        const earInnerL = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 16), matPink);
        earInnerL.position.set(0.05, 0.3, 0.05);
        earInnerL.rotation.set(0.2, 0.2, -0.3);
        
        this.earL.add(earMeshL, earInnerL);

        const earMeshR = new THREE.Mesh(earGeo, matBody);
        earMeshR.rotation.set(-0.2, 0, -0.3);
        const earInnerR = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 16), matPink);
        earInnerR.position.set(0.05, 0.3, -0.05);
        earInnerR.rotation.set(-0.2, -0.2, -0.3);

        this.earR.add(earMeshR, earInnerR);
        this.headGroup.add(this.earL, this.earR);

        // 7. SCHNURRHAARE (Whiskers - NEU!)
        const whiskerMat = new THREE.LineBasicMaterial({ color: 0x4a4a5a, transparent: true, opacity: 0.5 });
        const createWhisker = (x, y, z, rotY, rotZ) => {
            const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.4, 0, 0)];
            const geo = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geo, whiskerMat);
            line.position.set(x, y, z);
            line.rotation.set(0, rotY, rotZ);
            return line;
        };
        
        // Linke Seite
        this.headGroup.add(createWhisker(0.9, -0.05, 0.6, 0.2, -0.1));
        this.headGroup.add(createWhisker(0.9, -0.15, 0.6, 0.2, 0.1));
        // Rechte Seite
        this.headGroup.add(createWhisker(0.9, -0.05, -0.6, -0.2, -0.1));
        this.headGroup.add(createWhisker(0.9, -0.15, -0.6, -0.2, 0.1));

        this.group.add(this.headGroup);

        // 8. BEINE (Vorne Links, Vorne Rechts, Hinten Links, Hinten Rechts)
        const legGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.6, 16);
        legGeo.translate(0, -0.3, 0); // Drehpunkt nach oben ans Gelenk

        this.legFL = new THREE.Mesh(legGeo, matBody); this.legFL.position.set(0.5, 0.4, 0.4);
        this.legFR = new THREE.Mesh(legGeo, matBody); this.legFR.position.set(0.5, 0.4, -0.4);
        this.legBL = new THREE.Mesh(legGeo, matBody); this.legBL.position.set(-0.5, 0.4, 0.4);
        this.legBR = new THREE.Mesh(legGeo, matBody); this.legBR.position.set(-0.5, 0.4, -0.4);

        this.group.add(this.legFL, this.legFR, this.legBL, this.legBR);

        // 9. SCHWANZ (Flauschig)
        const tailGeo = new THREE.CylinderGeometry(0.15, 0.1, 1.2, 16);
        tailGeo.translate(0, 0.6, 0); // Drehpunkt an die Basis
        this.tail = new THREE.Mesh(tailGeo, matBody);
        this.tail.position.set(-0.9, 0.6, 0);
        this.tail.rotation.z = -0.8;
        this.group.add(this.tail);

        // Initiale Position der gesamten Gruppe
        this.group.scale.set(1.2, 1.2, 1.2);
        this.group.position.set(0, this.targetY, 0);
    }

    triggerJump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.jumpTime = 0;
        }
    }

    update(time, targetX) {
        // Distanzberechnung (Nur noch X-Achse für flüssiges Laufen links/rechts)
        const dx = targetX - this.group.position.x;
        const distance = Math.abs(dx);

        if (distance > 0.1) {
            // --- WALKING ANIMATION ---
            const speed = 0.04;
            this.group.position.x += Math.sign(dx) * speed;

            // Drehung sanft anpassen (Schaut nach links oder rechts)
            const targetRotation = dx > 0 ? 0 : Math.PI;
            // Kürzesten Weg für die Drehung finden
            let rotDiff = targetRotation - this.group.rotation.y;
            while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
            while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
            this.group.rotation.y += rotDiff * 0.15;

            // Beine schwingen (Sinuskurve)
            const walkCycle = time * 15;
            this.legFL.rotation.z = Math.sin(walkCycle) * 0.5;
            this.legBR.rotation.z = Math.sin(walkCycle) * 0.5;
            this.legFR.rotation.z = Math.sin(walkCycle + Math.PI) * 0.5;
            this.legBL.rotation.z = Math.sin(walkCycle + Math.PI) * 0.5;

            // Körper wippt auf und ab
            this.group.position.y = this.targetY + Math.abs(Math.sin(walkCycle * 2)) * 0.1;
            
            // Kopf wippt leicht mit
            this.headGroup.rotation.z = Math.sin(walkCycle) * 0.05;

            // Schwanz wedelt aktiv
            this.tail.rotation.x = Math.sin(time * 20) * 0.3;
            
        } else {
            // --- IDLE ANIMATION ---
            this.legFL.rotation.z = 0;
            this.legFR.rotation.z = 0;
            this.legBL.rotation.z = 0;
            this.legBR.rotation.z = 0;

            // Sanftes Atmen
            this.body.scale.y = 0.85 + Math.sin(time * 3) * 0.02;
            this.headGroup.position.y = 1.2 + Math.sin(time * 3) * 0.02;
            
            // Kopf schaut sich manchmal minimal um
            this.headGroup.rotation.y = Math.sin(time * 1.5) * 0.1;

            // Gemütliches Schwanzwedeln
            this.tail.rotation.x = Math.sin(time * 3) * 0.15;

            // ZUFÄLLIGES OHREN-ZUCKEN (Premium Detail!)
            if (Math.random() > 0.99) {
                this.earL.rotation.z = -0.3;
                setTimeout(() => this.earL.rotation.z = 0, 100);
            }
            if (Math.random() > 0.995) {
                this.earR.rotation.z = 0.3;
                setTimeout(() => this.earR.rotation.z = 0, 100);
            }
        }

        // --- SPRUNG / SALTO ANIMATION ---
        if (this.isJumping) {
            this.jumpTime += 0.06;
            // Perfekte Parabel für den Sprung
            const jumpHeight = Math.sin(this.jumpTime) * 2.5; 
            
            if (this.jumpTime < Math.PI) {
                this.group.position.y = this.targetY + jumpHeight;
                // Eleganter Rückwärtssalto (passend zur Anime-Ästhetik)
                this.group.rotation.z = -this.jumpTime * 2; 
            } else {
                // Landung
                this.isJumping = false;
                this.group.position.y = this.targetY;
                this.group.rotation.z = 0;
                
                // Kleines "Einfedern" bei der Landung
                this.body.scale.y = 0.6;
                setTimeout(() => this.body.scale.y = 0.85, 150);
            }
        }
    }
}

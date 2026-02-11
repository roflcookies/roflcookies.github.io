/**
 * Persistent Multi-Ship 3D Sprite Simulation
 * Features: Hero/Target AI, Frustum Boundaries, LocalStorage Persistence, and Layered Z-Indexing.
 */

class ShipBackground {
    constructor() {
        this.STORAGE_KEY = 'multi_ship_system_state';
        this.TILE = 840;
        this.FOCAL_LENGTH = 1000;
        this.urls = [
            'https://juicebox.defl.space/default/items/2thoiKGhX_kqHNcWjXGecw', // Hero
            'https://juicebox.defl.space/default/items/fLChcY7FCZAWnhXvPV802g',
            'https://juicebox.defl.space/default/items/blXMgdiSNDr_D8FiZMB4bA',
            'https://juicebox.defl.space/default/items/2xOsGplp87Q8thpzHl92RQ'
        ];

        this.ships = [];
        this.currentTarget = null;

        // Load or default state
        const savedData = this.loadState();
        this.initShips(savedData);
        this.startSystems();
    }

    loadState() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) { return null; }
    }

    saveState() {
        const state = this.ships.map(s => ({
            x: s.x, y: s.y, z: s.z,
            vx: s.vx, vy: s.vy, vz: s.vz,
            phi: s.phi, theta: s.theta
        }));
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    }

    initShips(savedData) {
        this.urls.forEach((url, index) => {
            const container = document.createElement('div');
            container.className = 'ship-container-instance';
            
            const windowDiv = document.createElement('div');
            const sheet = document.createElement('div');

            // Shared CSS logic
            Object.assign(container.style, {
                position: 'fixed', 
                top: '0', 
                left: '0',
                width: `${this.TILE}px`, 
                height: `${this.TILE}px`,
                pointerEvents: 'none', 
                willChange: 'transform',
                transformStyle: 'preserve-3d'
                // zIndex is managed dynamically in animate()
            });

            Object.assign(windowDiv.style, {
                width: `${this.TILE}px`, 
                height: `${this.TILE}px`,
                overflow: 'hidden', 
                position: 'relative', 
                clipPath: 'inset(64px)'
            });

            Object.assign(sheet.style, {
                position: 'absolute', 
                width: '5880px', 
                height: '5880px',
                backgroundImage: `url('${url}')`, 
                backgroundSize: '5880px 5880px',
                backgroundRepeat: 'no-repeat', 
                imageRendering: 'pixelated',
                transform: 'translateZ(0)'
            });

            windowDiv.appendChild(sheet);
            container.appendChild(windowDiv);
            document.body.appendChild(container);

            // Ship Data Object
            const s = savedData && savedData[index] ? savedData[index] : {
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400,
                z: -2000 - (Math.random() * 2000),
                vx: 0, vy: 0, vz: 0,
                phi: 0, theta: 1.57
            };

            // Sanitize if window resized or data corrupt
            if (isNaN(s.x)) s.x = 0;
            if (s.z > 0) s.z = -1000;

            this.ships.push({
                ...s,
                container, windowDiv, sheet,
                isHero: index === 0,
                tx: 0, ty: 0, tz: -5000
            });
        });
    }

    startSystems() {
        this.updateAI();
        this.animate();
        window.addEventListener('beforeunload', () => this.saveState());
    }

    updateAI() {
        const hw = window.innerWidth / 2;
        const hh = window.innerHeight / 2;
        const hero = this.ships[0];

        // Target Acquisition
        let closest = null, minDist = Infinity;
        for (let i = 1; i < this.ships.length; i++) {
            let d = Math.sqrt((hero.x - this.ships[i].x)**2 + (hero.y - this.ships[i].y)**2 + (hero.z - this.ships[i].z)**2);
            if (d < minDist) { minDist = d; closest = this.ships[i]; }
        }
        this.currentTarget = closest;

        this.ships.forEach((s) => {
            let vRatio = (this.FOCAL_LENGTH + Math.abs(s.z)) / this.FOCAL_LENGTH;
            let boundsX = hw * vRatio;
            let boundsY = hh * vRatio;

            if (s.isHero) {
                if (this.currentTarget) {
                    s.tx = this.currentTarget.x - s.x;
                    s.ty = this.currentTarget.y - s.y;
                    s.tz = this.currentTarget.z - s.z;
                }
            } else if (s === this.currentTarget) {
                // Evasive
                let dx = s.x - hero.x, dy = s.y - hero.y, dz = s.z - hero.z;
                let nearWall = Math.abs(s.x) > boundsX * 0.85 || Math.abs(s.y) > boundsY * 0.85;

                if (nearWall) {
                    s.tx = (s.y > hero.y) ? 1000 : -1000;
                    s.ty = (s.x > hero.x) ? -1000 : 1000;
                    s.tz = (s.z > -5000) ? -2000 : 2000;
                } else {
                    s.tx = dx + (dx > 0 ? 800 : -800);
                    s.ty = dy * 0.5;
                    s.tz = dz + (dz > 0 ? 500 : -1500);
                }
            } else {
                // Wanderers
                let distToWp = Math.sqrt((s.x-s.tx)**2 + (s.y-s.ty)**2 + (s.z-s.tz)**2);
                if (distToWp < 400 || Math.random() > 0.98) {
                    let newZ = s.z < -6000 ? -(500 + Math.random() * 2000) : -(8000 + Math.random() * 6000);
                    let vr = (this.FOCAL_LENGTH + Math.abs(newZ)) / this.FOCAL_LENGTH;
                    s.tx = (s.x > 0 ? -1 : 1) * (hw * vr * 0.7);
                    s.ty = (Math.random() - 0.5) * (hh * vr * 0.7);
                    s.tz = newZ;
                }
            }

            let mag = Math.sqrt(s.tx**2 + s.ty**2 + s.tz**2);
            if (mag > 0) {
                let speed = s.isHero ? 2.0 : (s === this.currentTarget ? 3.6 : 1.2);
                s.tx = (s.tx/mag) * speed; s.ty = (s.ty/mag) * speed; s.tz = (s.tz/mag) * speed;
            }
        });
        setTimeout(() => this.updateAI(), 400);
    }

    animate() {
        const hw = window.innerWidth / 2;
        const hh = window.innerHeight / 2;

        // Sort ships by depth (z value) once per frame to manage overlap
        const sortedShips = [...this.ships].sort((a, b) => b.z - a.z);

        this.ships.forEach(s => {
            let accel = (s === this.currentTarget) ? 0.02 : 0.01;
            s.vx += (s.tx - s.vx) * accel;
            s.vy += (s.ty - s.vy) * accel;
            s.vz += (s.tz - s.vz) * accel;
            s.x += s.vx; s.y += s.vy; s.z += s.vz;

            let viewRatio = (this.FOCAL_LENGTH + Math.abs(s.z)) / this.FOCAL_LENGTH;
            let bX = hw * viewRatio, bY = hh * viewRatio;

            // Boundary snapping
            if (s.x < -bX) { s.x = -bX; s.vx = 0; s.tx = Math.abs(s.tx); }
            if (s.x >  bX) { s.x = bX;  s.vx = 0; s.tx = -Math.abs(s.tx); }
            if (s.y < -bY) { s.y = -bY; s.vy = 0; s.ty = Math.abs(s.ty); }
            if (s.y >  bY) { s.y = bY;  s.vy = 0; s.ty = -Math.abs(s.ty); }
            if (s.z < -15000) { s.z = -15000; s.vz = 0; s.tz = Math.abs(s.tz); }
            if (s.z > 0) { s.z = 0; s.vz = 0; s.tz = -Math.abs(s.tz); }

            // Sprite Logic
            let targetPhi = Math.atan2(s.vx, s.vz);
            if (targetPhi < 0) targetPhi += 2 * Math.PI;
            let targetTheta = Math.acos(s.vy / Math.sqrt(s.vx**2 + s.vy**2 + s.vz**2)) + (Math.sin(Date.now() * 0.0002) * 0.3);

            let diff = targetPhi - s.phi;
            if (diff > Math.PI) s.phi += 2 * Math.PI;
            if (diff < -Math.PI) s.phi -= 2 * Math.PI;
            s.phi += (targetPhi - s.phi) * accel;
            s.theta += (targetTheta - s.theta) * accel;
            s.theta = Math.max(0.4, Math.min(Math.PI - 0.4, s.theta));

            let phiLogic = s.phi % (Math.PI * 2);
            if (phiLogic < 0) phiLogic += Math.PI * 2;
            let i = Math.round((s.theta / Math.PI) * 6);
            let j = 0, isMirrored = false;
            if (phiLogic <= Math.PI) { j = Math.round((phiLogic / Math.PI) * 6); }
            else { j = Math.round(((2 * Math.PI - phiLogic) / Math.PI) * 6); isMirrored = true; }

            s.sheet.style.left = `${Math.round(-j * this.TILE)}px`;
            s.sheet.style.top = `${Math.round(-i * this.TILE)}px`;

            let banking = (targetPhi - s.phi) * 45;
            let roll = (i !== 3) ? ((i < 3) ? -(j/6)*180 : (j/6)*180) : 0;
            s.windowDiv.style.transform = `scaleX(${isMirrored ? -1 : 1}) rotate(${roll + banking}deg)`;
            
            let scale = this.FOCAL_LENGTH / (this.FOCAL_LENGTH + Math.abs(s.z));
            s.container.style.transform = `translate3d(${(hw + s.x * scale) - this.TILE/2}px, ${(hh + s.y * scale) - this.TILE/2}px, 0) scale(${scale})`;
            
            // Assign Z-Index based on depth rank (-1 is closest, -4 is furthest)
            const depthRank = sortedShips.indexOf(s);
            s.container.style.zIndex = -(depthRank + 1);
        });
        requestAnimationFrame(() => this.animate());
    }
}

window.initializeShipBackground = () => {
    if (document.querySelector('.ship-container-instance')) return;
    new ShipBackground();
};
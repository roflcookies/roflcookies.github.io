/**
 * Persistent Multi-Ship 3D Sprite Simulation
 * v4.7 - Persistent AI State Fix
 */

class ShipBackground {
    constructor() {
        this.STORAGE_KEY = 'multi_ship_system_state_v4.7';
        this.TILE = 840;
        this.FOCAL_LENGTH = 1000;
        this.urls = [
            'https://juicebox.defl.space/default/items/2thoiKGhX_kqHNcWjXGecw',
            'https://juicebox.defl.space/default/items/fLChcY7FCZAWnhXvPV802g',
            'https://juicebox.defl.space/default/items/blXMgdiSNDr_D8FiZMB4bA',
            'https://juicebox.defl.space/default/items/2xOsGplp87Q8thpzHl92RQ'
        ];

        this.ships = [];
        this.currentTarget = null;

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
        const hw = window.innerWidth / 2;
        const hh = window.innerHeight / 2;

        this.urls.forEach((url, index) => {
            const container = document.createElement('div');
            container.className = 'ship-container-instance';
            const windowDiv = document.createElement('div');
            const sheet = document.createElement('div');

            Object.assign(container.style, {
                position: 'fixed', top: '0', left: '0',
                width: `${this.TILE}px`, height: `${this.TILE}px`,
                pointerEvents: 'none', willChange: 'transform',
                transformStyle: 'preserve-3d'
            });

            Object.assign(windowDiv.style, {
                width: `${this.TILE}px`, height: `${this.TILE}px`,
                overflow: 'hidden', position: 'relative', clipPath: 'inset(64px)'
            });

            Object.assign(sheet.style, {
                position: 'absolute', width: '5880px', height: '5880px',
                backgroundImage: `url('${url}')`, backgroundSize: '5880px 5880px',
                backgroundRepeat: 'no-repeat', imageRendering: 'pixelated',
                transform: 'translateZ(0)'
            });

            windowDiv.appendChild(sheet);
            container.appendChild(windowDiv);
            document.body.appendChild(container);

            let sData = (savedData && savedData[index]) ? savedData[index] : {
                x: (Math.random() - 0.5) * 2000,
                y: (Math.random() - 0.5) * 1500,
                z: -(2000 + Math.random() * 4000),
                vx: 0, vy: 0, vz: 0,
                phi: Math.random() * 6, theta: 1.57
            };

            this.ships.push({
                ...sData,
                container, windowDiv, sheet,
                isHero: index === 0,
                tx: 0, ty: 0, tz: sData.z,
                aiPhase: 'WANDER'
            });
        });
    }

    startSystems() {
        this.updateAI();
        this.animate();
        window.addEventListener('beforeunload', () => this.saveState());
    }

    updateAI() {
        const hw = window.innerWidth / 2, hh = window.innerHeight / 2;
        const hero = this.ships[0];

        // 1. Target acquisition - ONLY trigger logic if the target is actually NEW
        let closest = null, minDist = Infinity;
        for (let i = 1; i < this.ships.length; i++) {
            let d = Math.sqrt((hero.x - this.ships[i].x)**2 + (hero.y - this.ships[i].y)**2 + (hero.z - this.ships[i].z)**2);
            if (d < minDist) { minDist = d; closest = this.ships[i]; }
        }
        
        if (closest && closest !== this.currentTarget) {
            // Revert old target to wander
            if (this.currentTarget) {
                this.currentTarget.aiPhase = 'WANDER';
            }
            // Initialize NEW target escape mission
            this.currentTarget = closest;
            this.currentTarget.aiPhase = 'RESET';
        }

        this.ships.forEach((s) => {
            let vR = (this.FOCAL_LENGTH + Math.abs(s.z)) / this.FOCAL_LENGTH;
            let bX = hw * vR, bY = hh * vR;

            if (s.isHero) {
                if (this.currentTarget) {
                    let dx = this.currentTarget.x - s.x, dy = this.currentTarget.y - s.y, dz = this.currentTarget.z - s.z;
                    let d = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
                    s.tx = (dx/d) * 3.0; s.ty = (dy/d) * 3.0; s.tz = (dz/d) * 3.0;
                }
            } else if (s === this.currentTarget) {
                // Persistent Phase Logic (Doesn't reset every 400ms anymore)
                if (s.aiPhase === 'RESET') {
                    let destX = (hero.x > 0) ? -bX * 0.9 : bX * 0.9;
                    let destY = (hero.y > 0) ? -bY * 0.9 : bY * 0.9;
                    let dx = destX - s.x, dy = destY - s.y;
                    let d = Math.sqrt(dx*dx + dy*dy) || 1;
                    
                    s.tx = (dx/d) * 8.5; s.ty = (dy/d) * 8.5; s.tz = (Math.random()-0.5) * 5;
                    
                    if (d < 400) { 
                        s.aiPhase = 'PASS';
                    }
                } else if (s.aiPhase === 'PASS') {
                    const peers = this.ships.filter(p => !p.isHero && p !== s);
                    const peer = peers[Math.floor(Math.random() * peers.length)];
                    let dx = peer.x - s.x, dy = peer.y - s.y, dz = peer.z - s.z;
                    let d = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
                    
                    s.tx = (dx/d) * 8.5; s.ty = (dy/d) * 8.5; s.tz = (dz/d) * 8.5;
                    // If target passes peer, go back to reset to keep the loop going if still targeted
                    if (d < 250) s.aiPhase = 'RESET'; 
                }
            } else {
                // WANDERERS
                if (Math.abs(s.x) > bX * 0.8 || Math.abs(s.y) > bY * 0.8 || Math.abs(s.vx) < 0.2) {
                    let destX = (s.x > 0) ? -bX * 0.7 : bX * 0.7;
                    let destY = (Math.random()-0.5) * bY * 1.5;
                    let dx = destX - s.x, dy = destY - s.y;
                    let d = Math.sqrt(dx*dx + dy*dy) || 1;
                    s.tx = (dx/d) * 2.2; s.ty = (dy/d) * 2.2; s.tz = (Math.random()-0.5) * 2;
                }
            }
        });
        setTimeout(() => this.updateAI(), 400);
    }

    animate() {
        const hw = window.innerWidth / 2, hh = window.innerHeight / 2;
        const sortedShips = [...this.ships].sort((a, b) => b.z - a.z);

        this.ships.forEach(s => {
            let accel = (s.isHero) ? 0.02 : 0.05;
            s.vx += (s.tx - s.vx) * accel; s.vy += (s.ty - s.vy) * accel; s.vz += (s.tz - s.vz) * accel;
            s.x += s.vx; s.y += s.vy; s.z += s.vz;

            let vR = (this.FOCAL_LENGTH + Math.abs(s.z)) / this.FOCAL_LENGTH;
            let bX = hw * vR, bY = hh * vR;

            if (s.x < -bX) s.x = -bX; if (s.x > bX) s.x = bX;
            if (s.y < -bY) s.y = -bY; if (s.y > bY) s.y = bY;
            if (s.z < -12000) s.z = -12000; if (s.z > -500) s.z = -500;

            let speed = Math.sqrt(s.vx**2 + s.vy**2 + s.vz**2) || 1;
            let targetPhi = Math.atan2(s.vx, s.vz);
            if (targetPhi < 0) targetPhi += 2 * Math.PI;
            let targetTheta = Math.acos(s.vy / speed);

            let diff = targetPhi - s.phi;
            if (diff > Math.PI) s.phi += 2 * Math.PI;
            if (diff < -Math.PI) s.phi -= 2 * Math.PI;
            s.phi += (targetPhi - s.phi) * 0.08;
            s.theta += (targetTheta - s.theta) * 0.08;

            let pL = s.phi % (Math.PI * 2); if (pL < 0) pL += Math.PI * 2;
            let i = Math.round((s.theta / Math.PI) * 6);
            let j = (pL <= Math.PI) ? Math.round((pL / Math.PI) * 6) : Math.round(((2 * Math.PI - pL) / Math.PI) * 6);
            
            s.sheet.style.left = `${Math.round(-j * this.TILE)}px`;
            s.sheet.style.top = `${Math.round(-i * this.TILE)}px`;

            let bank = (targetPhi - s.phi) * 40;
            let roll = (i !== 3) ? ((i < 3) ? -(j/6)*180 : (j/6)*180) : 0;
            s.windowDiv.style.transform = `scaleX(${pL > Math.PI ? -1 : 1}) rotate(${roll + bank}deg)`;
            
            let scale = this.FOCAL_LENGTH / (this.FOCAL_LENGTH + Math.abs(s.z));
            s.container.style.transform = `translate3d(${(hw + s.x * scale) - this.TILE/2}px, ${(hh + s.y * scale) - this.TILE/2}px, 0) scale(${scale})`;
            s.container.style.zIndex = -(sortedShips.indexOf(s) + 1);
        });
        requestAnimationFrame(() => this.animate());
    }
}

window.initializeShipBackground = () => {
    if (document.querySelector('.ship-container-instance')) return;
    new ShipBackground();
};
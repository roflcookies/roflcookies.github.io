/**
 * Persistent Sprite-Based 3D Ship Simulation
 */

class ShipBackground {
    constructor() {
        this.STORAGE_KEY = 'ship_system_state';
        this.TILE = 840;
        this.sheetSize = 5880;

        // 1. Load persisted state or set defaults
        const savedState = this.loadState();

        this.x = savedState ? savedState.x : window.innerWidth / 2;
        this.y = savedState ? savedState.y : window.innerHeight / 2;
        this.z = savedState ? savedState.z : 600;
        this.vx = savedState ? savedState.vx : 1;
        this.vy = savedState ? savedState.vy : 0;
        this.vz = savedState ? savedState.vz : 1;
        this.currentPhi = savedState ? savedState.currentPhi : 0;
        this.currentTheta = savedState ? savedState.currentTheta : 1.57;

        // 2. Sanitize coordinates (Fixes "stuck" or off-screen issues)
        this.sanitizePosition();

        this.tx = 1; this.ty = 0; this.tz = 1;
        this.maxSpeed = 1.0;
        this.accel = 0.005;
        this.turnAgility = 0.005;

        this.init();
    }

    loadState() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    saveState() {
        const state = {
            x: this.x, y: this.y, z: this.z,
            vx: this.vx, vy: this.vy, vz: this.vz,
            currentPhi: this.currentPhi,
            currentTheta: this.currentTheta
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    }

    sanitizePosition() {
        // Ensure ship is within current window bounds + buffer
        const margin = 100;
        if (this.x < -margin || this.x > window.innerWidth + margin) {
            this.x = window.innerWidth / 2;
        }
        if (this.y < -margin || this.y > window.innerHeight + margin) {
            this.y = window.innerHeight / 2;
        }
        // Ensure Z is within rendering range
        if (this.z < 200 || this.z > 1200) {
            this.z = 600;
        }
    }

    init() {
        this.container = document.createElement('div');
        this.container.id = 'ship-container'; // ID check for the initializer
        this.windowDiv = document.createElement('div');
        this.sheet = document.createElement('div');

        Object.assign(this.container.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: `${this.TILE}px`,
            height: `${this.TILE}px`,
            pointerEvents: 'none',
            zIndex: '0',
            willChange: 'transform',
            transformStyle: 'preserve-3d'
        });

        Object.assign(this.windowDiv.style, {
            width: `${this.TILE}px`,
            height: `${this.TILE}px`,
            overflow: 'hidden',
            position: 'relative',
            clipPath: 'inset(0)'
        });

        Object.assign(this.sheet.style, {
            position: 'absolute',
            width: `${this.sheetSize}px`,
            height: `${this.sheetSize}px`,
            backgroundImage: "url('https://juicebox.defl.space/default/items/2thoiKGhX_kqHNcWjXGecw')",
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated',
            transform: 'translateZ(0)'
        });

        this.windowDiv.appendChild(this.sheet);
        this.container.appendChild(this.windowDiv);
        document.body.appendChild(this.container);

        this.updateTarget();
        this.animate();
        
        // Save state before the user leaves the page
        window.addEventListener('beforeunload', () => this.saveState());

        window.addEventListener('resize', () => {
            if (this.x > window.innerWidth) this.x = window.innerWidth - 50;
            if (this.y > window.innerHeight) this.y = window.innerHeight - 50;
        });
    }

    updateTarget() {
        this.tx = (Math.random() - 0.5) * 2;
        this.ty = (Math.random() - 0.5) * 0.4;
        this.tz = (Math.random() - 0.5) * 2;
        let s = Math.sqrt(this.tx * this.tx + this.ty * this.ty + this.tz * this.tz);
        this.tx = (this.tx / s) * this.maxSpeed;
        this.ty = (this.ty / s) * this.maxSpeed;
        this.tz = (this.tz / s) * this.maxSpeed;
        
        setTimeout(() => this.updateTarget(), 5000 + Math.random() * 5000);
    }

    animate() {
        this.vx += (this.tx - this.vx) * this.accel;
        this.vy += (this.ty - this.vy) * this.accel;
        this.vz += (this.tz - this.vz) * this.accel;
        this.x += this.vx; this.y += this.vy; this.z += this.vz;

        // Boundary redirection
        if (this.x < 0) this.tx = Math.abs(this.tx);
        if (this.x > window.innerWidth) this.tx = -Math.abs(this.tx);
        if (this.y < 0) this.ty = Math.abs(this.ty);
        if (this.y > window.innerHeight) this.ty = -Math.abs(this.ty);
        if (this.z < 300) this.tz = Math.abs(this.tz);
        if (this.z > 1100) this.tz = -Math.abs(this.tz);

        let targetPhi = Math.atan2(this.vx, this.vz);
        if (targetPhi < 0) targetPhi += 2 * Math.PI;
        let targetTheta = Math.acos(this.vy / Math.sqrt(this.vx * this.vx + this.vy * this.vy + this.vz * this.vz)) + (Math.sin(Date.now() * 0.0002) * 0.3);

        let diff = targetPhi - this.currentPhi;
        if (diff > Math.PI) this.currentPhi += 2 * Math.PI;
        if (diff < -Math.PI) this.currentPhi -= 2 * Math.PI;

        this.currentPhi += (targetPhi - this.currentPhi) * this.turnAgility;
        this.currentTheta += (targetTheta - this.currentTheta) * this.turnAgility;
        this.currentTheta = Math.max(0.4, Math.min(Math.PI - 0.4, this.currentTheta));

        // Sprite Tile Logic
        let phiLogic = this.currentPhi % (Math.PI * 2);
        if (phiLogic < 0) phiLogic += Math.PI * 2;

        let i = Math.round((this.currentTheta / Math.PI) * 6);
        let j = 0;
        let isMirrored = false;

        if (phiLogic <= Math.PI) {
            j = Math.round((phiLogic / Math.PI) * 6);
            isMirrored = false;
        } else {
            j = Math.round(((2 * Math.PI - phiLogic) / Math.PI) * 6);
            isMirrored = true;
        }

        this.sheet.style.left = `${Math.round(-j * this.TILE)}px`;
        this.sheet.style.top = `${Math.round(-i * this.TILE)}px`;

        let roll = 0;
        if (i !== 3) {
            let sheetAngle = (j / 6) * 180;
            roll = (i < 3) ? -sheetAngle : sheetAngle;
        }

        let banking = (targetPhi - this.currentPhi) * 45;
        let mirror = isMirrored ? -1 : 1;

        this.windowDiv.style.transform = `scaleX(${mirror}) rotate(${roll + banking}deg)`;

        let scale = this.z / 1100;
        this.container.style.transform = `translate3d(${this.x - this.TILE / 2}px, ${this.y - this.TILE / 2}px, 0) scale(${scale})`;

        requestAnimationFrame(() => this.animate());
    }
}

window.initializeShipBackground = () => {
    if (document.getElementById('ship-container')) return;
    new ShipBackground();
};
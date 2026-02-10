class StarshipBackground extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.TILE = 840;
        this.SPRITE_URL = 'https://juicebox.defl.space/default/items/2thoiKGhX_kqHNcWjXGecw';
        this.STORAGE_KEY = 'starship_state';
        
        const savedState = localStorage.getItem(this.STORAGE_KEY);
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                this.state = parsed.state;
                this.target = parsed.target;
            } catch (e) { this.resetToDefault(); }
        } else {
            this.resetToDefault();
        }

        this.watchdog = 0;
        this.lastTime = performance.now();
    }

    resetToDefault() {
        this.state = { x: window.innerWidth / 4, y: window.innerHeight / 2, z: -500, yaw: 0, pitch: 0 };
        this.pickTarget();
    }

    connectedCallback() {
        this.render();
        this.ship = this.shadowRoot.getElementById('ship-container');
        this.sprite = this.shadowRoot.getElementById('sprite');
        requestAnimationFrame((t) => this.update(t));
        
        window.addEventListener('resize', () => this.pickTarget());
        window.addEventListener('beforeunload', () => this.saveCurrentState());
    }

    saveCurrentState() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ state: this.state, target: this.target }));
    }

    pickTarget() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        // BIAS: 80% chance to target the visible side areas
        const sideBias = Math.random() < 0.8;
        let tx;
        
        if (sideBias) {
            // Target the left 30% or right 30% of the screen
            tx = Math.random() < 0.5 ? Math.random() * (w * 0.3) : w - (Math.random() * (w * 0.3));
        } else {
            // 20% chance to fly right through the middle
            tx = Math.random() * w;
        }

        this.target = {
            x: tx,
            y: Math.random() * h,
            // Vary depth: -300 is close/large, -2000 is far/small
            z: -300 - (Math.random() * 1700)
        };
        this.watchdog = 0;
    }

    update(currentTime) {
        const dt = (currentTime - this.lastTime) / 16.66;
        this.lastTime = currentTime;

        const dx = this.target.x - this.state.x;
        const dy = this.target.y - this.state.y;
        const dz = this.target.z - this.state.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

        this.watchdog += dt;
        // If it takes longer than 7 seconds or reaches target, pick new one
        if (dist < 120 || this.watchdog > 420) {
            this.pickTarget();
        }

        let tYaw = Math.atan2(dx, dz) * (180 / Math.PI);
        let tPitch = Math.asin(-dy / dist) * (180 / Math.PI);
        tPitch = Math.max(-40, Math.min(40, tPitch));

        let diff = ((tYaw - this.state.yaw + 180) % 360 + 360) % 360 - 180;
        this.state.yaw += diff * 0.06 * dt; // Slightly faster turning
        this.state.pitch += (tPitch - this.state.pitch) * 0.06 * dt;

        const speed = 6.0 * dt; // Increased speed for better visibility
        const rY = this.state.yaw * (Math.PI / 180);
        const rP = this.state.pitch * (Math.PI / 180);
        
        this.state.x += Math.sin(rY) * Math.cos(rP) * speed;
        this.state.y -= Math.sin(rP) * speed;
        this.state.z += Math.cos(rY) * Math.cos(rP) * speed;

        let row = Math.round((this.state.pitch + 90) / 30);
        row = Math.max(0, Math.min(6, row));
        let normY = (this.state.yaw % 360 + 360) % 360;
        let col, mirror = false;
        if (normY <= 180) { col = Math.round(normY / 30); } 
        else { col = Math.round((360 - normY) / 30); mirror = true; }
        if (row === 0 || row === 6) col = 0;

        this.sprite.style.backgroundPosition = `-${col * this.TILE}px -${row * this.TILE}px`;
        this.sprite.style.transform = mirror ? 'scaleX(-1)' : 'scaleX(1)';

        let scale = 800 / (800 + Math.abs(this.state.z));
        this.ship.style.left = this.state.x + 'px';
        this.ship.style.top = this.state.y + 'px';
        this.ship.style.transform = `translate(-50%, -50%) scale(${scale})`;
        
        requestAnimationFrame((t) => this.update(t));
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
            :host {
                position: fixed;
                top: 0; left: 0;
                width: 100vw; height: 100vh;
                overflow: hidden;
                pointer-events: none;
                z-index: 1;
            }
            #ship-container {
                position: absolute;
                width: ${this.TILE}px; height: ${this.TILE}px;
                transform-origin: center center;
                will-change: left, top, transform;
            }
            #sprite {
                width: ${this.TILE}px; height: ${this.TILE}px;
                background-image: url('${this.SPRITE_URL}');
                background-repeat: no-repeat;
                background-size: ${this.TILE * 7}px ${this.TILE * 7}px;
                image-rendering: pixelated;
            }
        </style>
        <div id="ship-container"><div id="sprite"></div></div>
        `;
    }
}
customElements.define('starship-background', StarshipBackground);
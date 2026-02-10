class StarshipBackground extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.TILE = 840;
        this.SPRITE_URL = 'https://juicebox.defl.space/default/items/2thoiKGhX_kqHNcWjXGecw';
        this.STORAGE_KEY = 'starship_state';
        
        // Load persistence
        const savedState = localStorage.getItem(this.STORAGE_KEY);
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                this.state = parsed.state;
                this.target = parsed.target;
            } catch (e) { 
                this.resetToDefault(); 
            }
        } else {
            this.resetToDefault();
        }

        this.watchdog = 0;
        this.lastTime = performance.now();
    }

    resetToDefault() {
        this.state = { x: -200, y: 300, z: -500, yaw: 90, pitch: 0 };
        this.pickTarget();
    }

    connectedCallback() {
        this.render();
        this.ship = this.shadowRoot.getElementById('ship-container');
        this.sprite = this.shadowRoot.getElementById('sprite');
        
        // Save state before the tab closes
        window.addEventListener('beforeunload', () => {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ 
                state: this.state, 
                target: this.target 
            }));
        });

        requestAnimationFrame((t) => this.update(t));
    }

    pickTarget() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        let tx;
        if (this.state.x < w / 2) {
            tx = w - (Math.random() * (w * 0.4));
        } else {
            tx = Math.random() * (w * 0.4);
        }

        this.target = {
            x: tx,
            y: Math.random() * h,
            z: -300 - (Math.random() * 900)
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
        if (this.watchdog > 420) {
            this.resetToVisibleArea();
            return requestAnimationFrame((t) => this.update(t));
        }

        if (dist < 120) {
            this.pickTarget();
        }

        // --- PERSISTENT PHYSICS ---
        let tYaw = Math.atan2(dx, dz) * (180 / Math.PI);
        let tPitch = Math.asin(-dy / dist) * (180 / Math.PI);
        
        let diff = ((tYaw - this.state.yaw + 180) % 360 + 360) % 360 - 180;
        this.state.yaw += diff * 0.06 * dt;
        this.state.pitch += (tPitch - this.state.pitch) * 0.06 * dt;

        const speed = 6.0 * dt;
        const rY = this.state.yaw * (Math.PI / 180);
        const rP = this.state.pitch * (Math.PI / 180);
        
        this.state.x += Math.sin(rY) * Math.cos(rP) * speed;
        this.state.y -= Math.sin(rP) * speed;
        this.state.z += Math.cos(rY) * Math.cos(rP) * speed;

        // --- SPRITE MAPPING (phi/theta) ---
        let phi = this.state.pitch + 90; 
        let row = Math.round((phi / 180) * 6);
        row = Math.max(0, Math.min(6, row));

        let normYaw = (this.state.yaw % 360 + 360) % 360;
        let col, mirror = false;
        if (normYaw <= 180) {
            col = Math.round((normYaw / 180) * 6);
        } else {
            col = Math.round(((360 - normYaw) / 180) * 6);
            mirror = true;
        }

        if (row === 0 || row === 6) col = 0;

        this.sprite.style.backgroundPosition = `-${col * this.TILE}px -${row * this.TILE}px`;
        this.sprite.style.transform = mirror ? 'scaleX(-1)' : 'scaleX(1)';

        let scale = 800 / (800 + Math.abs(this.state.z));
        this.ship.style.left = this.state.x + 'px';
        this.ship.style.top = this.state.y + 'px';
        this.ship.style.transform = `translate(-50%, -50%) scale(${scale})`;
        
        requestAnimationFrame((t) => this.update(t));
    }

    resetToVisibleArea() {
        const w = window.innerWidth;
        this.state.x = Math.random() < 0.5 ? -200 : w + 200;
        this.state.y = Math.random() * window.innerHeight;
        this.state.z = -500;
        this.pickTarget();
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
            :host {
                position: fixed; top: 0; left: 0;
                width: 100vw; height: 100vh;
                overflow: hidden; pointer-events: none;
                z-index: 5;
            }
            #ship-container {
                position: absolute;
                width: ${this.TILE}px; height: ${this.TILE}px;
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
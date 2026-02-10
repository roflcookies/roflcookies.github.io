class StarshipBackground extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.TILE = 840;
        this.SPRITE_URL = 'https://juicebox.defl.space/default/items/2thoiKGhX_kqHNcWjXGecw';
        
        this.state = { x: -200, y: 300, z: -500, yaw: 90, pitch: 0 };
        this.pickTarget();
        this.lastTime = performance.now();
        this.watchdog = 0;
    }

    connectedCallback() {
        this.render();
        this.ship = this.shadowRoot.getElementById('ship-container');
        this.sprite = this.shadowRoot.getElementById('sprite');
        requestAnimationFrame((t) => this.update(t));
    }

    pickTarget() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        // --- GUTTER FOCUS ---
        // Calculate the side margins outside your 765px content
        const sideMargin = Math.max(120, (w - 765) / 2);
        
        let tx;
        if (this.state.x < w / 2) {
            // If on left, target the right visible gutter
            tx = w - (Math.random() * (sideMargin - 40) + 20);
        } else {
            // If on right, target the left visible gutter
            tx = Math.random() * (sideMargin - 40) + 20;
        }

        this.target = {
            x: tx,
            // Force higher/lower Y targets to trigger the pitch sprites
            y: Math.random() < 0.5 ? (h * 0.1) : (h * 0.9),
            z: -400 - (Math.random() * 1000)
        };
        this.watchdog = 0;
    }

    update(currentTime) {
        const dt = Math.min((currentTime - this.lastTime) / 16.66, 2.0);
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

        // Trigger turn early so we see it happen in the gutter
        if (dist < 180) {
            this.pickTarget();
        }

        // --- PHYSICS (From your working baseline) ---
        let tYaw = Math.atan2(dx, dz) * (180 / Math.PI);
        let tPitch = Math.asin(-dy / dist) * (180 / Math.PI);
        
        let diff = ((tYaw - this.state.yaw + 180) % 360 + 360) % 360 - 180;
        this.state.yaw += diff * 0.07 * dt;
        this.state.pitch += (tPitch - this.state.pitch) * 0.07 * dt;

        const speed = 7.0 * dt;
        const rY = this.state.yaw * (Math.PI / 180);
        const rP = this.state.pitch * (Math.PI / 180);
        
        this.state.x += Math.sin(rY) * Math.cos(rP) * speed;
        this.state.y -= Math.sin(rP) * speed;
        this.state.z += Math.cos(rY) * Math.cos(rP) * speed;

        // --- SPRITE MAPPING (Corrected for Hemisphere Logic) ---
        // phi 0 = Top, phi 90 = Side, phi 180 = Belly
        // Diving (dy < 0) = row 0-2. Climbing (dy > 0) = row 4-6.
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

        // Scale focus pushed to 1000 for better depth
        let scale = 1000 / (1000 + Math.abs(this.state.z));
        this.ship.style.left = this.state.x + 'px';
        this.ship.style.top = this.state.y + 'px';
        this.ship.style.transform = `translate(-50%, -50%) scale(${scale})`;
        
        requestAnimationFrame((t) => this.update(t));
    }

    resetToVisibleArea() {
        const w = window.innerWidth;
        this.state.x = Math.random() < 0.5 ? -200 : w + 200;
        this.state.y = Math.random() * window.innerHeight;
        this.state.z = -600;
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
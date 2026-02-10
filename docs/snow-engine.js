/**
 * SNOW_ENGINE v2.3 - High-Visibility Steam Cloud Update
 */
class SnowEngine {
    constructor() {
        if (document.getElementById('snow-canvas')) return;

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'snow-canvas';
        this.ctx = this.canvas.getContext('2d');
        this.flakes = [];
        this.steam = []; // For the melting effect
        this.mouse = { x: -1000, y: -1000 };
        this.lastTime = performance.now();

        this.initCanvas();
        this.addListeners();
        this.resize(true); 
        requestAnimationFrame((t) => this.draw(t));

        window.addEventListener('beforeunload', () => this.saveState());
    }

    initCanvas() {
        Object.assign(this.canvas.style, {
            position: 'fixed',
            top: '0', left: '0',
            width: '100%', height: '100%',
            pointerEvents: 'none',
            zIndex: '9999'
        });
        document.body.prepend(this.canvas);
    }

    saveState() {
        const state = this.flakes.map(f => ({ x: f.x, y: f.y, vx: f.vx, vy: f.vy }));
        localStorage.setItem('snow_state', JSON.stringify(state));
    }

    addListeners() {
        const updateMouse = (x, y) => { this.mouse.x = x; this.mouse.y = y; };
        const resetMouse = () => { this.mouse.x = -1000; this.mouse.y = -1000; };

        window.addEventListener('mousemove', (e) => updateMouse(e.clientX, e.clientY));
        window.addEventListener('mouseout', resetMouse);
        window.addEventListener('touchstart', (e) => updateMouse(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
        window.addEventListener('touchmove', (e) => updateMouse(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
        window.addEventListener('touchend', resetMouse);
        window.addEventListener('resize', () => this.resize(false));
    }

    resize(attemptLoad) {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        const saved = attemptLoad ? localStorage.getItem('snow_state') : null;
        
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.flakes = parsed.map(f => ({
                    ...f,
                    size: Math.random() * 2 + 1,
                    speed: Math.random() * 40 + 20,
                    opacity: Math.random() * 0.5 + 0.3
                }));
            } catch(e) { this.createFreshFlakes(); }
            localStorage.removeItem('snow_state');
        } else {
            this.createFreshFlakes();
        }
    }

    createFreshFlakes() {
        this.flakes = Array.from({ length: 250 }, () => ({
            x: Math.random() * this.width,
            y: Math.random() * this.height, 
            size: Math.random() * 2 + 1,
            speed: Math.random() * 40 + 20,
            opacity: Math.random() * 0.5 + 0.3,
            vx: 0, vy: 0
        }));
    }

    draw(currentTime) {
        let dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (dt <= 0 || dt > 0.1) dt = 0.016; 

        this.ctx.clearRect(0, 0, this.width, this.height);

        // --- GLOBAL FIRE CHECK ---
        const fire = window.pixelFire;
        const isFireLit = fire && fire.logs.length > 0 && fire.logs[0].expiry !== null;
        let hX, hY, hR = 150; 

        if (isFireLit) {
            const rect = fire.canvas.getBoundingClientRect();
            hX = rect.left + (rect.width / 2);
            hY = rect.top + (rect.height / 2);
        }

        this.flakes.forEach(f => {
            // 1. Fire Melting Logic (Updated to spawn 3 steam particles)
            if (isFireLit) {
                const fdx = f.x - hX;
                const fdy = f.y - hY;
                const fdist = Math.sqrt(fdx * fdx + fdy * fdy);
                if (fdist < hR) {
                    // Spawn 3 steam pixels with slight random spreads
                    for(let i = 0; i < 3; i++) {
                        this.steam.push({ 
                            x: f.x, 
                            y: f.y, 
                            life: 1.0, 
                            vx: (Math.random() - 0.5) * 1.5,
                            vy: (Math.random() * -1) - 0.5 // Rise at different speeds
                        });
                    }
                    
                    // Reset snowflake to top
                    f.y = -20;
                    f.x = Math.random() * this.width;
                    f.vx = 0; f.vy = 0;
                    return;
                }
            }

            // 2. Mouse Repulsion Logic
            const dx = f.x - this.mouse.x;
            const dy = f.y - this.mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const radius = 80;

            f.vx += (Math.random() - 0.5) * 1.2 * dt;

            if (dist < radius) {
                const gust = Math.random() * 150 + 50;
                const force = ((radius - dist) / radius) * gust * dt;
                const angle = Math.atan2(dy, dx);
                f.vx += Math.cos(angle) * force;
                f.vy += Math.sin(angle) * force;
            }

            // 3. Movement Physics
            const maxVel = 4;
            f.vx = Math.max(-maxVel, Math.min(maxVel, f.vx));
            f.vy = Math.max(-maxVel, Math.min(maxVel, f.vy));

            f.x += f.vx;
            f.y += (f.vy + (f.speed * dt));

            const friction = Math.pow(0.95, dt * 60);
            f.vx *= friction;
            f.vy *= friction;

            if (f.y > this.height) {
                f.y = -10;
                f.x = Math.random() * this.width;
                f.vx = 0; f.vy = 0;
            }

            // 4. Render Flake
            this.ctx.globalAlpha = f.opacity;
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(f.x, f.y, f.size, f.size);
        });

        // 5. Draw Steam Particles
        for (let i = this.steam.length - 1; i >= 0; i--) {
            const p = this.steam[i];
            p.y += p.vy; // Use its unique upward velocity
            p.x += p.vx;
            p.life -= 0.04; // How fast it fades
            
            if (p.life <= 0) {
                this.steam.splice(i, 1);
            } else {
                this.ctx.globalAlpha = p.life * 0.5;
                this.ctx.fillStyle = '#dbdbdb'; // Slightly lighter gray for visibility
                this.ctx.fillRect(p.x, p.y, 2, 2);
            }
        }

        requestAnimationFrame((t) => this.draw(t));
    }
}

new SnowEngine();
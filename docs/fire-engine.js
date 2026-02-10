/**
 * FIRE_ENGINE v4.0 - Scaled Logs & Voluminous Fire
 */
const FIRE_CONFIG = {
    burnTimePerLog: 15000, 
    particleLife: 45, // Slightly longer life for taller flames
    spawnRate: 8,    // More particles for a thicker fire
    pixelSize: 6,    // Larger "zoom" on fire pixels
    colors: ['#FFFFFF', '#FFFF55', '#FFAA00', '#FF5555', '#222222']
};

class FireEngine {
    constructor(canvasId, pileId) {
        this.canvas = document.getElementById(canvasId);
        this.pileContainer = document.getElementById(pileId);
        if (!this.canvas || !this.pileContainer) return;

        this.ctx = this.canvas.getContext('2d');
        
        this.logs = []; 
        this.particles = [];
        this.lastTime = performance.now();
        this.isClicking = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.ignitionProgress = 0; 

        this.injectStyles();
        this.setupPile();
        this.setupCanvas();
        this.setupGlobalDrag();
        this.setupControls();
        
        requestAnimationFrame((t) => this.render(t));
    }

    injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            #log-pile-target { width: 180px; height: 120px; align-self: flex-end; display: flex; align-items: flex-end; justify-content: center; cursor: grab; }
            .pixel-log { position: absolute; width: 60px; height: 20px; background-color: #5d3a24; background-image: repeating-linear-gradient(45deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 2px, transparent 2px, transparent 4px); border: 2px solid #2a180b; box-shadow: 2px 2px 0 #000; }
            .pixel-log-pile { width: 140px; height: 80px; position: relative; pointer-events: none; }
            #drag-ghost { position: fixed; z-index: 10000; display: none; pointer-events: none; }
        `;
        document.head.appendChild(style);
        
        const ghost = document.getElementById('drag-ghost') || document.createElement('div');
        ghost.id = 'drag-ghost';
        ghost.className = 'pixel-log';
        document.body.appendChild(ghost);
        this.ghost = ghost;
    }

    setupPile() {
        const pile = document.createElement('div');
        pile.className = 'pixel-log-pile';
        const coords = [{b:0,l:5}, {b:0,l:65}, {b:22,l:0}, {b:22,l:40}, {b:22,l:80}, {b:44,l:20}, {b:44,l:60}];
        coords.forEach(p => {
            const l = document.createElement('div');
            l.className = 'pixel-log';
            l.style.bottom = p.b+'px'; l.style.left = p.l+'px';
            pile.appendChild(l);
        });
        this.pileContainer.appendChild(pile);
    }

    setupControls() {
        this.canvas.addEventListener('mousedown', (e) => { this.isClicking = true; this.updateMouse(e); });
        window.addEventListener('mouseup', () => { this.isClicking = false; });
        this.canvas.addEventListener('mousemove', (e) => { this.updateMouse(e); });
    }

    updateMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
    }

    setupGlobalDrag() {
        let isDragging = false;
        this.pileContainer.addEventListener('mousedown', (e) => {
            isDragging = true; this.ghost.style.display = 'block';
            this.updateGhostPos(e); e.preventDefault();
        });
        window.addEventListener('mousemove', (e) => { if(isDragging) this.updateGhostPos(e); });
        window.addEventListener('mouseup', (e) => {
            if(!isDragging) return;
            isDragging = false; this.ghost.style.display = 'none';
            const rect = this.canvas.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                this.addLog();
            }
        });
    }

    updateGhostPos(e) {
        this.ghost.style.left = (e.clientX - 30) + 'px';
        this.ghost.style.top = (e.clientY - 10) + 'px';
    }

    addLog() {
        if (this.logs.length < 6) {
            const targetY = (this.logs.length * 12); // Increased vertical spacing for larger logs
            this.logs.push({ 
                expiry: null, 
                angle: this.logs.length === 0 ? 0 : (this.logs.length % 2 === 0 ? 0.22 : -0.22),
                yPos: targetY + 40, 
                targetY: targetY
            });
        }
    }

    drawLogs(now) {
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height - 15; // Lowered to sit on the floor
        const isBurning = this.logs.length > 0 && this.logs[0].expiry !== null;

        this.logs.forEach((log, i) => {
            if (log.yPos > log.targetY) log.yPos -= 1;
            if (log.yPos < log.targetY) log.yPos = log.targetY;

            this.ctx.save();
            this.ctx.translate(cx, cy - log.yPos);
            this.ctx.rotate(log.angle);

            const logW = 100; // Scaled up width
            const logH = 24;  // Scaled up height
            const pSize = 3;  // Larger dither pixels

            let logHeat = 0;
            if (isBurning) {
                if (i === 0) {
                    logHeat = Math.max(0.1, (log.expiry - now) / FIRE_CONFIG.burnTimePerLog);
                } else {
                    logHeat = Math.max(0, 0.8 - (i * 0.2)); 
                }
            }

            if (logHeat > 0) {
                for (let x = -logW/2; x < logW/2; x += pSize) {
                    for (let y = -logH/2; y < logH/2; y += pSize) {
                        const rand = Math.random();
                        const ashThreshold = (i === 0) ? (1.0 - logHeat) : (1.0 - logHeat) * 0.3;

                        if (rand < ashThreshold) {
                            const gray = 30 + Math.random() * 20;
                            this.ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
                        } else if (rand < ashThreshold + (logHeat * 0.4)) {
                            const r = 180 + Math.random() * 75;
                            const g = 40 + Math.random() * 50;
                            this.ctx.fillStyle = `rgb(${r},${g},20)`;
                        } else {
                            const r = 93 + (logHeat * 60);
                            const g = 58 + (logHeat * 20);
                            this.ctx.fillStyle = `rgb(${r},${g},36)`;
                        }
                        this.ctx.fillRect(x, y, pSize, pSize);
                    }
                }
            } else {
                this.ctx.fillStyle = `rgb(93, 58, 36)`;
                this.ctx.fillRect(-logW/2, -logH/2, logW, logH);
                this.ctx.fillStyle = 'rgba(0,0,0,0.15)';
                this.ctx.fillRect(-logW/2, -logH/2, logW, 6);
            }
            this.ctx.restore();
        });
    }

    spawnParticle(x, y) {
        this.particles.push({
            x: x + (Math.random() - 0.5) * 25, // Wider spawn
            y: y,
            vx: (Math.random() - 0.5) * 2.5,
            vy: (Math.random() * -2) - 1.5, // Faster upwards velocity
            life: Math.random() * FIRE_CONFIG.particleLife + 15,
            maxLife: FIRE_CONFIG.particleLife + 15
        });
    }

    setupCanvas() {
        const res = () => {
            this.canvas.width = this.canvas.clientWidth;
            this.canvas.height = this.canvas.clientHeight;
        };
        window.addEventListener('resize', res);
        res();
    }

    render(currentTime) {
        const dt = currentTime - this.lastTime;
        this.lastTime = currentTime;
        const now = currentTime;

        if (this.logs.length > 0 && this.logs[0].expiry !== null) {
            if (this.logs[0].expiry < now) {
                this.logs.shift();
                this.logs.forEach((log, idx) => {
                    log.targetY = idx * 12; // Adjusted for taller logs
                });
                if (this.logs.length > 0) {
                    this.logs[0].expiry = now + FIRE_CONFIG.burnTimePerLog;
                    this.logs[0].angle = 0;
                }
            }
        }

        if (this.isClicking) {
            for (let i = 0; i < 2; i++) this.spawnParticle(this.mouseX, this.mouseY);
            if (this.logs.length > 0 && this.logs[0].expiry === null) {
                const logY = this.canvas.height - 35;
                const logX = this.canvas.width / 2;
                if (Math.abs(this.mouseX - logX) < 60 && Math.abs(this.mouseY - logY) < 40) {
                    this.ignitionProgress += dt;
                    if (this.ignitionProgress > 1000) { 
                        this.logs[0].expiry = now + FIRE_CONFIG.burnTimePerLog;
                        this.ignitionProgress = 0;
                    }
                }
            }
        } else {
            this.ignitionProgress = Math.max(0, this.ignitionProgress - dt);
        }

        const isBurning = this.logs.length > 0 && this.logs[0].expiry !== null;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawLogs(now);

        if (isBurning) {
            for (let i = 0; i < FIRE_CONFIG.spawnRate; i++) {
                const lx = (this.canvas.width / 2) + (Math.random() - 0.5) * 60;
                const ly = this.canvas.height - 30;
                this.spawnParticle(lx, ly);
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.life--;
            if (p.life <= 0) { this.particles.splice(i, 1); continue; }
            const lifePct = p.life / p.maxLife;
            const colorIdx = lifePct < 0.2 ? 4 : lifePct < 0.4 ? 3 : lifePct < 0.6 ? 2 : lifePct < 0.8 ? 1 : 0;
            this.ctx.fillStyle = FIRE_CONFIG.colors[colorIdx];
            const px = Math.round(p.x / FIRE_CONFIG.pixelSize) * FIRE_CONFIG.pixelSize;
            const py = Math.round(p.y / FIRE_CONFIG.pixelSize) * FIRE_CONFIG.pixelSize;
            this.ctx.fillRect(px, py, FIRE_CONFIG.pixelSize, FIRE_CONFIG.pixelSize);
        }
        requestAnimationFrame((t) => this.render(t));
    }
}
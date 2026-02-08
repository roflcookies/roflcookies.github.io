/**
 * PACHINKO ENGINE - ROFLCOOKIES.COM
 * Finalized: Asymmetric collision box to keep pegs out of cups but allow them beneath.
 */

window.onload = () => {
    const { Engine, Render, Runner, Bodies, Composite, Events } = Matter;

    const WIDTH = 500;
    const HEIGHT = 600;
    const BALL_COST = 5;
    const WIN_PAYOUT = 30;
    const CUP_COUNT = 5; 
    
    let credits = 100;
    let isHolding = false;
    let lastDropTime = 0;
    let mouseX = WIDTH / 2;

    const engine = Engine.create();
    const world = engine.world;
    engine.gravity.y = 1.2; 

    const render = Render.create({
        element: document.getElementById('pachinko-canvas-container'),
        engine: engine,
        options: {
            width: WIDTH, height: HEIGHT,
            wireframes: false, background: 'transparent'
        }
    });

    // --- BOUNDARIES ---
    const wallProps = { isStatic: true, render: { fillStyle: '#222' } };
    Composite.add(world, [
        Bodies.rectangle(WIDTH / 2, HEIGHT + 15, WIDTH, 40, { ...wallProps, label: 'pit' }),
        Bodies.rectangle(-5, HEIGHT / 2, 10, HEIGHT, wallProps),
        Bodies.rectangle(WIDTH + 5, HEIGHT / 2, 10, HEIGHT, wallProps),
        Bodies.rectangle(70, 45, 200, 30, { isStatic: true, angle: 0.7, render: { fillStyle: '#494132' } }),
        Bodies.rectangle(WIDTH - 70, 45, 200, 30, { isStatic: true, angle: -0.7, render: { fillStyle: '#494132' } })
    ]);

    // --- CUP PLACEMENT ---
    const cupPositions = [];
    const cups = [];
    for (let i = 0; i < CUP_COUNT; i++) {
        let cx, cy, invalid;
        let attempts = 0;
        do {
            invalid = false;
            cx = 60 + Math.random() * (WIDTH - 120);
            cy = 350 + Math.random() * (HEIGHT - 450);
            
            for (let pos of cupPositions) {
                if (Math.hypot(cx - pos.x, cy - pos.y) < 95) {
                    invalid = true; break;
                }
            }
            attempts++;
        } while (invalid && attempts < 100);
        
        cupPositions.push({ x: cx, y: cy });

        const sensor = Bodies.rectangle(cx, cy + 2, 20, 10, { isStatic: true, isSensor: true, label: 'cup', render: { fillStyle: '#55FFFF' } });
        const left = Bodies.rectangle(cx - 14, cy - 8, 4, 25, { isStatic: true, render: { fillStyle: '#55FFFF' } });
        const right = Bodies.rectangle(cx + 14, cy - 8, 4, 25, { isStatic: true, render: { fillStyle: '#55FFFF' } });
        const bottom = Bodies.rectangle(cx, cy + 8, 32, 4, { isStatic: true, render: { fillStyle: '#55FFFF' } });
        
        cups.push(sensor, left, right, bottom);
    }
    Composite.add(world, cups);

    // --- JITTERED STAGGERED GRID ---
    const rowSpacing = 32;
    const colSpacing = 38; 
    const rows = 16;

    for (let i = 0; i < rows; i++) {
        const isEven = i % 2 === 0;
        const pegsInRow = isEven ? 12 : 13;
        for (let j = 0; j < pegsInRow; j++) {
            const jitter = (Math.random() - 0.5) * 8; 
            const x = (j * colSpacing) + (isEven ? 40 : 20) + jitter;
            const y = 120 + (i * rowSpacing);
            
            // --- REFINED ASYMMETRIC VOID CHECK ---
            let insideCupZone = false;
            for (let pos of cupPositions) {
                const bufferX = 22; // Narrowed to cup width
                const bufferUp = 30; // Clears the mouth/walls
                const bufferDown = 10; // Minimal clearance below bottom bar

                if (x > pos.x - bufferX && x < pos.x + bufferX &&
                    y > pos.y - bufferUp && y < pos.y + bufferDown) {
                    insideCupZone = true;
                    break;
                }
            }

            if (insideCupZone) continue;

            const sideMargin = 100;
            if (y < 160 && (x < sideMargin || x > WIDTH - sideMargin)) continue;
            
            Composite.add(world, Bodies.circle(x, y, 4, {
                isStatic: true, restitution: 1.5, render: { fillStyle: '#72644b' }
            }));
        }
    }

    // --- INPUT HANDLING ---
    const container = document.getElementById('pachinko-canvas-container');
    const scoreEl = document.getElementById('score');

    const updatePosition = (e) => {
        const rect = container.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const scaleX = WIDTH / rect.width;
        mouseX = (clientX - rect.left) * scaleX;
    };

    container.addEventListener('mousedown', (e) => { isHolding = true; updatePosition(e); });
    window.addEventListener('mouseup', () => { isHolding = false; });
    container.addEventListener('mousemove', updatePosition);
    container.addEventListener('touchstart', (e) => { isHolding = true; updatePosition(e); if(e.cancelable) e.preventDefault(); }, { passive: false });
    window.addEventListener('touchend', () => { isHolding = false; });
    container.addEventListener('touchmove', (e) => { updatePosition(e); if(e.cancelable) e.preventDefault(); }, { passive: false });

    // --- CORE LOOP ---
    Events.on(engine, 'beforeUpdate', () => {
        const now = Date.now();
        if (isHolding && credits >= BALL_COST && now - lastDropTime > 140) {
            credits -= BALL_COST;
            scoreEl.innerText = credits;
            const jitter = (Math.random() - 0.5) * 12;
            const ball = Bodies.circle(mouseX + jitter, 15, 6, {
                restitution: 0.6, friction: 0.001, label: 'ball', render: { fillStyle: '#FFFFFF' }
            });
            Composite.add(world, ball);
            lastDropTime = now;
        }
    });

    Events.on(engine, 'collisionStart', (event) => {
        event.pairs.forEach(pair => {
            const { bodyA, bodyB } = pair;
            const ball = bodyA.label === 'ball' ? bodyA : (bodyB.label === 'ball' ? bodyB : null);
            const target = bodyA.label === 'ball' ? bodyB : bodyA;
            if (ball) {
                if (target.label === 'cup') {
                    credits += WIN_PAYOUT;
                    scoreEl.innerText = credits;
                    Composite.remove(world, ball);
                } else if (target.label === 'pit') {
                    Composite.remove(world, ball);
                }
            }
        });
    });

    Render.run(render);
    Runner.run(Runner.create(), engine);
};
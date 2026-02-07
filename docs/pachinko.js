/**
 * PACHINKO ENGINE - ROFLCOOKIES.COM
 * Fixed: Clearance for top ramps and "stuck ball" prevention.
 */

window.onload = () => {
    const { Engine, Render, Runner, Bodies, Composite, Events } = Matter;

    const WIDTH = 500;
    const HEIGHT = 600;
    const BALL_COST = 5;
    const WIN_PAYOUT = 30;
    const CUP_COUNT = 6;
    const MIN_CUP_DIST = 95; 
    const TOP_GUARD = 300; 
    
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
        // Ramps (Funnels)
        Bodies.rectangle(70, 45, 200, 30, { isStatic: true, angle: 0.7, render: { fillStyle: '#494132' } }),
        Bodies.rectangle(WIDTH - 70, 45, 200, 30, { isStatic: true, angle: -0.7, render: { fillStyle: '#494132' } })
    ]);

    // --- JITTERED STAGGERED GRID ---
    const rowSpacing = 32;
    const colSpacing = 38; 
    const rows = 15;

    for (let i = 0; i < rows; i++) {
        const isEven = i % 2 === 0;
        const pegsInRow = isEven ? 12 : 13;
        for (let j = 0; j < pegsInRow; j++) {
            const jitter = (Math.random() - 0.5) * 8; 
            const x = (j * colSpacing) + (isEven ? 40 : 20) + jitter;
            const y = 120 + (i * rowSpacing); // Started lower to clear ramps

            // SKIP PEGS THAT INTERSECT RAMPS
            // If the peg is too high and too far to the left/right, don't spawn it.
            const sideMargin = 100;
            if (y < 160 && (x < sideMargin || x > WIDTH - sideMargin)) continue;

            Composite.add(world, Bodies.circle(x, y, 4, {
                isStatic: true, restitution: 1.5, render: { fillStyle: '#72644b' }
            }));
        }
    }

    // --- CUP PLACEMENT ---
    const cupPositions = [];
    for (let i = 0; i < CUP_COUNT; i++) {
        let cx, cy, invalid;
        let attempts = 0;
        do {
            invalid = false;
            cx = 80 + Math.random() * (WIDTH - 160);
            cy = TOP_GUARD + Math.random() * (HEIGHT - TOP_GUARD - 100);
            for (let pos of cupPositions) {
                if (Math.hypot(cx - pos.x, cy - pos.y) < MIN_CUP_DIST) {
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
        Composite.add(world, [sensor, left, right, bottom]);
    }

    // --- INPUT ---
    const container = document.getElementById('pachinko-canvas-container');
    const scoreEl = document.getElementById('score');

    container.onmousedown = () => { isHolding = true; };
    window.onmouseup = () => { isHolding = false; };
    container.onmousemove = (e) => {
        const rect = container.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
    };

    Events.on(engine, 'beforeUpdate', () => {
        const now = Date.now();
        if (isHolding && credits >= BALL_COST && now - lastDropTime > 140) {
            credits -= BALL_COST;
            scoreEl.innerText = credits;
            const jitter = (Math.random() - 0.5) * 12;
            const ball = Bodies.circle(mouseX + jitter, 15, 6, {
                restitution: 0.6, friction: 0.01, label: 'ball', render: { fillStyle: '#FFFFFF' }
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
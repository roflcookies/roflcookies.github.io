const headerTemplate = document.createElement('template');

headerTemplate.innerHTML = `
    <style>
        :host {
            --osrs-brown: #494132;
            --osrs-border: #72644b;
            --gw-cyan: #55FFFF;
            --gw-white: #FFFFFF;
            --jester-red: #8b0000;
            --winter-steel: #465362;
        }

        header {
            background: #000;
            border-bottom: 3px ridge var(--osrs-border);
            height: 160px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .banner-overlay {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background-image: url('https://images.pexels.com/photos/688660/pexels-photo-688660.jpeg?auto=compress&cs=tinysrgb&w=800');
            background-position: center 30%;
            background-size: cover;
            opacity: 0.5;
            filter: grayscale(1) contrast(180%) brightness(0.6);
            image-rendering: pixelated;
        }

        .site-title {
            position: relative;
            z-index: 2;
            color: var(--gw-cyan);
            font-size: 48px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 4px;
            text-shadow: 4px 4px var(--jester-red), 6px 6px #000;
            font-family: "Lucida Console", Monaco, monospace;
        }

        nav {
            display: flex;
            background: #222;
            padding: 5px 15px 0 15px;
            border-bottom: 2px solid #000;
            position: relative;
            z-index: 5;
            font-family: "Lucida Console", Monaco, monospace;
        }

        .tab {
            background: var(--osrs-brown);
            border: 2px outset var(--osrs-border);
            border-bottom: none;
            padding: 10px 20px;
            color: #d1c4a8;
            text-decoration: none;
            font-size: 13px;
            margin-right: 5px;
            font-weight: bold;
            display: block;
        }

        .tab:hover { background: var(--winter-steel); }
        .active { color: var(--gw-white) !important; position: relative; top: 2px; z-index: 10; background: var(--osrs-brown) !important; }

        .dropdown { position: relative; display: inline-block; }
        .dropdown-content {
            display: none;
            position: absolute;
            background-color: var(--osrs-brown);
            min-width: 160px;
            border: 2px solid var(--osrs-border);
            z-index: 1000;
            box-shadow: 5px 5px 0px #000;
            top: 100%;
        }
        .dropdown-content a {
            color: #d1c4a8;
            padding: 10px;
            text-decoration: none;
            display: block;
            font-size: 12px;
            border-bottom: 1px solid var(--osrs-border);
        }
        .dropdown-content a:hover { background-color: var(--winter-steel); color: var(--gw-cyan); }
        .dropdown:hover .dropdown-content { display: block; }
    </style>

    <header>
        <div class="banner-overlay"></div>
        <div class="site-title">ROFLCOOKIES</div>
    </header>

    <nav>
        <a href="index.html" class="tab" id="home-link">HOME</a>
        <a href="about.html" class="tab" id="about-link">THE_FOOL</a>
        <a href="archive.html" class="tab" id="archive-link">ARCHIVE</a>
        
        <div class="dropdown">
            <a href="#" class="tab" id="extras-link">EXTRAS &#9662;</a>
            <div class="dropdown-content">
                <a href="links.html">OUTBOUND</a>
                <a href="secret.html">HIDDEN_FILE</a>
                <a href="guestbook.html">GUESTBOOK</a>
            </div>
        </div>
    </nav>
`;

class MainHeader extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(headerTemplate.content.cloneNode(true));

        // 1. Handle Active Tab Logic
        const path = window.location.pathname;
        const links = {
            'home-link': path === '/' || path.includes('index.html'),
            'about-link': path.includes('about.html'),
            'archive-link': path.includes('archive.html'),
            'extras-link': path.includes('guestbook.html') || path.includes('links.html') || path.includes('secret.html')
        };

        Object.keys(links).forEach(id => {
            if (links[id]) {
                const el = shadowRoot.getElementById(id);
                if (el) el.classList.add('active');
            }
        });

        // 2. Initialize Snow
        if (!document.getElementById('snow')) {
            this.initSnow();
        }

        // 3. Smart Loading Screen Logic
		const loader = document.getElementById('loading-screen');
        if (loader) {
            // Check if we already booted in this session
            if (sessionStorage.getItem('booted') === 'true') {
                loader.remove(); // No animation, no waiting, just delete it.
            } else {
                // First load of the session
                setTimeout(() => {
                    loader.style.opacity = '0';
                    setTimeout(() => {
                        loader.remove();
                        sessionStorage.setItem('booted', 'true');
                    }, 500);
                }, 1000); 
            }
        }

    initSnow() {
        const canvas = document.createElement('canvas');
        canvas.id = 'snow';
        Object.assign(canvas.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: '-1'
        });
        document.body.prepend(canvas);

        const ctx = canvas.getContext('2d');
        let width, height, flakes = [];

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            flakes = Array.from({ length: 150 }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 1 + 0.5,
                opacity: Math.random() * 0.5 + 0.3
            }));
        };

        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'white';
            flakes.forEach(f => {
                ctx.globalAlpha = f.opacity;
                ctx.fillRect(f.x, f.y, f.size, f.size);
                f.y += f.speed;
                if (f.y > height) f.y = -5;
            });
            requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resize);
        resize();
        draw();
    }
}

customElements.define('main-header', MainHeader);
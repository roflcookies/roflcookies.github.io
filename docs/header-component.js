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
            
            /* Ensure the header itself is ALWAYS on top of the ship */
            position: relative;
            z-index: 100; 
        }

        .banner-link { text-decoration: none; display: block; cursor: pointer; }

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
            background-image: url('assets/banner.jpeg');
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
            z-index: 101; /* Keep nav above everything */
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

    <a href="index.html" class="banner-link">
        <header>
            <div class="banner-overlay"></div>
            <div class="site-title">ROFLCOOKIES</div>
        </header>
    </a>

    <nav>
        <a href="index.html" class="tab" id="home-link">HOME</a>
        <a href="about.html" class="tab" id="about-link">THE_FOOL</a>
        <a href="blog.html" class="tab" id="blog-link">BLOG</a>
        
        <div class="dropdown">
            <a href="#" class="tab" id="extras-link">EXTRAS &#9662;</a>
            <div class="dropdown-content">
                <a href="pachinko.html">PACHINKO</a>
				<a href="fire.html">CAMPFIRE</a>
                <a href="juul.html">SCHOOL_OF_JUUL</a>
                <a href="guestbook.html">GUESTBOOK</a>
            </div>
        </div>
    </nav>
`;

class MainHeader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(headerTemplate.content.cloneNode(true));
    }

    connectedCallback() {
        this.updateActiveTab();
        this.initSnow();
        this.initStarship(); // Starts the ship flying!
    }

    updateActiveTab() {
        const path = window.location.pathname;
        const shadow = this.shadowRoot;
        const links = {
            'home-link': path === '/' || path.includes('index.html'),
            'about-link': path.includes('about.html'),
            'blog-link': path.includes('blog.html'),
            'extras-link': path.includes('guestbook.html') || path.includes('pachinko.html') || path.includes('juul.html') || path.includes('juul-reader.html') || path.includes('fire.html')
        };

        Object.keys(links).forEach(id => {
            const el = shadow.getElementById(id);
            if (el) {
                if (links[id]) el.classList.add('active');
                else el.classList.remove('active');
            }
        });
    }

    initSnow() {
        if (document.querySelector('script[src="snow-engine.js"]')) return;
        const script = document.createElement('script');
        script.src = 'snow-engine.js';
        document.head.appendChild(script);
    }

	initStarship() {
        if (!document.querySelector('script[src="starship-component.js"]')) {
            const script = document.createElement('script');
            script.src = 'starship-component.js';
            document.head.appendChild(script);
            
            script.onload = () => {
                if (!document.querySelector('starship-background')) {
                    const ship = document.createElement('starship-background');
                    // Force the ship to the background level
                    ship.style.position = "fixed";
                    ship.style.top = "0";
                    ship.style.left = "0";
                    ship.style.width = "100%";
                    ship.style.height = "100%";
                    ship.style.zIndex = "-1"; // Move it BEHIND the body's normal layer
                    document.body.prepend(ship);
                }
            };
        }
    }
}

customElements.define('main-header', MainHeader);
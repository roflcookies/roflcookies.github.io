const footerTemplate = document.createElement('template');
footerTemplate.innerHTML = `
    <style>
        :host { display: block; margin-top: 20px; }
        footer {
            background: #000;
            border: 3px ridge #72644b;
            padding: 20px 0;
            text-align: center;
            color: #72644b;
            font-family: "Lucida Console", Monaco, monospace;
            font-size: 12px;
            letter-spacing: 2px;
            box-sizing: border-box;
        }
        .footer-text { font-weight: bold; text-transform: uppercase; margin-bottom: 12px; }
        #digit-container { display: flex; justify-content: center; gap: 1px; min-height: 24px; margin-bottom: 20px; }
        .digit {
            width: 18px; height: 24px;
            background-image: url('assets/numbers.jpg');
            background-repeat: no-repeat;
            display: inline-block;
            image-rendering: pixelated;
            filter: grayscale(100%) brightness(1.2);
        }
        .screen-frame {
            width: 85%; max-width: 600px; margin: 0 auto;
            background: #050505; border: 2px inset #72644b;
            padding: 8px 0; position: relative; overflow: hidden;
            box-shadow: inset 0 0 10px #000;
        }
        .screen-frame::after {
            content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: repeating-linear-gradient(0deg, rgba(0,0,0,0.2), rgba(0,0,0,0.2) 1px, transparent 1px, transparent 2px);
            pointer-events: none; z-index: 5;
        }
        .ticker-viewport { overflow: hidden; white-space: nowrap; display: flex; }
        .ticker-content {
            display: inline-block;
            padding-left: 100%;
            color: #55FFFF;
            text-shadow: 0 0 6px rgba(85, 255, 255, 0.4);
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            will-change: transform;
            transform: translateZ(0);
        }
        @keyframes ticker-move {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
        }
    </style>
    <footer>
        <div class="footer-text">COOKIES ROFL'ED</div>
        <div id="digit-container"></div>
        <div class="screen-frame">
            <div class="ticker-viewport">
                <div class="ticker-content" id="ticker-text">
                    *** ROFLCOOKIES.COM *** ROFLCOOKIES.COM *** ROFLCOOKIES.COM *** ROFLCOOKIES.COM *** ROFLCOOKIES.COM *** ROFLCOOKIES.COM *** ROFLCOOKIES.COM ***
                </div>
            </div>
        </div>
    </footer>
`;

class MainFooter extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(footerTemplate.content.cloneNode(true));
        this._tickerTimeout = null;
    }

    connectedCallback() {
        this.fetchDisplayData();
        this.initGlobalTicker();
    }

    disconnectedCallback() {
        if (this._tickerTimeout) clearTimeout(this._tickerTimeout);
    }

    initGlobalTicker() {
        const ticker = this.shadowRoot.getElementById('ticker-text');
        if (!ticker) return;

        // Configuration: pixels per second
        const pixelsPerSecond = 50;
        
        this._tickerTimeout = setTimeout(() => {
            const textWidth = ticker.scrollWidth;
            const viewportWidth = ticker.parentElement.clientWidth;
            
            // The total distance the text travels per loop
            const totalDistance = textWidth + viewportWidth;
            const duration = totalDistance / pixelsPerSecond;

            // --- THE GLOBAL CLOCK FIX ---
            // Instead of localStorage, we use the absolute current time in seconds.
            // This ensures every page calculates the exact same "progress" in the loop.
            const nowInSeconds = Date.now() / 1000;
            const timeInCurrentLoop = nowInSeconds % duration;

            ticker.style.animation = `ticker-move ${duration}s linear infinite`;
            ticker.style.animationDelay = `-${timeInCurrentLoop}s`;
        }, 150);
    }

    async fetchDisplayData() {
        const SB_URL = 'https://yeqgovjxqfrmxlooizgt.supabase.co/rest/v1';
        const SB_KEY = 'sb_publishable_o9JQwug9ZEvWqxt7S4lIpw_CNAsxPXa';
        const headers = { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` };

        try {
            await fetch(`${SB_URL}/rpc/refresh_stats`, { method: 'POST', headers });
            const res = await fetch(`${SB_URL}/site_data?id=eq.1&select=hits`, { headers });
            const data = await res.json();
            
            if (data && data[0]) {
                const hits = data[0].hits.toString().padStart(7, '0');
                const container = this.shadowRoot.getElementById('digit-container');
                
                if (container) {
                    container.innerHTML = '';
                    hits.split('').forEach(num => {
                        const digit = document.createElement('div');
                        digit.className = 'digit';
                        digit.style.backgroundPosition = `${parseInt(num) * -18}px 0px`;
                        container.appendChild(digit);
                    });
                }
            }
        } catch (e) {}
    }
}

customElements.define('main-footer', MainFooter);
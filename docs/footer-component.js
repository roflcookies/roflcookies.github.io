const footerTemplate = document.createElement('template');
footerTemplate.innerHTML = `
    <style>
        :host {
            display: block;
            margin-top: 20px;
        }
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
        .footer-text {
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 12px;
        }
        #digit-container {
            display: flex;
            justify-content: center;
            gap: 1px;
            min-height: 24px;
        }
        .digit {
            width: 18px;
            height: 24px;
            background-image: url('assets/numbers.jpg');
            background-repeat: no-repeat;
            display: inline-block;
            image-rendering: pixelated;
            filter: grayscale(100%) brightness(1.2);
        }
    </style>
    <footer>
        <div class="footer-text">COOKIES ROFL'ED</div>
        <div id="digit-container">
            <div class="digit" style="background-position: 0px 0px;"></div>
            <div class="digit" style="background-position: 0px 0px;"></div>
            <div class="digit" style="background-position: 0px 0px;"></div>
            <div class="digit" style="background-position: 0px 0px;"></div>
            <div class="digit" style="background-position: 0px 0px;"></div>
            <div class="digit" style="background-position: 0px 0px;"></div>
            <div class="digit" style="background-position: 0px 0px;"></div>
        </div>
    </footer>
`;

class MainFooter extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(footerTemplate.content.cloneNode(true));
    }

    connectedCallback() {
        this.fetchDisplayData();
    }

    async fetchDisplayData() {
        const SB_URL = 'https://yeqgovjxqfrmxlooizgt.supabase.co/rest/v1';
        const SB_KEY = 'sb_publishable_o9JQwug9ZEvWqxt7S4lIpw_CNAsxPXa';
        const headers = { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` };

        try {
            // Call renamed function
            await fetch(`${SB_URL}/rpc/refresh_stats`, { method: 'POST', headers });
            
            // Fetch from renamed table
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
                        const xOffset = parseInt(num) * -18;
                        digit.style.backgroundPosition = `${xOffset}px 0px`;
                        container.appendChild(digit);
                    });
                }
            }
        } catch (e) {
            // Silent catch to prevent adblocker triggers on console errors
        }
    }
}

customElements.define('main-footer', MainFooter);
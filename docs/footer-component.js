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
            padding: 25px 0;
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
            margin-bottom: 15px;
        }
        .hit-counter {
            display: block;
            min-height: 50px; /* Forces space so we can see if it's there */
        }
        .hit-counter img {
            display: inline-block;
            margin-top: 10px;
            border: none;
            /* Ensures it doesn't get smoothed out */
            image-rendering: pixelated; 
        }
    </style>
    <footer>
        <div class="footer-text">COOKIES ROFL'ED</div>
        <div class="hit-counter">
            <a href="https://www.freecounterstat.com" title="website counter">
                <img src="https://counter1.optistats.ovh/private/freecounterstat.php?c=gpdb28ygg4q4sezqtjm2gaj6lzqtpusl" border="0" title="website counter" alt="website counter">
            </a>
        </div>
    </footer>
`;

class MainFooter extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(footerTemplate.content.cloneNode(true));
    }
}

customElements.define('main-footer', MainFooter);
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
        .hit-counter img {
            display: inline-block;
            border: none;
            /* Sharp pixel look for the numbers */
            image-rendering: pixelated; 
            height: 20px;
        }
    </style>
    <footer>
        <div class="footer-text">COOKIES ROFL'ED</div>
        <div class="hit-counter">
            <a href="https://www.freecounterstat.com" target="_blank" title="website counter">
                <img src="https://counter1.optistats.ovh/private/freecounterstat.php?c=gpdb28ygg4q4sezqtjm2gaj6lzqtpusl" alt="hit counter">
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
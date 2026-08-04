class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<header class="site-header container"><a class="brand" href="index.html"><img src="logo.png" alt="ElcomCLI"><span>ELCOM<span class="accent">CLI</span></span></a><nav class="desktop-nav"><a href="index.html">الرئيسية</a><a href="index.html#platform">المنصة</a><a href="support.html">الدعم</a><a href="privacy.html">الخصوصية</a></nav><div class="header-actions"><span class="header-status">SYSTEM ONLINE <b class="header-cursor">_</b></span><button class="menu-button" aria-label="فتح القائمة">☰</button></div></header><nav class="mobile-nav"><a href="index.html">الرئيسية</a><a href="index.html#platform">المنصة</a><a href="support.html">الدعم</a><a href="privacy.html">الخصوصية</a></nav>`;
    const button = this.querySelector('.menu-button'); const menu = this.querySelector('.mobile-nav');
    button?.addEventListener('click', () => menu?.classList.toggle('open'));
  }
}
class SiteFooter extends HTMLElement { connectedCallback() { this.innerHTML = `<footer class="site-footer container"><div><a class="brand" href="index.html"><img src="logo.png" alt=""><span>ELCOM<span class="accent">CLI</span></span></a><p>VPS management, built for your pocket.</p></div><div class="footer-meta"><span>/ SUPPORT: elcom.lab.iq@gmail.com</span><span>/ RELEASE: 2026</span><span>/ STATUS: STABLE</span></div></footer>`; } }
customElements.define('site-header', SiteHeader); customElements.define('site-footer', SiteFooter);

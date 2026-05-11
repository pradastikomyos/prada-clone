import { chromium } from 'playwright';

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('https://www.prada.com/ww/en.html', { waitUntil: 'domcontentloaded' });

    const data = await page.evaluate(() => {
      const getStyles = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const styles = window.getComputedStyle(element);
        return {
          fontFamily: styles.fontFamily,
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
          letterSpacing: styles.letterSpacing,
          textTransform: styles.textTransform,
          lineHeight: styles.lineHeight,
        };
      };

      // Prada uses specific test-id or classes, we can try generic ones or text selectors
      const menuBtn = Array.from(document.querySelectorAll('*')).find(el => el.textContent && el.textContent.trim().toLowerCase() === 'menu' && el.children.length === 0);
      const searchBtn = Array.from(document.querySelectorAll('*')).find(el => el.textContent && el.textContent.trim().toLowerCase() === 'search' && el.children.length === 0);
      
      const title = document.querySelector('h1, h2');

      const fontFamilies = new Set();
      document.fonts.forEach(f => fontFamilies.add(f.family));

      return {
        menuBtn: getStyles('button') || (menuBtn ? window.getComputedStyle(menuBtn).fontFamily : null),
        searchBtn: getStyles('a[href*="search"]') || (searchBtn ? window.getComputedStyle(searchBtn).fontFamily : null),
        title: getStyles('h2'),
        body: getStyles('body'),
        loadedFonts: Array.from(fontFamilies)
      };
    });

    console.log(JSON.stringify(data, null, 2));
    await browser.close();
  } catch (err) {
    console.error(err);
  }
})();

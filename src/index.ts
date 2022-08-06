const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { document } = (new JSDOM(`...`)).window;
const puppeteer = require("puppeteer");

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto("https://magiceden.io/marketplace/rakkudos");

    await page.waitForSelector(".tw-text-white-1.tw-text-14px.tw-truncate");

    const data = await page.evaluate(() => {
      let items = document.getElementsByClassName("tw-text-white-1 tw-text-14px tw-truncate");

      const list = [];
  
     for (const item of items) {
       list.push({
         value: item.innerText
       })
     }
  
      return list;
    })
  
    console.log(data);
    await browser.close();
  })()
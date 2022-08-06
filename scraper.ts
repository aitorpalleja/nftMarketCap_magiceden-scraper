const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { document } = (new JSDOM(`...`)).window;
const puppeteer: any = require("puppeteer");

(async () => {
    const browser: any = await puppeteer.launch({ headless: false });
    const page: any = await browser.newPage();
    await page.goto("https://magiceden.io/marketplace/jikan");

    await page.waitForSelector(".tw-text-white-1.tw-text-14px.tw-truncate");

    const data: any = await page.evaluate(() => {
      let items: any = document.getElementsByClassName("tw-text-white-1 tw-text-14px tw-truncate");

      const list: any = [];
  
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
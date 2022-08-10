import { JSDOM } from "jsdom"
const { window } = new JSDOM('<!doctype html><html><body></body></html>');
const puppeteer: any = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
    ]
  });
    const page: any = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
    await page.goto("https://magiceden.io/marketplace/degods");

    await page.waitForSelector(".tw-text-white-1.tw-text-14px.tw-truncate");

    const data: any = await page.evaluate(() => {
      let items: any = window.document.getElementsByClassName("tw-text-white-1 tw-text-14px tw-truncate");

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

  
// const jsdom = require("jsdom");
// const { JSDOM } = jsdom;
import { JSDOM } from "jsdom"
const { window } = new JSDOM('<!doctype html><html><body></body></html>');
const puppeteer: any = require("puppeteer");

export class ScraperService {
  constructor() {

  }

  async getNftData(symbol: String): Promise<any> {
    const browser: any = await puppeteer.launch({ headless: false });
    const page: any = await browser.newPage();
    await page.goto("https://magiceden.io/marketplace/" + symbol);

    await page.waitForSelector(".tw-text-white-1.tw-text-14px.tw-truncate");

    const data: any = await page.evaluate(() => {
      let items: any = window.document.getElementsByClassName(
        "tw-text-white-1 tw-text-14px tw-truncate"
      );

      const list: any = [];

      for (const item of items) {
        list.push({
          value: item.innerText,
        });
      }

      return list;
    });

    await browser.close();

    return data;
  }
}

import { JSDOM } from "jsdom";
const { window } = new JSDOM("<!doctype html><html><body></body></html>");
const puppeteer: any = require("puppeteer");

export class ScraperService {
  constructor() {}

  async getAllCollectionsData() : Promise<any> {
    const startTime: number = Date.now() / 1000;
    const data: any = await this._scrapAllCollectionData(startTime);

    return data;
  }

  async getNftData(symbol: string): Promise<any> {
    const startTime: number = Date.now() / 1000;
    const allSymbolsArray: string[] = symbol.split(",");
    const arrayOfMethods: any = this._getArrayOfScrapMethods(allSymbolsArray, startTime);
    const [...methodsResult] = (await Promise.all(arrayOfMethods)).filter((a) => a);
    const result: any[] = [];

    methodsResult.forEach((data: any) => {
      result.push(data);
    });

    return result;
  }

  _scrapAllCollectionData = async (startTime) => {
    const url: string = "https://api-mainnet.magiceden.io/all_collections_with_escrow_data?edge_cache=true";
    let result: any[] = [];
    const browser: any = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    const page: any = await browser.newPage();
    await page.setDefaultNavigationTimeout(0); 
    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
    );
    await page.goto(url);
    await page.waitForFunction("window.document.getElementsByTagName('pre') && window.document.getElementsByTagName('pre').length > 0");


    result.push(this._getTimeResult("_scrapAllCollectionData", startTime));
    result.push(await this._getAlCollectionPageData(page));
    await browser.close();
    return result;
  }

  private _getAlCollectionPageData = async (page: any) => {
    const pageData: any = await page.evaluate(() => {
      const list: any = [];
      let item: any = JSON.parse(window.document.getElementsByTagName("pre")[0].innerText);

      return item;
    });

    return pageData;
  };

  _getArrayOfScrapMethods = (symbols: string[], startTime: number): any => {
    const arrayOfMethods: any = [];
    symbols.forEach((symbol) => {
      arrayOfMethods.push(this._scrapCollectionData(symbol, startTime));
    });

    return arrayOfMethods;
  };

  _scrapCollectionData = async (symbol: string, startTime: number) => {
    let result: any[] = [];
    const browser: any = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    const page: any = await browser.newPage();
    await page.setDefaultNavigationTimeout(0); 
    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
    );
    await page.goto("https://magiceden.io/marketplace/" + symbol);
    await page.waitForSelector(".tw-text-white-1.tw-text-14px.tw-truncate");

    result.push(this._getTimeResult("_scrapCollectionData. " + "Symbol: " + symbol, startTime));
    result.push(await this._getPageData(page));
    await browser.close();
    return result;
  };

  private _getPageData = async (page: any) => {
    const pageData: any = await page.evaluate(() => {
      const list: any = [];
      let items: any = window.document.getElementsByClassName(
        "tw-text-white-1 tw-text-14px tw-truncate"
      );

      for (const item of items) {
        list.push({
          value: item.innerText,
        });
      }

      return list;
    });

    return pageData;
  };

  private _getTimeResult = (job: string, startTime: number): {} => {
    return {
      JOB: job,
      TIME: (Date.now() / 1000 - startTime).toFixed(2) + " segundos",
    };
  };
}

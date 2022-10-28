import { JSDOM } from "jsdom";
import { LogService } from "./LogService/LogService";
import { LogType } from "./LogService/LogTypeEnum";
const { window } = new JSDOM("<!doctype html><html><body></body></html>");
const puppeteer: any = require("puppeteer");

export class PuppeteerService {
  private _logService: LogService;

  constructor() {
    this._logService = new LogService();
  }

  public scrapAllCollectionsData = async () => {
    const url = "https://api-mainnet.magiceden.io/all_collections_with_escrow_data?edge_cache=true";
    const urlData = await this._scrapUrlAndGetData(url);
    let allCollectionsData = null;

    if (urlData?.collections !== undefined && urlData?.collections !== null && urlData?.collections.length > 0) {
      allCollectionsData = urlData.collections;
    }

    return allCollectionsData;
  }

  public scrapCollectionListDetailedData = async (symbolsList: string) => {
    const url = "https://api-mainnet.magiceden.io/rpc/getCollectionsWithSymbols?symbols=" + symbolsList + "&edge_cache%3Dtrue";
    const urlData = await this._scrapUrlAndGetData(url);
    let collectionsData = null;

    if (urlData !== undefined && urlData !== null && urlData.length > 0) {
      collectionsData = urlData;
    }

    return collectionsData;
  }

  public scrapCollectionUniqueHoldersAndSupplyData = async (symbols: string) => {
    const allSymbolsArray: string[] = symbols.split(",");
    const arrayOfScrapMethods: any = this._getArrayOfScrapHoldersDataMethods(allSymbolsArray);
    const [...urlDataResults] = (await Promise.all(arrayOfScrapMethods)).filter((a) => a);
    let collectionData: any = [];
    urlDataResults.forEach((urlData: any, index: number) => {
      if (urlData?.results !== undefined && urlData?.results !== null ) {
        urlData.results.symbol = allSymbolsArray[index];
        collectionData.push(urlData.results);
      }
    });

    return collectionData;
  }

  private _getArrayOfScrapHoldersDataMethods = (symbols: string[]): any => {
    const arrayOfScrapMethods: any = [];
    symbols.forEach(symbol => {
      const url: string = "https://api-mainnet.magiceden.io/rpc/getCollectionHolderStats/" + symbol;
      arrayOfScrapMethods.push(this._scrapUrlAndGetData(url));
    });

    return arrayOfScrapMethods;
  };


  private _scrapUrlAndGetData = async (url: string) => {
    let result: any = null;
    let browser: any;
    let pageStatus: any
    try {
      browser = await puppeteer.launch({headless: true, args: ["--no-sandbox"]});
      const page: any = await browser.newPage();
      await page.setDefaultNavigationTimeout(0);
      await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36");
      pageStatus = await page.goto(url, {waitUntil: "domcontentloaded"});
      pageStatus = pageStatus.status();
      if (pageStatus >= 200 && pageStatus <= 299) {
        await page.waitForFunction("window.document.getElementsByTagName('pre') && window.document.getElementsByTagName('pre').length > 0");
        result = await this._getPageData(page);
      } else {
        this._logService.log("Error PuppeteerService --> scrapUrlAndGetData. URL: " + url + ". ERROR: pageStatus: " + pageStatus, LogType.Error);
      }
      
      await browser.close();
    } 
    catch (error) {
      this._logService.log("Error PuppeteerService --> scrapUrlAndGetData. Page pageStatus: " + pageStatus + " URL: " + url + ". ERROR: " + error, LogType.Error);
      await browser.close();
    }

    return result;
  };

  private _getPageData = async (page: any) => {
    let pageData: any
    try {
      pageData = await page.evaluate(() => {
        return JSON.parse(window.document.getElementsByTagName("pre")[0].innerText);
      });
    } catch (error) {
      this._logService.log("Error PuppeteerService --> _getPageData. ERROR: " + error, LogType.Error);
    }

    return pageData;
  };
}

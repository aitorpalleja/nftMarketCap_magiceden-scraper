const puppeteer = require("puppeteer")

;(async () => {
    const browser = await puppeteer.launch({ headless: false })
    const page = await browser.newPage()
    await page.goto("https://magiceden.io/marketplace/rakkudos")

    await page.waitForSelector(".tw-text-white-1.tw-text-14px.tw-truncate");

    const data = await page.evaluate(() => {
      let items = document.getElementsByClassName("tw-text-white-1 tw-text-14px tw-truncate");

      const list = []
  
     for (const item of items) {
       list.push({
         value: item.innerText
       })
     }
  
      return list;
    })
  
    console.log(data)
    await browser.close()
  })()

  //class="tw-flex tw-flex-auto tw-items-center md:tw-items-start tw-flex-col md:tw-flex-row tw-px-4 sm:tw-pl-8 md:tw-pt-16 lg:tw-pl-10 2xl:tw-pl-12 tw-pb-8 md:tw-pb-24"

  //.tw-grid.tw-grid-cols-1.2xl:tw-grid-cols-2.tw-mt-5.md:tw-mt-0.md:tw-ml-6.lg:tw-ml-14.2xl:tw-ml-24
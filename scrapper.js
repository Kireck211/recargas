const puppeteer = require('puppeteer');
const retry = require('async-retry');

const numbers = require('./numbers.js').numbers;

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(
    'https://dataire.telcel.com:1447/VTAE_Web/ventaTae-form.action',
    { waitUntil: 'networkidle2' }
  );

  // Wait until password is filled
  await page.type('input#usuarioWeb', 'PDVQDAURN');
  await retry(
    async () => {
      const element = await page.$('input#login_contrasena');
      const text = await page.evaluate((element) => element.value, element);
      if (text.length !== 8) {
        throw new Error('Not filled yet');
      }
    },
    {
      retries: 5,
      minTimeout: 2000,
    }
  );

  await page.click('input#login_label_login');

  // Wait until token is filled
  const TOKEN_INPUT = '#solicitarToken_tokenUsuarioWeb';
  await page.waitForSelector(TOKEN_INPUT);
  await retry(
    async () => {
      const element = await page.$(TOKEN_INPUT);
      const text = await page.evaluate((element) => element.value, element);
      if (text.length !== 8) {
        throw new Error('Not filled yet');
      }
    },
    {
      retries: 5,
      minTimeout: 2000,
    }
  );
  await page.click('#solicitarToken_label_send_token');

  const TAE_SELL =
    '#menudrop > ul > li:nth-child(1) > ul > li:nth-child(4) > a';
  let number, messageSpan, text;
  for (let i = 0, numbersLength = numbers.length; i < numbersLength; i++) {
    await page.waitForSelector('#menudrop > ul > li:nth-child(1) > a');
    await page.hover('#menudrop > ul > li:nth-child(1) > a');
    await page.waitForSelector('#menudrop > ul > li:nth-child(1) > a');
    await page.click(TAE_SELL);
    number = numbers[i];
    try {
      await page.waitForSelector('#ventaTaeForm > span');
    } catch (err) {
      await page.waitForSelector('#menudrop > ul > li:nth-child(1) > a');
      await page.hover('#menudrop > ul > li:nth-child(1) > a');
      await page.waitForSelector('#menudrop > ul > li:nth-child(1) > a');
      await page.click(TAE_SELL);
    }
    await page.type('#ventaTaeForm_telefono', number);
    await page.type('#ventaTaeForm_telefono2', number);
    await page.type(
      '#ventaTaeForm > span > input.dojoComboBox.montosTAE',
      '10.0'
    );
    await page.click('#btsubmit');
    await page.waitForSelector('#messages > ul > li > span');
    messageSpan = await page.$('#messages > ul > li > span');
    text = await page.evaluate((element) => element.textContent, messageSpan);
    console.log(text);
  }
  await page.waitForSelector('#menudrop > ul > li:nth-child(6) > a');
  await page.click('#menudrop > ul > li:nth-child(6) > a');
  await browser.close();
})();

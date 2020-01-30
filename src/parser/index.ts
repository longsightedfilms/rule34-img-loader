import { parse } from 'node-html-parser';
import axios, { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const parserInstance = axios.create({
  method: 'get',
  baseURL: 'http://rule34.paheal.net',
  responseType: 'text'
})

const sleepRequest = (milliseconds: number, originalRequest: any) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(parserInstance(originalRequest)), milliseconds);
  });
};

parserInstance.interceptors.response.use(null, (error) => {
  if (error.config && error.response && error.response.status === 429) {
    console.log(
      '\x1b[36m',
      `[Info] - Too many requests, waiting 10 seconds timeout`
    );
    return sleepRequest(10000, error.config);
  } else {
    console.log(`HTTP ${error.response.status} - ${error.response.statusText}`);
    return Promise.reject(error);
  }
});

export class Parser {
  tag: string;

  axiosSettings: AxiosRequestConfig = {}

  currentPage: number = 1;
  lastPage: number = this.currentPage;

  imageLinks: string[] = [];

  outputFolder: string = '';

  constructor(tag: string, folder?: string, startPage?: string, lastPage?: string) {
    this.tag = tag;
    if (startPage !== undefined) {
      this.currentPage = Number(startPage);
    }
    if (lastPage !== undefined) {
      this.lastPage = Number(lastPage);
    }
    this.axiosSettings = {
      url: `/post/list/${this.tag}/${this.currentPage}`
    }
    this.prepareDownloadFolder(folder);
    console.log('\x1b[33m', `[Debug] - URL: ${this.axiosSettings.url}`);
  }

  /**
   * Creating folder for downloaded images
   * @param folder sets download folder to user folder
   */
  prepareDownloadFolder(folder?: string) {
    console.log('\x1b[36m', `[Info] - Preparing download folder`);
    const arr = this.tag.split('_');
    arr.forEach((element: string, index: number) => {
      arr[index] = element[0].toUpperCase() + element.substr(1);
    });
    const tagFolder = arr.join(' ');
    if(folder !== undefined) {
      this.outputFolder = path.normalize(`${folder}/${tagFolder}`);
    } else {
      this.outputFolder = path.normalize(`${__dirname}/../../output/${tagFolder}`);
    }

    if (!fs.existsSync(this.outputFolder)) {
      fs.mkdirSync(this.outputFolder, { recursive: true });
    }
    console.log('\x1b[36m', `[Info] - Download folder is ${this.outputFolder}`);
  }

  /**
   * Fetch image list page for future parsing
   */
  async parsePage() {
    console.log(
      '\x1b[32m',
      `[Parsing index (${this.currentPage}/${this.lastPage})] - Fetching images list page`
    );
    return parserInstance(this.axiosSettings)
      .then((response: AxiosResponse) => response.data)
  }

  /**
   * Parses image list page and counts total page count
   */
  async getPagesCount() {
    console.log('\x1b[32m', `[Parsing] - Fetching total pages count`);
    return parserInstance(this.axiosSettings).then((response: AxiosResponse) => {
      const root = parse(response.data) as any;
      const paginator = root.querySelector('#paginator').querySelectorAll('a');
      paginator.forEach((link: any) => {
        if (link.innerHTML === 'Last') {
          const { href } = link.attributes;
          const position = href.lastIndexOf('/')
          this.lastPage = href.substr(position + 1);
        }
      })
      console.log('\x1b[32m', `[Parsing] - Total pages count: ${this.lastPage}`);
    }).catch((err: AxiosError) => {
      if (err.response.status === 404) {
        console.log('\x1b[31m', `[Error] - Images not found, try another tag`);
        process.exit()
      } else {
        console.log('\x1b[31m', `[Error] - HTTP ${err.response.status} - ${err.response.statusText}`);
        process.exit()
      }
    })
  }

  /**
   * Parses image list page for full image links
   * @param html image list page
   */
  getImageLinks(html: string) {
    const root = parse(html) as any;
    const imgList = root.querySelector('#image-list').querySelectorAll('div.shm-thumb.thumb a');
    imgList.forEach((element: any) => {
      if (element.innerHTML === 'Image Only'
      && this.imageLinks.includes(element.attributes.href) === false) {
        this.imageLinks.push(element.attributes.href);
      }
    });
  }
  /**
   * Starts parsing
   */
  async initParsing() {
    const startTime = new Date();
    console.log('\x1b[36m', `[Info] - Parsing site with tag "${this.tag}"`);
    if (this.lastPage !== this.currentPage) {
      console.log('\x1b[36m', `[Info] - Limited range (from ${this.currentPage} to ${this.lastPage})`);
    } else {
      await this.getPagesCount();
    }
    while(this.currentPage <= this.lastPage) {
      const html = await this.parsePage();
      this.getImageLinks(html);
      this.currentPage++;
      this.axiosSettings = {
        url: `/post/list/${this.tag}/${this.currentPage}`
      }
    }

    let index = 1;
    for (const image of this.imageLinks) {
      await this.downloadImage(image, index);
      index++;
    }
    const endTime = new Date();
    const time = endTime.getTime() - startTime.getTime()
    console.log('\x1b[36m', `[Info] - Downloading ${this.imageLinks.length} images completed in ${time / 1000} seconds"`);

    console.log('\x1b[0m', 'Press any key to exit');
    process.stdin.once('data', process.exit.bind(process, 0));
  }

  /**
   * Download image to local disk
   * @param link image URL
   * @param index uses for console logging
   */
  async downloadImage(link: string, index: number) {
    // URL Decode and replace non-digits to empty symbols because of 255 chars limit in NTFS
    let imgName = decodeURI(link.match(/(?!.+\/)[^\/]+/)[0]);
    const imgExtension = path.extname(imgName);
    imgName = imgName.replace(/\_/g, ' ');
    imgName = imgName.replace(/[^0-9]+/g, '') + imgExtension;

    const imgPath = path.normalize(`${this.outputFolder}/${imgName}`);
    console.log('\x1b[34m', `[Download (${index} of ${this.imageLinks.length})] - ${imgName}`);

    const writer = fs.createWriteStream(imgPath);
    const response = await axios({
      method: 'get',
      url: link,
      responseType: 'stream',
    });
    // Write axios stream to local disk
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    })
  }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const node_html_parser_1 = require("node-html-parser");
const axios_1 = require("axios");
const fs = require("fs");
const path = require("path");
const parserInstance = axios_1.default.create({
    method: 'get',
    baseURL: 'http://rule34.paheal.net',
    responseType: 'text'
});
const sleepRequest = (milliseconds, originalRequest) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(parserInstance(originalRequest)), milliseconds);
    });
};
parserInstance.interceptors.response.use(null, (error) => {
    if (error.config && error.response && error.response.status === 429) {
        console.log('\x1b[36m', `[Info] - Too many requests, waiting 10 seconds timeout`);
        return sleepRequest(10000, error.config);
    }
    else {
        console.log(`HTTP ${error.response.status} - ${error.response.statusText}`);
        return Promise.reject(error);
    }
});
class Parser {
    constructor(tag, folder, startPage, lastPage) {
        this.axiosSettings = {};
        this.currentPage = 1;
        this.lastPage = this.currentPage;
        this.imageLinks = [];
        this.outputFolder = '';
        this.tag = tag;
        if (startPage !== undefined) {
            this.currentPage = Number(startPage);
        }
        if (lastPage !== undefined) {
            this.lastPage = Number(lastPage);
        }
        this.axiosSettings = {
            url: `/post/list/${this.tag}/${this.currentPage}`
        };
        this.prepareDownloadFolder(folder);
        console.log('\x1b[33m', `[Debug] - URL: ${this.axiosSettings.url}`);
    }
    prepareDownloadFolder(folder) {
        console.log('\x1b[36m', `[Info] - Preparing download folder`);
        const arr = this.tag.split('_');
        arr.forEach((element, index) => {
            arr[index] = element[0].toUpperCase() + element.substr(1);
        });
        const tagFolder = arr.join(' ');
        if (folder !== undefined) {
            this.outputFolder = path.normalize(`${folder}/${tagFolder}`);
        }
        else {
            this.outputFolder = path.normalize(`${__dirname}/../../output/${tagFolder}`);
        }
        if (!fs.existsSync(this.outputFolder)) {
            fs.mkdirSync(this.outputFolder, { recursive: true });
        }
        console.log('\x1b[36m', `[Info] - Download folder is ${this.outputFolder}`);
    }
    parsePage() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            console.log('\x1b[32m', `[Parsing index (${this.currentPage}/${this.lastPage})] - Fetching images list page`);
            return parserInstance(this.axiosSettings)
                .then((response) => response.data);
        });
    }
    getPagesCount() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            console.log('\x1b[32m', `[Parsing] - Fetching total pages count`);
            return parserInstance(this.axiosSettings).then((response) => {
                const root = node_html_parser_1.parse(response.data);
                const paginator = root.querySelector('#paginator').querySelectorAll('a');
                paginator.forEach((link) => {
                    if (link.innerHTML === 'Last') {
                        const { href } = link.attributes;
                        const position = href.lastIndexOf('/');
                        this.lastPage = href.substr(position + 1);
                    }
                });
                console.log('\x1b[32m', `[Parsing] - Total pages count: ${this.lastPage}`);
            }).catch((err) => {
                if (err.response.status === 404) {
                    console.log('\x1b[31m', `[Error] - Images not found, try another tag`);
                    process.exit();
                }
                else {
                    console.log('\x1b[31m', `[Error] - HTTP ${err.response.status} - ${err.response.statusText}`);
                    process.exit();
                }
            });
        });
    }
    getImageLinks(html) {
        const root = node_html_parser_1.parse(html);
        const imgList = root.querySelector('#image-list').querySelectorAll('div.shm-thumb.thumb a');
        imgList.forEach((element) => {
            if (element.innerHTML === 'Image Only'
                && this.imageLinks.includes(element.attributes.href) === false) {
                this.imageLinks.push(element.attributes.href);
            }
        });
    }
    initParsing() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const startTime = new Date();
            console.log('\x1b[36m', `[Info] - Parsing site with tag "${this.tag}"`);
            if (this.lastPage !== 1) {
                console.log('\x1b[36m', `[Info] - Limited range (from ${this.currentPage} to ${this.lastPage})`);
            }
            else {
                yield this.getPagesCount();
            }
            while (this.currentPage <= this.lastPage) {
                const html = yield this.parsePage();
                this.getImageLinks(html);
                this.currentPage++;
                this.axiosSettings = {
                    url: `/post/list/${this.tag}/${this.currentPage}`
                };
            }
            let index = 1;
            for (const image of this.imageLinks) {
                yield this.downloadImage(image, index);
                index++;
            }
            const endTime = new Date();
            const time = endTime.getTime() - startTime.getTime();
            console.log('\x1b[36m', `[Info] - Downloading ${this.imageLinks.length} images completed in ${time / 1000} seconds"`);
            console.log('\x1b[0m', 'Press any key to exit');
            process.stdin.once('data', process.exit.bind(process, 0));
        });
    }
    downloadImage(link, index) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let imgName = decodeURI(link.match(/(?!.+\/)[^\/]+/)[0]);
            const imgExtension = path.extname(imgName);
            imgName = imgName.replace(/\_/g, ' ');
            imgName = imgName.replace(/[^0-9]+/g, '') + imgExtension;
            const imgPath = path.normalize(`${this.outputFolder}/${imgName}`);
            console.log('\x1b[34m', `[Download (${index} of ${this.imageLinks.length})] - ${imgName}`);
            const writer = fs.createWriteStream(imgPath);
            const response = yield axios_1.default({
                method: 'get',
                url: link,
                responseType: 'stream',
            });
            response.data.pipe(writer);
            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        });
    }
}
exports.Parser = Parser;

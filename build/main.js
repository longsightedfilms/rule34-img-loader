"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parser_1 = require("./parser");
const args = process.argv;
let tag = undefined;
let folder = undefined;
let startPage = undefined;
let endPage = undefined;
for (let index = 1; index < args.length; index++) {
    const arg = args[index];
    if (arg.includes('tag=')) {
        tag = arg.replace('tag=', '');
    }
    if (arg.includes('output=')) {
        folder = arg.replace('output=', '');
    }
    if (arg.includes('start=')) {
        startPage = arg.replace('start=', '');
    }
    if (arg.includes('end=')) {
        endPage = arg.replace('end=', '');
    }
}
if (tag === undefined) {
    console.log('\x1b[31m', '[Error] - You need to set tag in arguments');
    process.exit();
}
console.log(tag);
console.log(folder);
console.log(startPage);
console.log(endPage);
const parser = new parser_1.Parser(tag, folder, startPage, endPage);
parser.initParsing();

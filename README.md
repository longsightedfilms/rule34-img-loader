# Rule 34 image downloader
Downloads images from "rule34.paheal.net". Written on typescript and nodejs

## Requirements
Node.js

## Install
Download zip-archive with repo, go into folder and in terminal write:
```bash
npm install
```

## Usage
After installation write in terminal:
```bash
npm run start tag=needed_tag
```

Images will be downloaded (by default) in "./output/Tag Folder". Because of 255 chars limit in NTFS and other file systems, image names strips to numeric ID.

## CMD arguments
**tag=** - required, uses for parsing needed images, written in snake_case

**output=** - optional, sets root download folder for images, by default it sets to "./output"

## Download speed
Because site uses only 1 thread for download, maximum speed limited by 5Mbit/s. You can run several instances with different tags for speed improvement.

Example of multi-tag download:
```bat
start cmd /c npm run start tag=skyrim output="D:\Games\Rule 34"
start cmd /c npm run start tag=world_of_warcraft output="D:\Games\Rule 34"
start cmd /c npm run start tag=warcraft output="D:\Games\Rule 34"
start cmd /c npm run start tag=league_of_legends output="D:\Games\Rule 34"
start cmd /c npm run start tag=dota_2 output="D:\Games\Rule 34"
start cmd /c npm run start tag=overwatch output="D:\Games\Rule 34"
start cmd /c npm run start tag=diablo output="D:\Games\Rule 34"
start cmd /c npm run start tag=diablo_(series) output="D:\Games\Rule 34"
```

## Notes
Your ISP may blocking rule34 site, use VPN.
# Contributing

Thanks for helping improve GumShelf. Use fictional data in examples, screenshots, tests and issue reports.

## Development

Install Node.js and npm, clone the repository, then run npm install, npm start and npm test from the project folder. npm run package creates a Windows directory build; its configuration expects an external workbook, so check its availability and redistribution rights first. Load the browser helper unpacked from extension/ in Chrome or Edge; follow extension/SETUP.txt.

Keep changes focused and add meaningful tests for behavior. Some renderer files are dense: keep presentation in CSS where practical and avoid unrelated rewrites. Preserve accessibility, private data boundaries and third-party notices.

## Propose a store connector

Open a feature request describing the store, user problem, access method, privacy and permissions, and relevant terms or access restrictions. Explain what it would read and store, how users control it, and how it handles errors and page changes. Do not include credentials, private library content or purchased files. Discuss the approach before a large implementation.

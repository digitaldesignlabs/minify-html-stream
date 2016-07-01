[![Build Status](https://travis-ci.org/digitaldesignlabs/minify-html-stream.svg?branch=master)](https://travis-ci.org/digitaldesignlabs/minify-html-stream)
[![Coverage Status](https://coveralls.io/repos/github/digitaldesignlabs/minify-html-stream/badge.svg?branch=master)](https://coveralls.io/github/digitaldesignlabs/minify-html-stream)

# Minify HTML Stream

Strips whitespace from an HTML stream to reduce the size of the final payload.

## Install

Install with [npm](https://www.npmjs.com/package/minify-html-stream)

```bash
npm install --save minify-html-stream
```

## Simple Example

```js
"use strict";

const fetch = require("node-fetch");
const Minifier = require("minify-html-stream").Minifier;

fetch("http://example.com/").then(function (response) {
    response.body.pipe(new Minifier()).pipe(process.stdout);
}).catch(function (err) {
    console.error("Yikes!", err);
});
```

## How You Might Use It
```js
"use strict";

// Declare variables
const http = require("http");
const talisman = require("talismanjs");
const Minifier = require("minify-html-stream").Minifier;

// Start a server
const server = http.createServer(function (request, response) {
    talisman.create("homepage.html").then(function (view) {
        view.toStream().pipe(new Minifier()).pipe(response);
    }).catch(function (error) {
        response.writeHead(500);
        response.write(error.message);
        response.end();
    });
});

// Start listening
server.listen(8000);
```

## Configuration
```js
{
    stripCarriageReturns: true, // remove carriage return characters (\r)
    trimLines: true, // remove whitespace from the ends of lines
    trimElements: true, // remove whitespace from around elements where it is safe
    normalizeWhiteSpace: true, // normalize multiple whitespace characters to single characters
    stripComments: true // remove HTML comments (except conditional comments)
}
```

## Notes
Minify HTML Stream is really naïve and conservative about how it goes about minification, because it sort of has to be. Pull requests are most welcome.

Published under the [MIT License](http://opensource.org/licenses/MIT).

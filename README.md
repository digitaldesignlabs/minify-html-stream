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
const Minifier = require("minify-html-stream");

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
const Minifier = require("minify-html-stream");

// Start a server
const server = http.createServer(function (request, response) {
    const myContentStream = generateHTMLContentStreamSomehow(request);
    myContentStream.pipe(new Minifier()).pipe(response);
});

// Start listening
server.listen(8000);
```

# Configuration
```js
{
   stripComments: true, // remove HTML comments (except conditional comments). Default: true
   stripBetweenAttributes: true // remove spaces within attributes. Default: true
}
```

# Notes
Minify HTML Stream is really naïve and conservative about how it goes about minification, because it sort of has to be. Pull requests are most welcome.

Published under the [MIT License](http://opensource.org/licenses/MIT).

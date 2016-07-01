/* eslint no-underscore-dangle: 0 */

"use strict";

const test = require("tape");
const Minifier = require("../lib/minify").Minifier;
const ReadableStream = require("stream").Readable;

class Source extends ReadableStream {

    constructor(content) {
        super();
        this.content = content;
    }

    _read(bytes) {
        if (this.content.length === 0) {
            return this.push(null);
        }
        this.push(this.content.slice(0, bytes));
        this.content = this.content.slice(bytes);
    }
}

function stream(content) {
    return new Source(content);
}

// Tests begin

test("make html smaller", assert => {

    const before = "<div>\n    <span>Text</span>\n</div>\n";

    let after = "";
    stream(before)
        .pipe(new Minifier())
        .on("data", chunk => {
            after += chunk;
        })
        .on("end", () => {
            assert.equal(after.length < before.length, true);
            assert.end();
        });
});

test("strips comments (on)", assert => {

    let content = "";
    stream("before<!-- comment -->after")
        .pipe(new Minifier())
        .on("data", chunk => {
            content += chunk;
        })
        .on("end", () => {
            assert.equal("beforeafter", content);
            assert.end();
        });
});

test("strips comments (off)", assert => {

    let content = "";
    stream("before<!-- comment -->after")
        .pipe(new Minifier({stripComments: false}))
        .on("data", chunk => {
            content += chunk;
        })
        .on("end", () => {
            assert.equal("before<!-- comment -->after", content);
            assert.end();
        });
});

test("leave conditional comments", assert => {

    let content = "";
    stream("before<!--[if IE]>for ie only<![endif]-->after")
        .pipe(new Minifier())
        .on("data", chunk => {
            content += chunk;
        })
        .on("end", () => {
            assert.equal("before<!--[if IE]>for ie only<![endif]-->after", content);
            assert.end();
        });
});

test("do not touch pre tags", assert => {

    let content = "";
    stream("before<pre>foo\nbar\nbaz\n</pre>after")
        .pipe(new Minifier())
        .on("data", chunk => {
            content += chunk;
        })
        .on("end", () => {
            assert.equal("before<pre>foo\nbar\nbaz\n</pre>after", content);
            assert.end();
        });
});

test("do not touch script tags", assert => {

    let content = "";
    stream("before<script>foo\nbar\nbaz\n</script>after")
        .pipe(new Minifier())
        .on("data", chunk => {
            content += chunk;
        })
        .on("end", () => {
            assert.equal("before<script>foo\nbar\nbaz\n</script>after", content);
            assert.end();
        });
});

test("do not touch style tags", assert => {

    let content = "";
    stream("before<style>foo\nbar\nbaz\n</style>after")
        .pipe(new Minifier())
        .on("data", chunk => {
            content += chunk;
        })
        .on("end", () => {
            assert.equal("before<style>foo\nbar\nbaz\n</style>after", content);
            assert.end();
        });
});

test("do not touch textarea tags", assert => {

    let content = "";
    stream("before<textarea>foo\nbar\nbaz\n</textarea>after")
        .pipe(new Minifier())
        .on("data", chunk => {
            content += chunk;
        })
        .on("end", () => {
            assert.equal("before<textarea>foo\nbar\nbaz\n</textarea>after", content);
            assert.end();
        });
});

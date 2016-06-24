/* eslint no-underscore-dangle: 0 */

"use strict";

const test = require("tape");
const Minifier = require("../lib/minify").Minifier;

const Readable = require("stream").Readable;
const inherits = require("util").inherits;

function Source(content) {
    Readable.call(this);
    this.content = content;
}

inherits(Source, Readable);

Source.prototype._read = function (bytes) {

    if (this.content.length === 0) {
        return this.push(null);
    }

    this.push(this.content.slice(0, bytes));
    this.content = this.content.slice(bytes);
};

// Tests begin

test("make html smaller", assert => {

    const before = "<div>\n    <span>Text</span>\n</div>\n";

    let after = "";
    new Source(before)
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
    new Source("before<!-- comment -->after")
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
    new Source("before<!-- comment -->after")
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
    new Source("before<!--[if IE]>for ie only<![endif]-->after")
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
    new Source("before<pre>foo\nbar\nbaz\n</pre>after")
        .pipe(new Minifier())
        .on("data", chunk => {
            content += chunk;
        })
        .on("end", () => {
            assert.equal("before<pre>foo\nbar\nbaz\n</pre> after", content);
            assert.end();
        });
});

test("do not touch script tags", assert => {

    let content = "";
    new Source("before<script>foo\nbar\nbaz\n</script>after")
        .pipe(new Minifier())
        .on("data", chunk => {
            content += chunk;
        })
        .on("end", () => {
            assert.equal("before<script>foo\nbar\nbaz\n</script> after", content);
            assert.end();
        });
});

test("do not touch style tags", assert => {

    let content = "";
    new Source("before<style>foo\nbar\nbaz\n</style>after")
        .pipe(new Minifier())
        .on("data", chunk => {
            content += chunk;
        })
        .on("end", () => {
            assert.equal("before<style>foo\nbar\nbaz\n</style> after", content);
            assert.end();
        });
});

test("do not touch textarea tags", assert => {

    let content = "";
    new Source("before<textarea>foo\nbar\nbaz\n</textarea>after")
        .pipe(new Minifier())
        .on("data", chunk => {
            content += chunk;
        })
        .on("end", () => {
            assert.equal("before<textarea>foo\nbar\nbaz\n</textarea> after", content);
            assert.end();
        });
});

test("strip space between attributes", assert => {

    const before = "<img   src=\"image.png\"  width=\"50\"   height=\"50\">";

    let content = "";
    new Source(before)
        .pipe(new Minifier())
        .on("data", chunk => {
            content += chunk;
        })
        .on("end", () => {
            assert.equal(content, "<img src=\"image.png\" width=\"50\" height=\"50\"> ");
            assert.end();
        });
});


/**
 * Minifier
 *
 * Naïve minifier for stripping spurious whitespace from an HTML stream.
 *
 * @author Mike Hall
 * @copyright Digital Design Labs
 * @license MIT
 */

"use strict";

// This needs to extend the node Transform stream
const TransformStream = require("stream").Transform;
class Minifier extends TransformStream {

    /**
     * constructor()
     * @constructor
     */
    constructor(options) {

        super();

        // It is safe, we think, to trim the whitespace around these elements, as they are either block-level elements
        // by default, or they are elements which do no render on the screen, e.g. <meta>
        const safeToTrim = [
            "address", "area", "article", "aside", "base", "basefont", "blockquote", "body", "canvas", "caption",
            "center", "cite", "col", "colgroup", "dd", "dir", "div", "dl", "dt", "fieldset", "figcaption", "figure",
            "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "legend",
            "li", "link", "main", "map", "menu", "meta", "nav", "noscript", "ol", "optgroup", "option", "output",
            "p", "picture", "pre", "script", "section", "source", "table", "tbody", "td", "tfoot", "th", "thead",
            "title", "tr", "ul", "video"
        ];

        // Generate a regular expression from the tag list above
        this.trimWhiteSpaceRegex = new RegExp("\\s+(<\\/?(?:" + safeToTrim.join("|") + ")\\b[^>]*>)", "ig");

        // Some elements require their content to be protected from minification, such
        // as <pre>, <script>, etc. These variables are used keep track of that content.
        this.counter = 0;
        this.placeholders = new Map();
        this.protectedElements = new Map();
        this.protectedElementStartTag = new Map();

        // Some protected elements may not be complete within this chunk. If they are not
        // then we send as much as we can and keep the rest for the next loop. This variable is used for that.
        this.leftovers = "";

        // We protect HTML comments, because we either want to replace them with empty strings, or we want to
        // keep them if they're conditional comments. We can make that decision later, though.
        this.protectedElements.set("<!--", /<!--([\s\S]*?)-->/g);
        this.protectedElementStartTag.set("<!--", /<!--/);

        // These are the variables whose content we are going to protect
        const untouchable = ["script", "style", "textarea", "pre"];
        untouchable.forEach(name => {
            this.protectedElements.set(name, new RegExp(`\\s*(<${name}\\b[^>]*?>)([\\s\\S]*?)<\\/${name}>\\s*`, "ig"));
            this.protectedElementStartTag.set(name, new RegExp(`<${name}\\b[^>]*?>`, "i"));
        });

        // Configure the settings for this instance
        const defaults = {
            stripCarriageReturns: true,
            trimLines: true,
            trimElements: true,
            normalizeWhiteSpace: true,
            stripComments: true
        };

        this.settings = Object.assign({}, defaults, options);
    }

    /**
     * stripCarriageReturns()
     *
     * Removes any carriage return characters in the string
     *
     * @access private
     * @param {string} s
     * @return {string}
     */
    stripCarriageReturns(s) {
        if (this.settings.stripCarriageReturns) {
            return s.replace(/\r/g, "");
        }
        return s;
    }

    /**
     * trimLines()
     *
     * Removes whitepace from the start and the end of each line of this string
     *
     * @access private
     * @param {string} s
     * @return {string}
     */
    trimLines(s) {
        if (this.settings.trimLines) {
            return s.replace(/^\s+|\s+$/mg, "");
        }
        return s;
    }

    /**
     * trimWhiteSpaceAroundSafeElements()
     *
     * Removes any whitespace from around block and undisplayed elements.
     *
     * @access private
     * @param {string} s
     * @return {string}
     */
    trimWhiteSpaceAroundSafeElements(s) {
        if (this.settings.trimElements) {
            return s.replace(this.trimWhiteSpaceRegex, "$1");
        }
        return s;
    }

    /**
     * normalizeWhitespaceAroundElements()
     *
     * Normalizes multiple whitespace between elements to a single whitespace
     *
     * @access private
     * @param {string} s
     * @return {string}
     */
    normalizeWhitespaceAroundElements(s) {
        if (this.settings.normalizeWhiteSpace) {
            return s.replace(/>([^<]+)</g, (ignore, gap) => {
                gap = gap.replace(/^\s+|\s+$/g, " ");
                return `>${gap}<`;
            });
        }
        return s;
    }

    /**
     * preserve()
     *
     * Keeps the chosen content to one side and returns the name its preserved under
     *
     * @access private
     * @param {string} content
     * @return {string} - the name of the preservation
     */
    preserve(content, type) {

        // Only preserve IE conditional comments, unless we are saving all comments
        if (type === "<!--" && this.settings.stripComments === true) {
            if (content.startsWith("[") === false && content.includes("<![") === false) {
                content = "";
            }
        }

        const name = `%%-----placeholder-${this.counter}-----%%`;
        this.placeholders.set(name, content);
        this.counter += 1;
        return name;
    }

    /**
     * restore()
     *
     * Restores preseved content to its proper place and returns the restored chunk
     *
     * @access private
     * @param {string} chunk
     * @return {string}
     */
    restore(chunk) {

        // Iterate over all everything we have preserved. For each entry
        // we try to replace within this chunk. Where we succeed, we also
        // delete the entry so we don't have to iterate over keys we have used.
        for (let label of this.placeholders.keys()) {
            chunk = chunk.replace(label, () => {
                const replacement = this.placeholders.get(label);
                this.placeholders.delete(label);
                return replacement;
            });
        }

        return chunk;
    }

    /**
     * _transform()
     *
     * Called for each chunk in the stream
     *
     * @param {Buffer|string} chunk
     * @param {number} offset (ignored)
     * @param {function} next - Call when we're done
     */
    _transform(chunk, offset, next) {

        // Convert the buffer to a string
        if (Buffer.isBuffer(chunk) === true) {
            chunk = chunk.toString("utf8");
        }

        // Remove any carriage return characters and prepend content
        // from the last chunk, if there is any left over.
        chunk = this.leftovers + this.stripCarriageReturns(chunk);
        this.leftovers = "";

        // Protect content which may have semantic whitespace
        this.protectedElements.forEach((regex, name) => {
            chunk = chunk.replace(regex, (element, startTag, content) => {
                if (name === "<!--") {
                    return this.preserve(element, name);
                }
                return this.preserve(`${startTag}${content}</${name}>`, name);
            });
        });

        // Look for any remaining proected elements in the chunk
        const protectedElementIndicies = [];
        this.protectedElementStartTag.forEach(regex => {
            const match = chunk.match(regex);
            if (match !== null) {
                protectedElementIndicies.push(match.index);
            }
        });

        // Only work with the data we know to be safe. Keep the rest for the next loop
        const safeDataOffset = Math.min.apply(undefined, protectedElementIndicies);
        this.leftovers = chunk.slice(safeDataOffset);
        chunk = chunk.slice(0, safeDataOffset);

        // Trim whitespace from each line
        chunk = this.trimLines(chunk);

        // Remove whitespace from block elements and undisplayed elements
        chunk = this.trimWhiteSpaceAroundSafeElements(chunk);

        // Normalize whitespace around other elements
        chunk = this.normalizeWhitespaceAroundElements(chunk);

        // Push what we can
        next(undefined, this.restore(chunk));
    }

    /**
     * _flush()
     *
     * Called at the end of the stream, to flush any remaining data. We also reset here.
     *
     * @access protected
     * @return {undefined}
     */
    _flush(done) {

        // Flush any remaining leftovers
        if (this.leftovers.length > 0) {
            this.push(this.restore(this.leftovers));
        }

        // Reset our state
        this.leftovers = "";
        this.counter = 0;
        this.placeholders = new Map();

        done();
    }
}

// Export the public API
module.exports.Minifier = Minifier;

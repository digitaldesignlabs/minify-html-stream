
/**
 * Minifier
 * Naïve minifier for stripping spurious whitespace from an HTML stream
 * @copyright Digital Design Labs
 * @license MIT
 */

"use strict";

// This needs to extend the node Transform stream
const TransformStream = require("stream").Transform;

// ES6 classes FTW
class Minifier extends TransformStream {

    /**
     * constructor()
     * @constructor
     * @param {object} options - configuration object
     * @param {bool} options.stripComments - Should we strip comments?
     * @param {bool} options.stripBetweenAttributes - Should we strip spaces from between attributes?
     */
    constructor(options) {

        super();

        // Default settings
        const defaults = {
            stripComments: true,
            stripBetweenAttributes: true
        };

        // Store settings for access later
        this.settings = Object.assign({}, options, defaults);
    }

    /**
     * _transform()
     * Called for each chunk in the stream
     * @param {Buffer} chunk
     * @param ignored
     * @param {function} next - Call when we're done
     */
    _transform(chunk, ignore, next) {

        // Detecting HTML comments
        const commentRegex = /<\!--[\s\S]+?--\>/gm;

        // Detecting HTML elements
        const elementRegex = /<(\/?[a-z][^>]*)>[\r\n\s]+/gm;

        chunk = chunk.toString("utf8")

            // Strip HTML comments
            .replace(commentRegex, (original) => {

                // Don't do this if the user has asked us not to
                if (!this.settings.stripComments) {
                    return original;
                }

                // Leave conditional comments
                if (original.toLowerCase().startsWith("<!--[if")) {
                    return original;
                }

                // Strip everything else
                return "";
            })

            // Remove whitespace around tags
            .replace(elementRegex, (original, element) => {

                // The name of the element is either the entire element, or the portion
                // up until the first space character
                let elementName = element.toLowerCase();
                if (elementName.includes(" ")) {
                    elementName = elementName.substr(0, elementName.indexOf(" "));
                }

                // Elements with these names, we will not modify the content of
                const untouchables = ["script", "style", "pre", "textarea"];
                if (untouchables.indexOf(elementName) >= 0) {
                    return original;
                }

                // Normalize spaces between attributes inside the markup a single space
                // if the user has asked us to do that for them
                if (this.settings.stripBetweenAttributes) {
                    element = element.replace(/\s+/g, " ");
                }

                // Normalize any spaces after the element to one single space
                return `<${element}> `;
            });

        // Push the minified chunk onto the stream
        this.push(chunk);

        // Ready for the next run
        next();
    }
}

// Export the public API
module.exports = Minifier;

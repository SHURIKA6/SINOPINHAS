import xss from 'xss';

/**
 * Sanitizes a string removing malicious HTML/Script tags.
 * @param {string} text - The input text
 * @returns {string} - The sanitized text
 */
export const sanitize = (text) => {
    if (typeof text !== 'string') return text;
    return xss(text, {
        whiteList: {}, // No HTML tags allowed by default
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script', 'style']
    });
};

import xss from 'xss';

/**
 * Sanitizes a string removing malicious HTML/Script tags.
 */
export const sanitize = (text: unknown): unknown => {
    if (typeof text !== 'string') return text;
    return xss(text, {
        whiteList: {}, // No HTML tags allowed by default
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script', 'style']
    });
};

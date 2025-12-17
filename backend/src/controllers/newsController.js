import { XMLParser } from 'fast-xml-parser';
import { createResponse, createErrorResponse } from '../utils/api-utils.js';

const RSS_URL = 'https://www.sonoticias.com.br/feed/';
const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
});

export const getNews = async (c) => {
    try {
        const cache = caches.default;
        const cacheKey = new Request(c.req.url, { method: 'GET' });

        // Try to get from Cache (Cloudflare Workers Cache API)
        let response = await cache.match(cacheKey);
        if (response) {
            console.log("📰 Notícias servidas do Cache");
            return response;
        }

        console.log("📰 Buscando notícias do RSS...");
        const rssResponse = await fetch(RSS_URL, {
            headers: { 'User-Agent': 'Sinopinhas-Bot/1.0 (Cloudflare Worker)' }
        });

        if (!rssResponse.ok) {
            throw new Error(`Falha ao buscar RSS: ${rssResponse.status}`);
        }

        const xmlText = await rssResponse.text();
        const feed = parser.parse(xmlText);

        const items = feed.rss?.channel?.item || [];

        // Formatar notícias
        const news = items.slice(0, 15).map(item => {
            // Tentar extrair imagem (do content:encoded ou description ou enclosure)
            let image = null;
            if (item['media:content'] && item['media:content']['@_url']) {
                image = item['media:content']['@_url'];
            } else if (item.enclosure && item.enclosure['@_url']) {
                image = item.enclosure['@_url'];
            } else {
                // Tenta achar img tag no content/description
                const content = item['content:encoded'] || item.description || '';
                const imgMatch = content.match(/src="([^"]+)"/);
                if (imgMatch) image = imgMatch[1];
            }

            // Limpar descrição (remover HTML)
            let description = item.description || '';
            description = description.replace(/<[^>]*>?/gm, ''); // Strip HTML
            description = description.substring(0, 150) + '...';

            // Fallback Image (Inline SVG to avoid 404s)
            const fallbackImage = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22180%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20180%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22300%22%20height%3D%22180%22%20fill%3D%22%23252525%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23666666%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%3ES%C3%B3%20Not%C3%ADcias%3C%2Ftext%3E%3C%2Fsvg%3E';

            return {
                title: item.title,
                link: item.link,
                pubDate: item.pubDate,
                description: description,
                image: image || fallbackImage,
                source: 'Só Notícias'
            };
        });

        const jsonResponse = createResponse(c, news);

        // Configurar Cache (15 minutos)
        jsonResponse.headers.set('Cache-Control', 'public, max-age=900, s-maxage=900');
        c.executionCtx.waitUntil(cache.put(cacheKey, jsonResponse.clone()));

        return jsonResponse;

    } catch (err) {
        console.error("❌ Erro ao buscar notícias:", err);
        return createErrorResponse(c, "FETCH_ERROR", "Não foi possível carregar as notícias", 500);
    }
};

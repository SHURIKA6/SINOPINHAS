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

            return {
                title: item.title,
                link: item.link,
                pubDate: item.pubDate,
                description: description,
                image: image || '/placeholder-news.jpg', // Fallback
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

import { createResponse, createErrorResponse } from '../utils/api-utils.js';

export const getWeather = async (c) => {
    const env = c.env;
    const cacheKey = 'weather_data_sinop_v2';

    try {
        // 1. Tentar Cache
        if (env.MURAL_STORE) {
            try {
                const cached = await env.MURAL_STORE.get(cacheKey);
                if (cached) return createResponse(c, JSON.parse(cached));
            } catch (e) { console.error("KV Read Error:", e); }
        }

        // 2. Buscar HG Brasil
        // WOEID 455928 = Sinop, MT
        const hgUrl = `https://api.hgbrasil.com/weather?woeid=455928`;
        const res = await fetch(hgUrl, {
            headers: { 'User-Agent': 'Sinopinhas-App/1.0' }
        });

        if (!res.ok) throw new Error(`HG Brasil HTTP error! status: ${res.status}`);

        const data = await res.json();
        if (!data || !data.results) throw new Error("HG Brasil returned invalid data structure");

        const weather = data.results;

        // 3. Salvar no Cache (30 min)
        if (env.MURAL_STORE) {
            try {
                await env.MURAL_STORE.put(cacheKey, JSON.stringify(weather), { expirationTtl: 1800 });
            } catch (e) { console.error("KV Write Error:", e); }
        }

        return createResponse(c, weather);

    } catch (err) {
        console.error("Weather Primary Source Error:", err.message);

        // 4. Fallback (Open-Meteo)
        try {
            const fallbackRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-11.8641&longitude=-55.5031&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m&daily=sunrise,sunset,uv_index_max&wind_speed_unit=kmh&timezone=America%2FCuiaba');
            const fbData = await fallbackRes.json();

            const fallback = {
                temp: Math.round(fbData.current.temperature_2m),
                description: "Céu Limpo",
                currently: "dia",
                humidity: fbData.current.relative_humidity_2m,
                wind_speedy: `${fbData.current.wind_speed_10m} km/h`,
                sunrise: fbData.daily.sunrise[0].split('T')[1].toLowerCase() + " am",
                sunset: fbData.daily.sunset[0].split('T')[1].toLowerCase() + " pm",
                moon_phase: "N/A",
                date: new Date().toLocaleDateString('pt-BR'),
                time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                source: 'open-meteo'
            };
            return createResponse(c, fallback);
        } catch (f) {
            console.error("Weather Fallback Error:", f.message);
            return createErrorResponse(c, "WEATHER_OFFLINE", "Serviços de clima indisponíveis no momento.", 503);
        }
    }
};

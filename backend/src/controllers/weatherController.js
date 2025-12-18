import { createResponse, createErrorResponse } from '../utils/api-utils.js';

export const getWeather = async (c) => {
    const env = c.env;
    const cacheKey = 'weather_data_sinop';

    try {
        // Tentar buscar do cache (KV ou memória)
        if (env.MURAL_STORE) {
            const cached = await env.MURAL_STORE.get(cacheKey);
            if (cached) {
                return createResponse(c, JSON.parse(cached));
            }
        }

        // Sinop, MT WOEID: 455928
        // Usando HG Brasil (Fonte confiável para o Brasil)
        const res = await fetch(`https://api.hgbrasil.com/weather?woeid=455928`);
        if (!res.ok) throw new Error("Falha ao buscar clima na HG Brasil");

        const data = await res.json();
        const weather = data.results;

        // Cache por 20 minutos para evitar excesso de requisições
        if (env.MURAL_STORE) {
            await env.MURAL_STORE.put(cacheKey, JSON.stringify(weather), { expirationTtl: 1200 });
        }

        return createResponse(c, weather);
    } catch (err) {
        console.error("Weather Error:", err);
        // Fallback para Open-Meteo se a HG falhar
        try {
            const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-11.8641&longitude=-55.5031&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m&daily=sunrise,sunset,uv_index_max&wind_speed_unit=kmh&timezone=America%2FCuiaba');
            const data = await res.json();
            const fallback = {
                temp: Math.round(data.current.temperature_2m),
                description: "Céu Limpo", // Simplicado
                currently: "Dia",
                humidity: data.current.relative_humidity_2m,
                wind_speedy: `${data.current.wind_speed_10m} km/h`,
                sunrise: data.daily.sunrise[0].split('T')[1],
                sunset: data.daily.sunset[0].split('T')[1],
                uv: data.daily.uv_index_max[0],
                source: 'open-meteo'
            };
            return createResponse(c, fallback);
        } catch (f) {
            return createErrorResponse(c, "WEATHER_ERROR", "Não foi possível obter dados do clima.", 500);
        }
    }
};

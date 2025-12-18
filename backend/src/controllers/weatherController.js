import { createResponse, createErrorResponse } from '../utils/api-utils.js';

export const getWeather = async (c) => {
    const env = c.env;
    const cacheKey = 'weather_data_sinop_v5';

    // 1. Tentar Cache primeiro
    if (env?.MURAL_STORE) {
        try {
            const cached = await env.MURAL_STORE.get(cacheKey);
            if (cached) return createResponse(c, JSON.parse(cached));
        } catch (e) { console.error("KV Read Error:", e); }
    }

    const tryFetch = async (url, options = {}) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
            const res = await fetch(url, { ...options, signal: controller.signal });
            return res;
        } finally {
            clearTimeout(timeout);
        }
    };

    let weatherData = null;

    // 2. Fonte Primária: HG Brasil
    try {
        const res = await tryFetch(`https://api.hgbrasil.com/weather?woeid=455928`);
        if (res.ok) {
            const data = await res.json();
            if (data?.results) {
                weatherData = { ...data.results, source: 'hgbrasil' };
            }
        }
    } catch (e) { console.warn("HG Brasil failed:", e.message); }

    // 3. Fallback 1: Open-Meteo
    if (!weatherData) {
        try {
            const res = await tryFetch('https://api.open-meteo.com/v1/forecast?latitude=-11.8641&longitude=-55.5031&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m&daily=sunrise,sunset,uv_index_max&wind_speed_unit=kmh&timezone=America%2FCuiaba');
            if (res.ok) {
                const data = await res.json();
                if (data?.current) {
                    weatherData = {
                        temp: Math.round(data.current.temperature_2m || 0),
                        description: "Tempo Estável",
                        humidity: data.current.relative_humidity_2m || 0,
                        wind_speedy: `${data.current.wind_speed_10m || 0} km/h`,
                        sunrise: data.daily?.sunrise?.[0]?.split('T')?.[1] || "--:--",
                        sunset: data.daily?.sunset?.[0]?.split('T')?.[1] || "--:--",
                        moon_phase: "N/A",
                        date: new Date().toLocaleDateString('pt-BR'),
                        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                        source: 'open-meteo'
                    };
                }
            }
        } catch (e) { console.warn("Open-Meteo failed:", e.message); }
    }

    // 4. Fallback 2: wttr.in
    if (!weatherData) {
        try {
            const res = await tryFetch('https://wttr.in/Sinop?format=j1');
            if (res.ok) {
                const data = await res.json();
                const current = data.current_condition?.[0];
                if (current) {
                    weatherData = {
                        temp: current.temp_C || 0,
                        description: current.lang_pt?.[0]?.value || current.weatherDesc?.[0]?.value || "Nublado",
                        humidity: current.humidity || 0,
                        wind_speedy: `${current.windspeedKmph || 0} km/h`,
                        sunrise: data.weather?.[0]?.astronomy?.[0]?.sunrise || "--:--",
                        sunset: data.weather?.[0]?.astronomy?.[0]?.sunset || "--:--",
                        date: new Date().toLocaleDateString('pt-BR'),
                        source: 'wttr.in'
                    };
                }
            }
        } catch (e) { console.warn("wttr.in failed:", e.message); }
    }

    // 5. Finalizar
    if (weatherData) {
        if (env?.MURAL_STORE) {
            try {
                await env.MURAL_STORE.put(cacheKey, JSON.stringify(weatherData), { expirationTtl: 1800 });
            } catch (e) { console.error("KV Write Error:", e); }
        }
        return createResponse(c, weatherData);
    }

    return createErrorResponse(c, "WEATHER_OFFLINE", "Serviços de clima temporariamente fora do ar.", 503);
};

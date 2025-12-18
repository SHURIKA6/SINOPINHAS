import { createResponse, createErrorResponse } from '../utils/api-utils.js';

const translateDescription = (desc) => {
    if (!desc) return "Nublado";
    const d = desc.toLowerCase();
    const map = {
        "clear sky": "Céu Limpo",
        "mainly clear": "Predominantemente Limpo",
        "partly cloudy": "Parcialmente Nublado",
        "cloudy": "Nublado",
        "overcast": "Encoberto",
        "fog": "Nevoeiro",
        "drizzle": "Garoa",
        "light drizzle": "Garoa Leve",
        "moderate drizzle": "Garoa Moderada",
        "dense drizzle": "Garoa Densa",
        "light rain": "Chuva Fraca",
        "moderate rain": "Chuva Moderada",
        "heavy rain": "Chuva Forte",
        "showers": "Pancadas de Chuva",
        "thunderstorm": "Trovoada",
        "storm": "Tempestade"
    };
    for (const [eng, pt] of Object.entries(map)) {
        if (d.includes(eng)) return pt;
    }
    return desc; // Return original if no match
};

const getWmoLabel = (code) => {
    const table = {
        0: "Céu Limpo",
        1: "Principalmente Limpo",
        2: "Parcialmente Nublado",
        3: "Nublado",
        45: "Nevoeiro",
        48: "Nevoeiro com Geada",
        51: "Garoa Leve",
        53: "Garoa Moderada",
        55: "Garoa Densa",
        61: "Chuva Fraca",
        63: "Chuva Moderada",
        65: "Chuva Forte",
        80: "Pancadas de Chuva Leves",
        81: "Pancadas de Chuva",
        82: "Pancadas de Chuva Fortes",
        95: "Trovoada",
        96: "Trovoada com Granizo Fraco",
        99: "Trovoada com Granizo Forte"
    };
    return table[code] || "Tempo Instável";
};

export const getWeather = async (c) => {
    const env = c.env;
    const cacheKey = 'weather_data_sinop_v8_final';

    // 1. Tentar Cache
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

    // 2. Fonte Primária: HG Brasil (Corrigido WOEID)
    try {
        const res = await tryFetch(`https://api.hgbrasil.com/weather?woeid=455928`);
        if (res.ok) {
            const data = await res.json();
            if (data?.results) {
                weatherData = {
                    ...data.results,
                    description: translateDescription(data.results.description),
                    source: 'hgbrasil'
                };
            }
        }
    } catch (e) { console.warn("HG Brasil failed:", e.message); }

    // 3. Fallback 1: Open-Meteo (Mapeamento de Códigos)
    if (!weatherData) {
        try {
            const res = await tryFetch('https://api.open-meteo.com/v1/forecast?latitude=-11.8641&longitude=-55.5031&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&daily=sunrise,sunset,uv_index_max&wind_speed_unit=kmh&timezone=America%2FCuiaba');
            if (res.ok) {
                const data = await res.json();
                if (data?.current) {
                    weatherData = {
                        temp: Math.round(data.current.temperature_2m || 0),
                        description: getWmoLabel(data.current.weather_code),
                        humidity: data.current.relative_humidity_2m || 0,
                        wind_speedy: `${Math.round(data.current.wind_speed_10m || 0)} km/h`,
                        sunrise: data.daily?.sunrise?.[0]?.split('T')?.[1] || "06:00",
                        sunset: data.daily?.sunset?.[0]?.split('T')?.[1] || "18:30",
                        moon_phase: "N/A",
                        date: new Date().toLocaleDateString('pt-BR'),
                        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                        source: 'open-meteo'
                    };
                }
            }
        } catch (e) { console.warn("Open-Meteo failed:", e.message); }
    }

    // 4. Fallback 2: wttr.in (Localização Específica)
    if (!weatherData) {
        try {
            const res = await tryFetch('https://wttr.in/Sinop,Brazil?format=j1');
            if (res.ok) {
                const data = await res.json();
                const current = data.current_condition?.[0];
                if (current) {
                    weatherData = {
                        temp: current.temp_C || 0,
                        description: translateDescription(current.lang_pt?.[0]?.value || current.weatherDesc?.[0]?.value || "Nublado"),
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

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
    const cacheKey = 'weather_data_sinop_v9'; // Increment cache version

    // 1. Tentar Cache
    if (env?.MURAL_STORE) {
        try {
            const cached = await env.MURAL_STORE.get(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                // Adicionar timestamp de cache para debug
                parsed.cached_at = new Date().toISOString();
                return createResponse(c, parsed);
            }
        } catch (e) { console.error("KV Read Error:", e); }
    }

    const tryFetch = async (url, options = {}) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
            const res = await fetch(url, { ...options, signal: controller.signal });
            return res;
        } catch (e) {
            console.error(`Fetch error for ${url}:`, e.message);
            return null;
        } finally {
            clearTimeout(timeout);
        }
    };

    let weatherData = null;

    // 2. Fonte Primária: Open-Meteo (Mais estável e sem chaves)
    try {
        // Coordenadas exatas de Sinop, MT: -11.8641, -55.5031
        const res = await tryFetch('https://api.open-meteo.com/v1/forecast?latitude=-11.8641&longitude=-55.5031&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&daily=sunrise,sunset,uv_index_max&wind_speed_unit=kmh&timezone=America%2FCuiaba');
        if (res && res.ok) {
            const data = await res.json();
            if (data?.current) {
                weatherData = {
                    temp: Math.round(data.current.temperature_2m || 0),
                    description: getWmoLabel(data.current.weather_code),
                    humidity: data.current.relative_humidity_2m || 0,
                    wind_speedy: `${Math.round(data.current.wind_speed_10m || 0)} km/h`,
                    sunrise: data.daily?.sunrise?.[0]?.split('T')?.[1] || "06:15",
                    sunset: data.daily?.sunset?.[0]?.split('T')?.[1] || "18:45",
                    moon_phase: "N/A",
                    date: new Date().toLocaleDateString('pt-BR'),
                    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    source: 'open-meteo'
                };
            }
        }
    } catch (e) { console.warn("Open-Meteo failed:", e.message); }

    // 3. Fallback 1: HG Brasil (WOEID Sinop: 455936 - as vezes instável sem key)
    if (!weatherData) {
        try {
            const res = await tryFetch(`https://api.hgbrasil.com/weather?woeid=455936`);
            if (res && res.ok) {
                const data = await res.json();
                if (data?.results) {
                    weatherData = {
                        temp: data.results.temp || 0,
                        description: translateDescription(data.results.description),
                        humidity: data.results.humidity || 0,
                        wind_speedy: data.results.wind_speedy || "0 km/h",
                        sunrise: data.results.sunrise || "06:00 AM",
                        sunset: data.results.sunset || "06:30 PM",
                        moon_phase: data.results.moon_phase || "N/A",
                        date: data.results.date || new Date().toLocaleDateString('pt-BR'),
                        time: data.results.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                        source: 'hgbrasil'
                    };
                }
            }
        } catch (e) { console.warn("HG Brasil failed:", e.message); }
    }

    // 4. Fallback 2: wttr.in
    if (!weatherData) {
        try {
            const res = await tryFetch('https://wttr.in/Sinop,Brazil?format=j1');
            if (res && res.ok) {
                const data = await res.json();
                const current = data.current_condition?.[0];
                if (current) {
                    weatherData = {
                        temp: current.temp_C || 0,
                        description: translateDescription(current.lang_pt?.[0]?.value || current.weatherDesc?.[0]?.value || "Nublado"),
                        humidity: current.humidity || 0,
                        wind_speedy: `${current.windspeedKmph || 0} km/h`,
                        sunrise: data.weather?.[0]?.astronomy?.[0]?.sunrise || "06:00 AM",
                        sunset: data.weather?.[0]?.astronomy?.[0]?.sunset || "06:30 PM",
                        moon_phase: data.weather?.[0]?.astronomy?.[0]?.moon_phase || "N/A",
                        date: new Date().toLocaleDateString('pt-BR'),
                        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                        source: 'wttr.in'
                    };
                }
            }
        } catch (e) { console.warn("wttr.in failed:", e.message); }
    }

    // 5. Fallback Final (Para nunca retornar 503 desnecessário)
    if (!weatherData) {
        weatherData = {
            temp: 28,
            description: "Nublado (Offline)",
            humidity: 65,
            wind_speedy: "5 km/h",
            sunrise: "06:15",
            sunset: "18:45",
            moon_phase: "N/A",
            date: new Date().toLocaleDateString('pt-BR'),
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            source: 'hard-fallback'
        };
    }

    // 6. Finalizar e Cachear
    if (env?.MURAL_STORE) {
        try {
            await env.MURAL_STORE.put(cacheKey, JSON.stringify(weatherData), { expirationTtl: 1800 });
        } catch (e) { console.error("KV Write Error:", e); }
    }

    return createResponse(c, weatherData);
};

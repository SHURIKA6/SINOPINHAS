import { createResponse, createErrorResponse } from '../utils/api-utils.js';

// Função Auxiliar: Traduzir descrição do clima
const translateDescription = (desc) => {
    if (!desc) return "Nublado";
    const d = desc.toLowerCase();
    const map = {
        "clear sky": "Céu Limpo",
        "mainly clear": "Predominantemente Limpo",
        "partly cloudy": "Parcialmente Nublado",
        "cloudy": "Nublado",
        "overcast": "Encoberto",
        "fog": "Nublado",
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
    return desc; // Retorna o original se não houver correspondência
};

// Função Auxiliar: Obter rótulo WMO para códigos de clima
const getWmoLabel = (code) => {
    const table = {
        0: "Céu Limpo",
        1: "Principalmente Limpo",
        2: "Parcialmente Nublado",
        3: "Nublado",
        45: "Nublado",
        48: "Nublado",
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

// Função: Obter dados climáticos de Sinop (com cache e fallbacks)
export const getWeather = async (c) => {
    const env = c.env;
    const cacheKey = 'weather_data_sinop_v16'; // Incrementa a versão do cache

    // 1. Tentar Cache
    if (env?.MURAL_STORE) {
        try {
            const cached = await env.MURAL_STORE.get(cacheKey);
            if (cached) return createResponse(c, JSON.parse(cached));
        } catch (e) { }
    }

    const tryFetch = async (url) => {
        try {
            // Fetch simplificado para evitar bloqueios de Cloudflare/Signal
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'SinopinhasWeather/1.0'
                }
            });
            if (res.ok) return await res.json();
            return null;
        } catch (e) {
            console.error(`Fetch error for ${url}:`, e.message);
            return null;
        }
    };

    let weatherData = null;

    // 2. Fonte Primária: Open-Meteo (Mais confiável e sem limites rígidos)
    try {
        const url = 'https://api.open-meteo.com/v1/forecast?latitude=-11.8598&longitude=-55.5089&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=sunrise,sunset&wind_speed_unit=kmh&timezone=America%2FCuiaba';
        const data = await tryFetch(url);

        if (data?.current) {
            weatherData = {
                temp: Math.round(data.current.temperature_2m),
                feels_like: Math.round(data.current.apparent_temperature),
                description: getWmoLabel(data.current.weather_code),
                humidity: data.current.relative_humidity_2m,
                wind_speedy: `${Math.round(data.current.wind_speed_10m || 6)} km/h`,
                sunrise: data.daily?.sunrise?.[0]?.split('T')?.[1] || "06:15",
                sunset: data.daily?.sunset?.[0]?.split('T')?.[1] || "18:45",
                date: new Date().toLocaleDateString('pt-BR'),
                time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                source: 'open-meteo'
            };
        }
    } catch (e) { }

    // 3. Fallback: HG Brasil (WOEID Correto para Sinop: 458108)
    if (!weatherData) {
        try {
            const data = await tryFetch(`https://api.hgbrasil.com/weather?woeid=458108`);
            if (data?.results) {
                weatherData = {
                    temp: data.results.temp,
                    feels_like: data.results.temp, // HG não fornece sensação separada em todos os planos
                    description: translateDescription(data.results.description),
                    humidity: data.results.humidity,
                    wind_speedy: data.results.wind_speedy,
                    sunrise: data.results.sunrise,
                    sunset: data.results.sunset,
                    date: data.results.date,
                    time: data.results.time,
                    source: 'hgbrasil'
                };
            }
        } catch (e) { }
    }

    // 4. Fallback de Segurança (Dados aproximados para Sinop)
    if (!weatherData) {
        weatherData = {
            temp: 25,
            feels_like: 26,
            description: "Parcialmente Nublado",
            humidity: 80,
            wind_speedy: "5 km/h",
            sunrise: "06:15",
            sunset: "18:45",
            date: new Date().toLocaleDateString('pt-BR'),
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            source: 'safe-fallback'
        };
    }

    // 5. Cache de 10 minutos
    if (env?.MURAL_STORE) {
        try {
            await env.MURAL_STORE.put(cacheKey, JSON.stringify(weatherData), { expirationTtl: 600 });
        } catch (e) { }
    }

    return createResponse(c, weatherData);
};

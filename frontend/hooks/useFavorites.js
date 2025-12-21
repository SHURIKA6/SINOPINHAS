import { useState, useEffect } from 'react';

export function useFavorites() {
    const [favorites, setFavorites] = useState({
        videos: [],
        news: [],
        events: [],
        places: []
    });

    useEffect(() => {
        const saved = localStorage.getItem('sinopinhas_favorites');
        if (saved) {
            try {
                setFavorites(JSON.parse(saved));
            } catch (e) {
                console.error("Erro ao carregar favoritos", e);
            }
        }
    }, []);

    const saveFavorites = (newFavorites) => {
        setFavorites(newFavorites);
        localStorage.setItem('sinopinhas_favorites', JSON.stringify(newFavorites));
    };

    const toggleFavorite = (type, item) => {
        const currentTypeFavs = favorites[type] || [];
        const exists = currentTypeFavs.find(f => f.id === item.id || f.link === item.link || f.title === item.title);

        let newTypeFavs;
        if (exists) {
            newTypeFavs = currentTypeFavs.filter(f => (f.id !== item.id && f.link !== item.link && f.title !== item.title));
        } else {
            newTypeFavs = [...currentTypeFavs, item];
        }

        saveFavorites({
            ...favorites,
            [type]: newTypeFavs
        });

        return !exists;
    };

    const isFavorite = (type, item) => {
        const currentTypeFavs = favorites[type] || [];
        return !!currentTypeFavs.find(f => f.id === item.id || f.link === item.link || f.title === item.title);
    };

    return { favorites, toggleFavorite, isFavorite };
}

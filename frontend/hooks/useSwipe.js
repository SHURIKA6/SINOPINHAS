import { useState } from 'react';

export function useSwipe(onSwipeLeft, onSwipeRight, threshold = 80) {
    const [swipeStartX, setSwipeStartX] = useState(null);

    const handleTouchStart = (e) => {
        setSwipeStartX(e.touches[0].clientX);
    };

    const handleTouchEnd = (e) => {
        if (swipeStartX === null) return;
        const endX = e.changedTouches[0].clientX;
        const diff = swipeStartX - endX;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                onSwipeLeft && onSwipeLeft();
            } else {
                onSwipeRight && onSwipeRight();
            }
        }
        setSwipeStartX(null);
    };

    return { handleTouchStart, handleTouchEnd };
}

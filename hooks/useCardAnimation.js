"use client";
import { useEffect, useState } from 'react';

export const useCardAnimation = (cardCount = 0, delay = 100) => {
    const [animatedCards, setAnimatedCards] = useState([]);

    useEffect(() => {
        // Reset animations on mount
        setAnimatedCards([]);

        // Trigger animations with staggered delays
        const timeouts = [];

        for (let i = 0; i < cardCount; i++) {
            const timeout = setTimeout(() => {
                setAnimatedCards(prev => [...prev, i]);
            }, i * delay);
            timeouts.push(timeout);
        }

        // Cleanup timeouts on unmount
        return () => {
            timeouts.forEach(timeout => clearTimeout(timeout));
        };
    }, [cardCount, delay]);

    const getCardAnimationClass = (index) => {
        if (animatedCards.includes(index)) {
            return 'animate-fade-in-up';
        }
        return 'animate-card';
    };

    const getCardDelayClass = (index) => {
        const delayMap = {
            0: 'animate-delay-100',
            1: 'animate-delay-200',
            2: 'animate-delay-300',
            3: 'animate-delay-400',
            4: 'animate-delay-500',
            5: 'animate-delay-600',
            6: 'animate-delay-700',
            7: 'animate-delay-800'
        };
        return delayMap[index] || '';
    };

    return {
        getCardAnimationClass,
        getCardDelayClass,
        animatedCards
    };
}; 
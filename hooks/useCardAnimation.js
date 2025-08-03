"use client";
import { useEffect, useState, useRef } from 'react';

export const useCardAnimation = (cardCount = 0, delay = 100) => {
    const [animatedCards, setAnimatedCards] = useState([]);
    const hasAnimated = useRef(false);

    useEffect(() => {
        // Only animate once per component lifecycle
        if (hasAnimated.current) {
            return;
        }

        // Small delay to ensure smooth animation
        const initialDelay = 100;

        // Trigger animations with staggered delays
        const timeouts = [];

        for (let i = 0; i < cardCount; i++) {
            const timeout = setTimeout(() => {
                setAnimatedCards(prev => [...prev, i]);
            }, initialDelay + (i * delay));
            timeouts.push(timeout);
        }

        hasAnimated.current = true;

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
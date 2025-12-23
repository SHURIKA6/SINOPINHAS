import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProgressBar() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleStart = () => setLoading(true);
        const handleComplete = () => setLoading(false);

        router.events.on('routeChangeStart', handleStart);
        router.events.on('routeChangeComplete', handleComplete);
        router.events.on('routeChangeError', handleComplete);

        return () => {
            router.events.off('routeChangeStart', handleStart);
            router.events.off('routeChangeComplete', handleComplete);
            router.events.off('routeChangeError', handleComplete);
        };
    }, [router]);

    return (
        <AnimatePresence>
            {loading && (
                <motion.div
                    initial={{ width: '0%', opacity: 1 }}
                    animate={{ width: '70%', opacity: 1 }}
                    exit={{ width: '100%', opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        height: '2.5px',
                        background: 'linear-gradient(90deg, #a855f7, #ff6b9d)',
                        zIndex: 10000,
                        boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)'
                    }}
                />
            )}
        </AnimatePresence>
    );
}

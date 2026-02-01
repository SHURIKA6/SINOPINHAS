import React from 'react';
import Skeleton from '../common/Skeleton';

const FeedSkeleton = () => {
    return (
        <div style={{
            position: 'relative',
            height: '100vh',
            width: '100%',
            backgroundColor: '#000',
            overflow: 'hidden'
        }}>
            {/* Header Area */}
            <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
                <Skeleton width="40px" height="40px" borderRadius="50%" />
            </div>

            {/* Main Content Area (Video Placeholder) */}
            <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Maybe a big play icon skeleton or just empty */}
            </div>

            {/* Bottom Info Area */}
            <div style={{
                position: 'absolute',
                bottom: 80,
                left: 16,
                right: 70,
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                <Skeleton width="120px" height="20px" />
                <Skeleton width="80%" height="16px" />
                <Skeleton width="60%" height="16px" />
            </div>

            {/* Sidebar Actions */}
            <div style={{
                position: 'absolute',
                bottom: 80,
                right: 8,
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                alignItems: 'center'
            }}>
                <Skeleton width="40px" height="40px" borderRadius="50%" />
                <Skeleton width="40px" height="40px" borderRadius="50%" />
                <Skeleton width="40px" height="40px" borderRadius="50%" />
                <Skeleton width="40px" height="40px" borderRadius="50%" />
            </div>
        </div>
    );
};

export default FeedSkeleton;

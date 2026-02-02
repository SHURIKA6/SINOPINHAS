import React from 'react';
import Skeleton from '../common/Skeleton';

const FeedSkeleton = () => {
    return (
        <div style={{
            background: 'black',
            border: '1px solid #555',
            borderRadius: '6px',
            overflow: 'hidden',
            boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '100%',
            marginBottom: '24px',
            height: 'auto'
        }}>
            {/* WMP Title Bar Skeleton */}
            <div style={{
                height: '24px',
                background: 'linear-gradient(180deg, #6688AA 0%, #224466 50%, #001122 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px'
            }}>
                <Skeleton width="150px" height="12px" />
                <div style={{ display: 'flex', gap: 4 }}>
                    <Skeleton width="10px" height="10px" />
                    <Skeleton width="10px" height="10px" />
                    <Skeleton width="10px" height="10px" />
                </div>
            </div>

            {/* Video Screen Skeleton */}
            <div style={{
                background: 'black',
                height: '300px',
                position: 'relative',
                borderLeft: '1px solid #333',
                borderRight: '1px solid #333',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <Skeleton width="60px" height="60px" borderRadius="50%" />
            </div>

            {/* WMP Controls Skeleton */}
            <div style={{
                background: 'linear-gradient(180deg, #E6E6E6 0%, #C0C0C0 100%)',
                padding: '6px',
                display: 'flex', alignItems: 'center', gap: '8px',
                borderTop: '1px solid #999'
            }}>
                <Skeleton width="28px" height="28px" borderRadius="50%" />
                <div style={{ flex: 1 }}>
                    <Skeleton width="100%" height="4px" />
                </div>
                <Skeleton width="30px" height="10px" />
            </div>

            {/* Metadata Skeleton */}
            <div style={{ background: '#F0F0F0', padding: 12, borderTop: '1px solid #CCC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Skeleton width="32px" height="32px" borderRadius="4px" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Skeleton width="100px" height="12px" />
                        <Skeleton width="80px" height="10px" />
                    </div>
                </div>
                <Skeleton width="90%" height="12px" />
            </div>
        </div>
    );
};

export default FeedSkeleton;

import React from 'react';

const SkeletonVideoCard = () => {
    return (
        <div style={{
            background: 'var(--card-bg)',
            borderRadius: 24,
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            transition: 'all 0.3s ease'
        }}>
            {/* Video Placeholder */}
            <div className="skeleton" style={{
                width: '100%',
                paddingTop: '177%', // 9:16 Aspect Ratio to match the new feed style
                borderRadius: 0
            }} />

            {/* Content Placeholder */}
            <div style={{ padding: 16 }}>
                {/* Title */}
                <div className="skeleton" style={{
                    height: 24,
                    borderRadius: 4,
                    width: '70%',
                    marginBottom: 12
                }} />

                {/* Description Lines */}
                <div className="skeleton" style={{
                    height: 16,
                    borderRadius: 4,
                    width: '90%',
                    marginBottom: 8
                }} />
                <div className="skeleton" style={{
                    height: 16,
                    borderRadius: 4,
                    width: '50%'
                }} />

                {/* Footer Placeholder */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: 80, height: 28, borderRadius: 20 }} />
                    <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                </div>
            </div>
        </div>
    );
};

export default SkeletonVideoCard;

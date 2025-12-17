import React from 'react';

const SkeletonVideoCard = () => {
    return (
        <div style={{
            background: '#252525',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 24,
            border: '1px solid #303030',
            animation: 'pulse 1.5s infinite ease-in-out'
        }}>
            {/* Video Placeholder */}
            <div style={{
                width: '100%',
                paddingTop: '56.25%', // 16:9 Aspect Ratio
                background: '#333'
            }} />

            {/* Content Placeholder */}
            <div style={{ padding: 16 }}>
                {/* Title */}
                <div style={{
                    height: 24,
                    background: '#333',
                    borderRadius: 4,
                    width: '70%',
                    marginBottom: 12
                }} />

                {/* Description Lines */}
                <div style={{
                    height: 16,
                    background: '#333',
                    borderRadius: 4,
                    width: '90%',
                    marginBottom: 8
                }} />
                <div style={{
                    height: 16,
                    background: '#333',
                    borderRadius: 4,
                    width: '50%'
                }} />

                {/* Action Buttons Placeholder */}
                <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                    <div style={{ width: 80, height: 36, background: '#333', borderRadius: 8 }} />
                    <div style={{ width: 80, height: 36, background: '#333', borderRadius: 8 }} />
                </div>
            </div>

            <style jsx>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
        </div>
    );
};

export default SkeletonVideoCard;

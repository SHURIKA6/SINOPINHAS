import React from 'react';

export default function Skeleton({ width, height, borderRadius = '12px', className = '', style = {} }) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                width: width || '100%',
                height: height || '100%',
                borderRadius: borderRadius,
                ...style
            }}
        />
    );
}

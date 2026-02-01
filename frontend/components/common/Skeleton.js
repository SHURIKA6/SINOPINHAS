import React from 'react';

const Skeleton = ({ width, height, borderRadius = '4px', className = '', style = {} }) => {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                width,
                height,
                borderRadius,
                ...style
            }}
        >
            <style jsx>{`
        .skeleton {
          background-color: var(--input-bg);
          background-image: linear-gradient(
            90deg,
            var(--input-bg) 0px,
            rgba(255, 255, 255, 0.05) 40px,
            var(--input-bg) 80px
          );
          background-size: 200px 100%;
          animation: skeleton-loading 1.5s infinite linear;
          display: inline-block;
        }

        @keyframes skeleton-loading {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: calc(200px + 100%) 0;
          }
        }
      `}</style>
        </div>
    );
};

export default Skeleton;

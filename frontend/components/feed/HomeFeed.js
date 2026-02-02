import { useState, useEffect, useMemo, useRef } from 'react';
import VideoCard from '../VideoCard';
import FeedSkeleton from './FeedSkeleton';
import ShareModal from '../ShareModal';
import { fetchVideos, searchVideos, likeVideo, removeVideo } from '../../services/api';
import { Search, Flame, Video, Image as ImageIcon } from 'lucide-react';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

export default function HomeFeed({ user, isAdmin, adminPassword, onVideoClick, showToast, canDelete, filterType: initialFilterType = 'all' }) {
    const [videos, setVideos] = useState([]);
    // ... (content skipped) ...
    return (
        <FixedSizeList
            height={height}
            width={width}
            itemCount={rowCount}
            itemSize={CARD_HEIGHT + GAP}
            onItemsRendered={({ visibleStopIndex }) => {
                if (visibleStopIndex >= rowCount - 2 && hasMore && !loading) {
                    setOffset(prev => prev + LIMIT);
                }
            }}
        >
            {({ index, style }) => {
                const fromIndex = index * columnCount;
                const toIndex = Math.min(fromIndex + columnCount, videos.length);
                const items = videos.slice(fromIndex, toIndex);

                return (
                    <div style={{ ...style, display: 'flex', gap: GAP }}>
                        {items.map(v => (
                            <div key={v.id} style={{ width: cardWidth }}>
                                <VideoCard
                                    video={v}
                                    onDelete={handleDeleteVideo}
                                    onLike={toggleLike}
                                    onOpenComments={onVideoClick}
                                    canDelete={canDelete ? canDelete(v.user_id?.toString()) : (isAdmin || (user && user.id.toString() === v.user_id?.toString()))}
                                    onShare={(video) => setVideoToShare(video)}
                                />
                            </div>
                        ))}
                    </div>
                );
            }}
        </FixedSizeList>
    );
}}
                        </AutoSizer >
                    </div >
                )}
            </div >

    <style jsx>{`
                .home-feed-root { position: relative; }
                .home-feed-container { max-width: 1200px; margin: 0 auto; padding: 0 0 100px; }
                
                .feed-header-glass {
                    background: rgba(25, 20, 40, 0.4);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 28px;
                    padding: 24px;
                    margin-bottom: 32px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                }

                .search-row-feed { display: flex; gap: 12px; margin-bottom: 20px; }
                
                .feed-search-input-box {
                    flex: 1; position: relative;
                }

                .search-f-icon {
                    position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
                    color: rgba(255,255,255,0.3);
                }

                .feed-search-input-box input {
                    width: 100%; padding: 14px 20px 14px 48px;
                    background: rgba(15, 13, 21, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px; color: white; font-size: 15px; outline: none;
                }

                .feed-sort-select {
                    padding: 12px 16px; background: rgba(15, 13, 21, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px; color: white; font-size: 14px; font-weight: 600; cursor: pointer;
                }

                .feed-filter-tabs { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; }
                .feed-filter-tabs::-webkit-scrollbar { display: none; }

                .feed-filter-btn {
                    padding: 8px 18px; border-radius: 99px; border: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.03); color: #94a3b8; font-weight: 700;
                    font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px;
                    white-space: nowrap; transition: all 0.2s ease;
                }

                .feed-filter-btn.active {
                    background: linear-gradient(135deg, #a855f7, #6366f1);
                    color: white; border-color: transparent; box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
                }

                .feed-grid {
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;
                }

                .floating-heart {
                    position: fixed; pointer-events: none; z-index: 10001; font-size: 24px;
                    animation: floatHeart 1s ease-out forwards;
                }

                .feed-empty { text-align: center; padding: 80px 20px; color: #94a3b8; }
                .empty-emoji { font-size: 64px; margin-bottom: 24px; }
                
                .feed-loader {
                    text-align: center; margin-top: 48px; padding: 24px; color: #a855f7; font-weight: 700;
                }

                @media (max-width: 768px) {
                    .feed-header-glass { padding: 16px; border-radius: 20px; margin: 0 0 20px; }
                    .search-row-feed { flex-direction: column; }
                    .feed-sort-select { width: 100%; height: 48px; }
                    .feed-search-input-box input { height: 48px; }
                    .feed-filter-btn { padding: 6px 14px; font-size: 12px; }
                }

                @keyframes floatHeart {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
                }
            `}</style>
        </div >
    );
}

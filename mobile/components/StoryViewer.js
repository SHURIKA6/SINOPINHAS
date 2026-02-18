import { View, Text, Image, TouchableOpacity, Modal, Dimensions, StatusBar, SafeAreaView } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { styled } from 'nativewind';
import { X, Trash2 } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouch = styled(TouchableOpacity);

const { width, height } = Dimensions.get('window');

export default function StoryViewer({ visible, storyGroup, onClose, onStoryViewed, currentUserId, onDelete }) {
    if (!storyGroup) return null;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const videoRef = useRef(null);

    // Reset index when opening a new group
    useEffect(() => {
        if (visible) {
            // Find first unviewed story
            const firstUnviewed = storyGroup.stories.findIndex(s => !s.viewed);
            setCurrentIndex(firstUnviewed >= 0 ? firstUnviewed : 0);
            setPaused(false);
        }
    }, [visible, storyGroup]);

    const currentStory = storyGroup.stories[currentIndex];

    // Auto-advance logic (simplified for now)
    useEffect(() => {
        if (paused || !visible || !currentStory) return;

        // Mark as viewed
        if (!currentStory.viewed) {
            onStoryViewed(storyGroup.user_id, currentStory.id);
        }

        const duration = currentStory.media_type === 'video'
            ? (currentStory.duration || 15) * 1000
            : 5000;

        const timer = setTimeout(() => {
            nextStory();
        }, duration);

        return () => clearTimeout(timer);
    }, [currentIndex, paused, visible, currentStory]);

    const nextStory = () => {
        if (currentIndex < storyGroup.stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const prevStory = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        } else {
            // Restart current or close? For now just stay
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <StyledView className="flex-1 bg-black relative">
                <StatusBar hidden />

                {/* Progress Bars */}
                <SafeAreaView className="absolute top-0 w-full z-20 flex-row gap-1 px-2 pt-2">
                    {storyGroup.stories.map((story, i) => (
                        <StyledView key={story.id} className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
                            <StyledView
                                style={{
                                    width: i < currentIndex ? '100%' : (i === currentIndex ? '100%' : '0%'), // Needs animation
                                    backgroundColor: 'white',
                                    height: '100%'
                                }}
                            />
                        </StyledView>
                    ))}
                </SafeAreaView>

                {/* Header */}
                <StyledView className="absolute top-8 left-0 w-full z-20 flex-row items-center justify-between px-4 mt-2">
                    <StyledView className="flex-row items-center gap-2">
                        <Image source={{ uri: storyGroup.avatar }} className="w-8 h-8 rounded-full" />
                        <StyledText className="text-white font-bold text-shadow">{storyGroup.username}</StyledText>
                        <StyledText className="text-gray-300 text-xs text-shadow">
                            • {new Date(currentStory?.created_at).getHours()}h
                        </StyledText>
                    </StyledView>
                    <StyledView className="flex-row gap-4">
                        {currentUserId && currentUserId.toString() === storyGroup.user_id.toString() && (
                            <StyledTouch onPress={() => onDelete(currentStory.id)}>
                                <Trash2 size={24} color="white" />
                            </StyledTouch>
                        )}
                        <StyledTouch onPress={onClose}>
                            <X size={28} color="white" />
                        </StyledTouch>
                    </StyledView>
                </StyledView>

                {/* Content */}
                <StyledTouch
                    activeOpacity={1}
                    className="flex-1 justify-center items-center bg-zinc-900"
                    onLongPress={() => setPaused(true)}
                    onPressOut={() => setPaused(false)}
                    onPress={(e) => {
                        const x = e.nativeEvent.locationX;
                        if (x < width * 0.3) prevStory();
                        else nextStory();
                    }}
                >
                    {currentStory?.media_type === 'video' ? (
                        <Video
                            ref={videoRef}
                            source={{ uri: currentStory.bunny_id.startsWith('http') ? currentStory.bunny_id : `https://pub-4553530dfbf646db8755013054817578.r2.dev/${currentStory.bunny_id}` }}
                            style={{ width, height: height * 0.9 }}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay={!paused && visible}
                            isLooping={false}
                            onPlaybackStatusUpdate={status => {
                                if (status.didJustFinish) {
                                    nextStory();
                                }
                            }}
                        />
                    ) : (
                        <Image
                            source={{ uri: currentStory?.bunny_id.startsWith('http') ? currentStory.bunny_id : `https://pub-4553530dfbf646db8755013054817578.r2.dev/${currentStory?.bunny_id}` }}
                            style={{ width, height: height * 0.9 }}
                            resizeMode="cover"
                        />
                    )}
                </StyledTouch>

                {/* Caption */}
                {currentStory?.caption && (
                    <StyledView className="absolute bottom-10 left-0 w-full p-4 items-center bg-black/30">
                        <StyledText className="text-white text-lg font-medium text-center">{currentStory.caption}</StyledText>
                    </StyledView>
                )}
            </StyledView>
        </Modal>
    );
}

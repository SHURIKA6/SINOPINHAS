// TODO: Create regular upload screen similar to upload-story.js but for feed posts
import { View, Text } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);

export default function Upload() {
    return (
        <StyledView className="flex-1 bg-[#0E2A47] justify-center items-center">
            <StyledText className="text-white">Upload de Feed (Em breve)</StyledText>
        </StyledView>
    );
}

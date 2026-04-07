import Svg, { Path, G } from 'react-native-svg';

export default function TemplateIcon() {
    return (
        <Svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <Path 
                d="M0 19.9955C0 8.9523 8.9523 0 19.9955 0C31.0387 0 39.991 8.9523 39.991 19.9955C39.991 31.0387 31.0387 39.991 19.9955 39.991C8.9523 39.991 0 31.0387 0 19.9955Z" 
                fill="#707070" 
                fill-opacity="0.1"
            />

            <G transform="translate(8, 8)">
                <Path 
                    d="M4 9a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4a1 1 0 0 1 1 1v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-4a1 1 0 0 1 1-1h4a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-4a1 1 0 0 1-1-1V4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4a1 1 0 0 1-1 1z"
                    fill="none"
                    stroke="#707070"
                    stroke-width="1.66629" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                />
            </G>
        </Svg>
    );
}
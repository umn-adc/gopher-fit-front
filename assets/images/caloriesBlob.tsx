import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function CaloriesBlob() {
    const gradientId = "calories";

    return (
        <Svg width="80" height="80" viewBox="0 0 48 48" fill="none">
            <Path 
                d="M0 16C0 7.16346 7.16345 0 16 0H31.9965C40.833 0 47.9965 7.16345 47.9965 16V31.9965C47.9965 40.833 40.8331 47.9965 31.9965 47.9965H16C7.16346 47.9965 0 40.8331 0 31.9965V16Z" 
                fill={`url(#${gradientId})`}
            />
            <Path 
                d="M23.998 14.9989C24.6646 17.6654 25.9979 19.8319 27.9977 21.4984C29.9976 23.165 30.9975 24.9982 30.9975 26.998C30.9975 28.8544 30.2601 30.6348 28.9474 31.9474C27.6348 33.2601 25.8544 33.9975 23.998 33.9975C22.1416 33.9975 20.3613 33.2601 19.0486 31.9474C17.736 30.6348 16.9985 28.8544 16.9985 26.998C16.9985 25.9163 17.3494 24.8637 17.9985 23.9983C17.9985 24.6612 18.2618 25.2971 18.7306 25.7659C19.1994 26.2347 19.8353 26.4981 20.4983 26.4981C21.1613 26.4981 21.7971 26.2347 22.2659 25.7659C22.7347 25.2971 22.9981 24.6612 22.9981 23.9983C22.9981 21.9984 21.4982 20.9985 21.4982 18.9986C21.4982 17.6654 22.3315 16.3321 23.998 14.9989Z" 
                stroke="white" 
                stroke-width="1.99985" 
                stroke-linecap="round" 
                stroke-linejoin="round"
            />
            
            <Defs>
                <LinearGradient id={gradientId} x1="0" y1="0" x2="47.9965" y2="47.9965" gradientUnits="userSpaceOnUse">
                    <Stop stop-color="#FF6900"/>
                    <Stop offset="1" stop-color="#FB2C36"/>
                </LinearGradient>
            </Defs>
        </Svg>
    );
}
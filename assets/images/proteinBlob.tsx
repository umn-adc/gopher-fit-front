import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

export default function ProteinBlob() {
    const gradientId = "protein";

    return (
        <Svg width="80" height="80" viewBox="0 0 48 48" fill="none">
            <Path 
                d="M0 16C0 7.16346 7.16345 0 16 0H31.9965C40.833 0 47.9965 7.16345 47.9965 16V31.9965C47.9965 40.833 40.8331 47.9965 31.9965 47.9965H16C7.16346 47.9965 0 40.8331 0 31.9965V16Z" 
                fill={`url(#${gradientId})`}
            />
            <Path 
                d="M14.999 13.9991V20.9991C14.999 22.0991 15.899 22.9991 16.999 22.9991H20.999C21.5295 22.9991 22.0382 22.7884 22.4132 22.4133C22.7883 22.0383 22.999 21.5296 22.999 20.9991V13.9991" 
                stroke="white" 
                stroke-width="1.99985" 
                stroke-linecap="round" 
                stroke-linejoin="round"
            />
            <Path 
                d="M18.9985 13.999V33.9975" 
                stroke="white" 
                stroke-width="1.99985" 
                stroke-linecap="round" 
                stroke-linejoin="round"
            />
            <Path 
                d="M32.9977 26.998V13.999C31.6717 13.999 30.4 14.5257 29.4624 15.4633C28.5248 16.401 27.998 17.6726 27.998 18.9986V24.9982C27.998 26.0981 28.898 26.998 29.9979 26.998H32.9977ZM32.9977 26.998V33.9975" 
                stroke="white" 
                stroke-width="1.99985" 
                stroke-linecap="round" 
                stroke-linejoin="round"
            />

            <Defs>
                <LinearGradient id={gradientId} x1="0" y1="0" x2="47.9965" y2="47.9965" gradientUnits="userSpaceOnUse">
                    <Stop stop-color="#2B7FFF"/>
                    <Stop offset="1" stop-color="#00B8DB"/>
                </LinearGradient>
            </Defs>
        </Svg>
    );
}
import Svg, { Path, G } from "react-native-svg";

export default function FunctionalIcon() {
    return (
        <Svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <Path 
                d="M0 19.9955C0 8.9523 8.9523 0 19.9955 0C31.0387 0 39.991 8.9523 39.991 19.9955C39.991 31.0387 31.0387 39.991 19.9955 39.991C8.9523 39.991 0 31.0387 0 19.9955Z" 
                fill="#52ff33" 
                fill-opacity="0.1"
            />

            <G transform="translate(8, 8)">
                <Path 
                    d="m14.479 19.374-.971.939a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5a5.2 5.2 0 0 1-.219 1.49"
                    fill="none"
                    stroke="#52ff33" 
                    stroke-width="1.66629" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                />
                <Path 
                    d="M15 15h6"
                    stroke="#52ff33" 
                    stroke-width="1.66629" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                />
                <Path 
                    d="M18 12v6"
                    stroke="#52ff33" 
                    stroke-width="1.66629" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                />
            </G>
        </Svg>
    );
}
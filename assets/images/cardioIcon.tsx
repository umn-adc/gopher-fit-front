import Svg, { Path } from "react-native-svg";

export default function CardioIcon() {
    return (
        <Svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <Path 
                d="M0 19.9955C0 8.9523 8.9523 0 19.9955 0C31.0387 0 39.991 8.9523 39.991 19.9955C39.991 31.0387 31.0387 39.991 19.9955 39.991C8.9523 39.991 0 31.0387 0 19.9955Z" 
                fill="#FFCC33" 
                fill-opacity="0.1"
            />
            <Path 
                d="M23.3281 15.8298H28.327V20.8287" 
                stroke="#FFCC33" 
                stroke-width="1.66629" 
                stroke-linecap="round" 
                stroke-linejoin="round"
            />
            <Path 
                d="M28.327 15.8298L21.2452 22.9116L17.0795 18.7458L11.6641 24.1613" 
                stroke="#FFCC33" 
                stroke-width="1.66629" 
                stroke-linecap="round" 
                stroke-linejoin="round"
            />
        </Svg>
    );
}

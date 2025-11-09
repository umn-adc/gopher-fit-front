import Constants from 'expo-constants';
import Home from "@/screens/Home";
import StoryBookUI from "../../.rnstorybook";

// Read the flag injected via app.config.js. Different Expo versions expose
// the runtime config on different properties — try expoConfig first, fall
// back to manifest for older SDKs.
const isStorybook = Constants.expoConfig?.extra?.storybookEnabled === 'true';

export default function HomeScreen() {
	return isStorybook ? <StoryBookUI /> : <Home />;
}
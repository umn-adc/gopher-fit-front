import { Tabs } from "expo-router";
import { PlatformPressable } from "@react-navigation/elements";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconName } from "../../components/Design";
import { palette } from "../../constants/Design";

const tabs: { name: string; title: string; icon: IconName }[] = [
  { name: "index", title: "Home", icon: "home" },
  { name: "nutrition", title: "Nutrition", icon: "utensils" },
  { name: "workouts", title: "Workouts", icon: "dumbbell" },
  { name: "social", title: "Social", icon: "trophy" },
  { name: "profile", title: "Profile", icon: "user" },
];
export default function TabLayout() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const edge = Math.max(12, (width - 560) / 2);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: palette.background },
        tabBarActiveTintColor: palette.maroon,
        tabBarInactiveTintColor: palette.muted,
        tabBarActiveBackgroundColor: palette.maroonSoft,
        tabBarHideOnKeyboard: true,
        tabBarLabelPosition: "below-icon",
        tabBarButton: ({ style, ...props }) => (
          <PlatformPressable
            {...props}
            style={[style, { borderRadius: 18, paddingHorizontal: 0 }]}
          />
        ),
        tabBarStyle: {
          position: "absolute",
          left: edge,
          right: edge,
          bottom: Math.max(12, insets.bottom),
          height: 82,
          paddingBottom: 0,
          paddingTop: 0,
          backgroundColor: palette.surface,
          borderRadius: 24,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: palette.border,
          elevation: 5,
          shadowColor: "#252025",
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 8,
          shadowOpacity: 0.12,
        },
        tabBarItemStyle: {
          marginVertical: 10,
          marginHorizontal: width < 360 ? 2 : 4,
          borderRadius: 18,
          overflow: "hidden",
          paddingVertical: 5,
        },
        tabBarLabelStyle: {
          fontSize: width < 360 ? 10 : 12,
          lineHeight: 18,
          fontWeight: "400",
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => (
              <Icon name={tab.icon} size={24} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

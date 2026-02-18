import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Home, Utensils, Dumbbell, Users, User, LucideIcon } from 'lucide-react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';



const TabNavigator: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  // Icon mapping - maps screen names to Lucide icons
  const getIcon = (routeName: string): LucideIcon => {
    const iconMap: Record<string, LucideIcon> = {
      'index': Home,
      'nutrition': Utensils,
      'workouts': Dumbbell,
      'social': Users,
      'two': User,
      'profile': User,
    };
    
    return iconMap[routeName] || Home;
  };

  // Label mapping - gets clean labels for each route
  const getLabel = (routeName: string, options: any): string => {
    const labelMap: Record<string, string> = {
      'index': 'Home',
      'two': 'Profile',
      'nutrition': 'Nutrition',
      'workouts': 'Workouts',
      'social': 'Social',
    };
    
    // Use custom label if provided, otherwise use mapped label
    return options.title || labelMap[routeName] || routeName;
  };

  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = getLabel(route.name, options);
        const Icon = getIcon(route.name);
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
            activeOpacity={0.7}
          >
            <View style={[
              styles.iconContainer,
              isFocused && styles.activeIconContainer
            ]}>
              <Icon
                size={24}
                color={isFocused ? '#8B4E5C' : '#9CA3AF'}
                strokeWidth={2}
              />
            </View>
            <Text style={[
              styles.label,
              isFocused && styles.activeLabel
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingBottom: 4, // Extra padding for iOS safe area
    marginHorizontal: 20, // More space from screen edges
    marginBottom: 25, // More float above bottom
    borderRadius: 28, // More rounded for modern look
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
    position: 'relative',
    zIndex: 999,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginBottom: 4,
  },
  activeIconContainer: {
    backgroundColor: '#F9E6EA', // Light pink background
  },
  label: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 2,
  },
  activeLabel: {
    color: '#8B4E5C',
    fontWeight: '600',
  },
});

export default TabNavigator;
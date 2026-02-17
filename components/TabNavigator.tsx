import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Home, Utensils, Dumbbell, Users, User, LucideIcon } from 'lucide-react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';


const TabNavigator: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const iconMap: Record<string, LucideIcon> = {
    'index': Home,          
    'nutrition': Utensils,  
    'workouts': Dumbbell,   
    'social': Users,        
    'two': User,            
  };

  
  const labelMap: Record<string, string> = {
    'index': 'Home',
    'nutrition': 'Nutrition',
    'workouts': 'Workouts',
    'social': 'Social',
    'two': 'Profile',
  };

  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = labelMap[route.name] || options.title || route.name;
        const Icon = iconMap[route.name] || Home;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
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
    paddingVertical: 8,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
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
    backgroundColor: '#F9E6EA',
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
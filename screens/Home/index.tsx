import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedScrollHandler, interpolate, Extrapolate, withTiming } from 'react-native-reanimated';

import { View } from "@components/Themed";

import EditScreenInfo from "@components/EditScreenInfo";
import { StatsBlob } from "@components/StatsBlob";
import CaloriesBlob from "@assets/images/caloriesBlob";
import ProteinBlob from "@assets/images/proteinBlob";
import StreaksBlob from "@assets/images/streaksBlob";
import WorkoutsBlob from "@assets/images/workoutsBlob";

import { DailyNutrition } from "@components/DailyNutrition";
import { TodaysWorkout } from "@components/TodaysWorkout";
import { GoalsProgress } from "@components/GoalsProgress";

import { FunctionButton } from "@components/FunctionButton";
import ScanIcon from "@assets/images/scanIcon";
import BuddyIcon from "@assets/images/buddyIcon";
import TrophyIcon from "@assets/images/trophyIcon";
import RibbonIcon from "@assets/images/ribbonIcon";

export default function Home() {
  const nutritionData = [
    { id: "Calories", curr: 1090, goal: 6133 },
    { id: "Carbs", curr: 210, goal: 250 },
    { id: "Protein", curr: 120, goal: 150 },
    { id: "Fats", curr: 55, goal: 65 },
  ];

  const workoutData = [
    { id: 1, category: "a", time: 45, target: "Weightlifting" },
    { id: 2, category: "Strength Training", time: 45, target: "Bodyweight" },
    { id: 3, category: "Cardio", time: 60, target: "Running" },
    { id: 4, category: "Cardio", time: 30, target: "Swimming" },
    { id: 5, category: "Cardio", time: 180, target: "Cycling" },
    { id: 6, category: "Cardio", time: 30, target: "Rowing" },
    { id: 7, category: "Functional", time: 30, target: "Yoga" },
    { id: 8, category: "Functional", time: 30, target: "Stretching" },
    { id: 9, category: "Functional", time: 30, target: "Balance Training" },
  ];

  const goalsData = [
    { id: "Build Muscle", curr: 65, goal: 100 },
    { id: "Improve Flexibility", curr: 75, goal: 100 },
    { id: "Athletic Performance", curr: 85, goal: 100 },
  ];

  const SCROLL_THRESHOLD = 100;
  const scrollY = useSharedValue(0);
  const initialAnimation1 = useSharedValue(0);
  const initialAnimation2 = useSharedValue(0);

  useEffect(() => {
    initialAnimation1.value = withTiming(1, { duration: 600 });
    initialAnimation2.value = withTiming(1, { duration: 800 });
  }, [initialAnimation1, initialAnimation2]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const createAnimatedStyle = (offset: number) => useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [offset, offset + SCROLL_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [offset, offset + SCROLL_THRESHOLD],
      [50, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const animatedStyle1 = useAnimatedStyle(() => {
    const initialOpacity = initialAnimation1.value;
    const initialTranslateY = interpolate(initialAnimation1.value, [0, 1], [50, 0], Extrapolate.CLAMP);
    
    return {
      opacity: initialOpacity,
      transform: [{ translateY: initialTranslateY }],
    };
  });
  
  const animatedStyle2 = useAnimatedStyle(() => {
    const initialOpacity = initialAnimation2.value;
    const initialTranslateY = interpolate(initialAnimation2.value, [0, 1], [50, 0], Extrapolate.CLAMP);
    
    return {
      opacity: initialOpacity,
      transform: [{ translateY: initialTranslateY }],
    };
  });

  const animatedStyle3 = createAnimatedStyle(100);
  const animatedStyle4 = createAnimatedStyle(1050);
  const animatedStyle5 = createAnimatedStyle(1325);

  return (
      <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}>
        <View style={styles.container}>

          {/* Stats Blobs Components with calories, protein, workouts, and the streak */}
          <Animated.View style={[styles.groupedButtons, animatedStyle1]}>
            <StatsBlob numerator={1847} goal={6133} unit="kcal" stat="Calories" Icon={CaloriesBlob} /> 
            <StatsBlob numerator={120} goal={150} unit="g" stat="Protein" Icon={ProteinBlob} />
            <StatsBlob numerator={3} goal={5} unit="this week" stat="Workouts" Icon={WorkoutsBlob} />
            <StatsBlob numerator={5} unit="days" stat="Streak" Icon={StreaksBlob} />
          </Animated.View>

          {/* Daily Nutrition Component with calories, carbs, protein, and fats */}
          <Animated.View style={animatedStyle2}>
            <DailyNutrition goals={nutritionData} />
          </Animated.View>

          {/* Today's Workout Component with scheduled activities */}
          <Animated.View style={animatedStyle3}>
            <TodaysWorkout purpose={"Football"} workouts={workoutData} />
          </Animated.View>

          {/* Goals Progress Component with muscle, flexibility, and athletic trackers */}
          <Animated.View style={animatedStyle4}>
            <GoalsProgress progress={goalsData} />
          </Animated.View>

          {/* Buttons Component with scan, buddy, leaderboard, and achievement functions */}
          <Animated.View style={[styles.groupedButtons, animatedStyle5]}>
            <FunctionButton Icon={ScanIcon} title="Scan at RecWell" description="Body composition check" /> 
            <FunctionButton Icon={BuddyIcon} title="Find Workout Buddy" description="Match with athletes" />
            <FunctionButton Icon={TrophyIcon} title="Leaderboard" description="See your ranking" />
          <FunctionButton Icon={RibbonIcon} title="Achievements" description="View your badges" />
          </Animated.View>

          <EditScreenInfo path="screens/Home/index.tsx" />

        </View>
      </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  groupedButtons: {
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "center", 
    gap: 20, 
    marginTop: 10,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});

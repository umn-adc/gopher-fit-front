import { useEffect, useRef } from "react";
import { View, Text } from "../Themed";
import { Animated } from "react-native";

import { styles } from "./styles";

interface NutritionGoal {
    id: string,
    curr: number,
    goal: number,
}

interface Props {
    goals: NutritionGoal[]
}

export function DailyNutrition(props: Props) {
    let { goals } = props;

    // Sanitize input to ensure current and goal values are non-negative
    goals = goals.map(goal => {
        const validCurr = Math.max(goal.curr, 0);
        const validGoal = Math.max(goal.goal, 0);
        return {
            ...goal,
            curr: validCurr,
            goal: Math.max(validGoal, validCurr),
        }
    });

    const progressFill = useRef(new Animated.Value(0)).current;
    const maxValue = goals[0].goal ?? goals[0].curr;
    
    useEffect(() => {
        Animated.timing(progressFill, {
            toValue: Math.min(maxValue, goals[0].curr),
            duration: 500,
            useNativeDriver: false,
        }).start();
    }, [progressFill, maxValue, goals[0].curr]);

    const width = progressFill.interpolate({
        inputRange: [0, maxValue],
        outputRange: ['0%', '100%'],
        extrapolate: "clamp",
    });

    return (
        <View style={styles.blob}>
            <View style={styles.line}>
                <Text style={styles.title}>Daily Nutrition</Text>

                { goals[0].curr <= goals[0].goal ? (
                    <Text style={styles.counter}>{goals[0].goal - goals[0].curr} left</Text>
                ) : (
                    <Text style={{ 
                        ...styles.counter, 
                        backgroundColor: "#00C9501A",
                        color: "#00A63E",
                     }}> 
                        Goal Met! {goals[0].curr - goals[0].goal} over
                    </Text>
                )}
            </View>

            <View style={{ ...styles.line, margin: 20 }}>
                <Text style={styles.info}>{goals[0].id}:</Text>
                <Text style={styles.info}>{goals[0].curr} / {goals[0].goal} kcal</Text>
            </View>

            <View style={styles.bar}>
                <Animated.View style={[styles.progress, { width }]} />
            </View>

            <View style={styles.statsBox}>
                {goals.slice(1).map((goal) => (
                    <View key={goal.id} style={styles.statsColumns}>
                        <Text style={styles.info}>{goal.id}:</Text>
                        <Text style={styles.current}>{goal.curr}g</Text>
                        <Text style={styles.info}>/ {goal.goal}g</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}
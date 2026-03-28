import { useEffect, useRef } from "react";
import { View, Text } from "./Themed";
import { Animated, StyleSheet } from "react-native";

interface NutritionGoal {
    id: string,
    curr: number,
    goal: number,
}

interface Props {
    goals: NutritionGoal[]
}

export function DailyNutrition(props: Props) {
    const { goals } = props;

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
                <Text style={styles.counter}>{goals[0].goal - goals[0].curr} left</Text>
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
                    <View key={goal.id} style={styles.statsColumns }>
                        <Text style={styles.info}>{goal.id}:</Text>
                        <Text style={styles.current}>{goal.curr}g</Text>
                        <Text style={styles.info}>/ {goal.goal}g</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    blob: {
        width: 390.7,
        height: 240.11,
        backgroundColor: "white",
        borderWidth: 1.5,
        borderColor: "#ccc",
        borderRadius: 30,
    },
    line: {
        flexDirection: "row", 
        justifyContent: "space-between", 
        backgroundColor: "transparent"
    },
    title: {
        color: "black",
        fontWeight: "bold",
        fontSize: 20,
        marginTop: 20,
        marginLeft: 20,
    },
    counter: {
        color: "black",
        fontSize: 16,
        fontWeight: "bold",
        marginTop: 20,
        marginRight: 20,
        borderWidth: 1.5,
        borderColor: "#ccc",
        borderRadius: 20,
        padding: 5
    },
    info: {
        color: "gray",
        fontSize: 16,
    },
    current: {
        color: "black",
        fontSize: 24,
        fontWeight: "bold",
    },
    bar: {
        width: 350.7,
        height: 10,
        borderRadius: 20,
        marginLeft: 20,
        backgroundColor: "#e2cacf",
    },
    progress: {
        height: 10, 
        borderRadius: 20, 
        backgroundColor: "#7A0019" 
    },
    statsBox: {
        backgroundColor: "transparent",
        flexDirection: "row", 
        justifyContent: "space-between", 
        marginHorizontal: 40
    },
    statsColumns: {
        backgroundColor: "transparent",
        flexDirection: "column", 
        alignItems: "center",
        marginTop: 20,
    }
});
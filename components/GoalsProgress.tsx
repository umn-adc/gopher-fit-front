import { useEffect, useRef } from "react";
import { View, Text } from "./Themed";
import { Animated, StyleSheet } from "react-native";

import Target from "@assets/images/target";

interface GoalData {
    id: string,
    curr: number,
    goal: number,
}

interface Props {
    progress: GoalData[],
}

export function GoalsProgress(props: Props) {
    const { progress } = props;

    // Create an array of Animated.Values, one for each goal
    const animatedValues = useRef<Animated.Value[]>(
        progress.map(() => new Animated.Value(0))
    ).current;

    // Update the array if progress length changes (though ideally it shouldn't)
    useEffect(() => {
        if (animatedValues.length !== progress.length) {
            animatedValues.splice(0, animatedValues.length, ...progress.map(() => new Animated.Value(0)));
        }
    }, [progress.length, animatedValues]);

    // Animate each value independently
    useEffect(() => {
        progress.forEach((goal, index) => {
            const maxValue = goal.goal;
            const targetValue = Math.min(maxValue, goal.curr);
            Animated.timing(animatedValues[index], {
                toValue: targetValue,
                duration: 500,
                useNativeDriver: false,
            }).start();
        });
    }, [progress, animatedValues]);

    return (
        <View style={styles.blob}>
            <View style={{ flexDirection: "row", backgroundColor: "transparent" }}>
                <View style={styles.target}>
                    <Target />
                </View>

                <Text style={styles.title}>Goals Progress</Text>
            </View>

            {progress.map((goal, index) => {
                const width = animatedValues[index].interpolate({
                    inputRange: [0, goal.goal],
                    outputRange: ['0%', '100%'],
                    extrapolate: "clamp",
                });
                
                return (
                    <View key={goal.id} style={{ backgroundColor: "transparent" }}>
                        <View style={styles.barCaption}>
                            <Text style={styles.info}>{goal.id}</Text>
                            <Text style={styles.info}>{Math.round((goal.curr / goal.goal) * 100)}%</Text>
                        </View>

                        <View style={styles.bar}>
                            <Animated.View style={[styles.progress, { width }]} />
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    blob: {
        width: 390.7,
        height: 255.1,
        backgroundColor: "white",
        borderWidth: 1.5,
        borderColor: "#ccc",
        borderRadius: 30,
    },
    target: {
        width: 40,
        height: 40,
        marginTop: 24,
        marginLeft: 20,
        backgroundColor: "transparent",
    },
    title: {
        color: "black",
        fontWeight: "bold",
        fontSize: 20,
        marginTop: 20,
    },
    barCaption: {
        flexDirection: "row", 
        justifyContent: "space-between", 
        backgroundColor: "transparent",
        marginHorizontal: 20,
    },
    info: {
        color: "gray",
        fontSize: 16,
        marginTop: 20,
    },
    bar: {
        width: 350.7,
        height: 10,
        borderRadius: 20,
        marginTop: 5,
        marginLeft: 20,
        backgroundColor: "#e2cacf",
    },
    progress: {
        height: 10, 
        borderRadius: 20, 
        backgroundColor: "#7A0019",
    },
});
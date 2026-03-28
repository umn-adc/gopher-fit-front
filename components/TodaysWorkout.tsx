import React from 'react';
import { View, Text } from './Themed';
import { StyleSheet, TouchableOpacity } from "react-native";

import CardioIcon from '@assets/images/cardioIcon';
import StrengthIcon from '@assets/images/strengthIcon';

interface Workout {
    id: number,
    category: string,
    time: number,
    target: string,
}

interface Props {
    purpose: string,
    workouts: Workout[],
}

function chooseIcon(workout: Workout) {
    switch(workout.category) {
        case "Strength Training":
            return <StrengthIcon />;
        case "Cardio":
            return <CardioIcon />;
        case "Functional":
            return <CardioIcon />;
        default:
            return <CardioIcon />;
    }
}

export function TodaysWorkout(props: Props) {
    return (
        <View>
            { props.workouts.length === 0 ? (
                <View style={{ ...styles.blob, height: 165.13 }}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Today&apos;s Workout</Text>
                        <Text style={styles.purpose}>{props.purpose}</Text>
                    </View>

                    <View style={{ backgroundColor: "transparent" }}>
                        <TouchableOpacity style={{ ...styles.workout, justifyContent: "center", alignItems: "center", }}>
                            <Text style={{ color: "black", fontSize: 20 }}>
                                😴 No Workout&apos;s Scheduled 😴
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={{ ...styles.blob, height: 165.13 + 95.98 * (props.workouts.length - 1) }}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Today&apos;s Workout</Text>
                        <Text style={styles.purpose}>{props.purpose}</Text>
                    </View>

                    {props.workouts.map((workout) => (
                        <TouchableOpacity key={workout.id} style={styles.workout}>
                            <div style={styles.icon}>
                                {chooseIcon(workout)}
                            </div>
                            
                            <View style={{ marginTop: 20, marginLeft: 20, backgroundColor: "transparent" }}>
                                <Text style={styles.target}>{workout.target}</Text>
                                <Text style={styles.subtext}>{workout.time} min • {workout.category}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    blob: {
        width: 390.7,
        backgroundColor: "white",
        borderWidth: 1.5,
        borderColor: "#ccc",
        borderRadius: 30,
    },
    header: {
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
    purpose: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
        marginTop: 20,
        marginRight: 20,
        borderRadius: 20,
        paddingHorizontal: 10,
        backgroundColor: "#7A0019",
    },
    workout: {
        width: 350.7,
        height: 75.98,
        marginTop: 20,
        marginLeft: 20,
        backgroundColor: "#ffcc3311",
        borderRadius: 30,
        flexDirection: "row",
    },
    icon: {
        marginTop: 20,
        marginLeft: 20,
    },
    target: {
        color: "black",
        fontSize: 16,
    },
    subtext: {
        color: "gray",
        fontSize: 14,
    }

});
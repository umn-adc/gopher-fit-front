import React from 'react';
import { View, Text } from '../Themed';
import { TouchableOpacity } from "react-native";

import { styles } from "./styles";

import CardioIcon from '@assets/images/cardioIcon';
import StrengthIcon from '@assets/images/strengthIcon';
import FunctionalIcon from '@assets/images/functionalIcon';
import TemplateIcon from '@assets/images/templateIcon';

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
            return <FunctionalIcon />;
        default:
            return <TemplateIcon />;
    }
}

export function TodaysWorkout(props: Props) {
    let { purpose, workouts } = props;

    workouts = workouts.map(workout => ({
        ...workout,
        category: workout.category.slice(0, 29),
        time: Math.max(workout.time, 0),
        target: workout.target.slice(0, 32),
    }));

    purpose = purpose.slice(0, 16); // Limit purpose to 16 characters to prevent overflow


    return (
        <View>
            { workouts.length === 0 ? (
                <View style={{ ...styles.blob, height: 165.13 }}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Today&apos;s Workout</Text>
                        <Text style={styles.purpose}>{purpose}</Text>
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
                <View style={{ ...styles.blob, height: 165.13 + 95.98 * (workouts.length - 1) }}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Today&apos;s Workout</Text>
                        <Text style={styles.purpose}>{purpose}</Text>
                    </View>

                    {workouts.map((workout) => (
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
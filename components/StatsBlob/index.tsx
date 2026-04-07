import React, { useEffect, useRef } from "react";
import { Text, View } from "../Themed";
import { Animated, TouchableOpacity } from "react-native";
import { SvgProps } from "@node_modules/react-native-svg/lib/typescript";

import { styles } from "./styles";

interface Props {
    numerator: number;
    goal?: number;
    unit: string;
    stat: string;
    Icon: React.FC<SvgProps>
}

export function StatsBlob(props: Props) {
    const { numerator, goal, unit, stat, Icon } = props;

    const progressFill = useRef(new Animated.Value(0)).current;
    const maxValue = goal ?? numerator;

    useEffect(() => {
        Animated.timing(progressFill, {
            toValue: Math.min(maxValue, numerator),
            duration: 500,
            useNativeDriver: false,
        }).start();
    }, [progressFill, maxValue, numerator]);

    const width = progressFill.interpolate({
        inputRange: [0, maxValue],
        outputRange: ['0%', '100%'],
        extrapolate: "clamp",
    });

    return (
        <TouchableOpacity style={styles.blobs}>
            <div style={styles.icons}>
                <Icon />
            </div>

            <Text style={styles.titles}>{stat}</Text>

            { goal ? (
                <Text>
                    <Text style={styles.stats}>
                        <Text style={styles.current}>{numerator}</Text> / {goal} {unit}
                    </Text>
                    
                    <View style={styles.bar}>
                        <Animated.View style={[styles.progress, { width }]} />
                    </View>
                </Text>
            ) : (
                <Text style={styles.stats}>
                    <Text style={styles.current}>{numerator}</Text> {unit}
                </Text>
            )}
        </TouchableOpacity>
    );
}
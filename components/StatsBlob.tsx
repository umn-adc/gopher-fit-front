import React from "react";
import { Text, View } from "./Themed";
import { StyleSheet } from "react-native";
import { SvgProps } from "@node_modules/react-native-svg/lib/typescript";

interface props {
    numerator: number;
    goal?: number;
    unit: string;
    stat: string;
    Icon: React.FC<SvgProps>
}

export function StatsBlob(props: props) {
    return (
        <View style={styles.blobs}>

            <div style={styles.icons}>
                <props.Icon />
            </div>

            <Text style={styles.titles}>{props.stat}</Text>

            { props.goal ? (
                <Text>
                    <Text style={styles.stats}>
                        <Text style={styles.current}>{props.numerator}</Text> / {props.goal} {props.unit}
                    </Text>
                    
                    <View style={styles.bar}>
                            <View style={{
                                width: (props.numerator / props.goal) * 150,
                                height: 10,
                                borderRadius: 20,
                                backgroundColor: "#7A0019"
                            }} />
                    </View>
                </Text>
            ) : (
                <Text style={styles.stats}>
                    <Text style={styles.current}>{props.numerator}</Text> {props.unit}
                </Text>
            )}


        </View>
    );
}

const styles = StyleSheet.create({
    blobs: {
        width: 187.36,
        height: 249.13,
        backgroundColor: "white",
        borderRadius: 30,
    },
    icons: {
        marginLeft: 20,
        marginTop: 20,
    },
    titles: {
        color: "gray",
        fontSize: 16,
        marginTop: 20,
        marginLeft: 20,
    },
    stats: {
        color: "gray",
        fontSize: 16,
        marginLeft: 20, 
    },
    current: {
        color: "black",
        fontSize: 24,
        fontWeight: "bold",
    },
    bar: {
        width: 150,
        height: 10,
        borderRadius: 20,
        marginLeft: 20, 
        marginTop: 25,
        backgroundColor: "#e2cacf",
    }
});
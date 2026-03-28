import React from "react";
import { Text } from "./Themed"
import { StyleSheet, TouchableOpacity } from "react-native";
import { SvgProps } from "@node_modules/react-native-svg/lib/typescript";

interface props {
    Icon: React.FC<SvgProps>
    title: string;
    description: string;
}

export function FunctionButton(props: props) {
    return (
        <TouchableOpacity style={styles.blobs}>

            <div style={styles.icons}>
                <props.Icon />
            </div>

            <Text style={styles.title}>{props.title}</Text>
            <Text style={styles.stats}>{props.description}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    blobs: {
        width: 187.36,
        height: 249.13,
        backgroundColor: "white",
        borderWidth: 1.5,
        borderColor: "#ccc",
        borderRadius: 30,
    },
    icons: {
        marginLeft: 20,
        marginTop: 20,
    },
    title: {
        color: "black",
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 20,
        marginLeft: 20,
    },
    stats: {
        color: "gray",
        fontSize: 16,
        marginTop: 20,
        marginLeft: 20, 
    },
});
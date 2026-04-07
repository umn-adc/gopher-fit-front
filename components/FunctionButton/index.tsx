import React from "react";
import { Text } from "../Themed"
import { TouchableOpacity } from "react-native";
import { SvgProps } from "@node_modules/react-native-svg/lib/typescript";

import { styles } from "./styles";

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
import { View, Text } from 'react-native';
import { StyleSheet } from "react-native";

interface props {
    currCal: number;
    calGoal: number;
    currCarbs: number;
    carbGoal: number;
    currProtein: number;
    proteinGoal: number;
    currFats: number;
    fatsGoal: number;
}

export function DailyNutrition(props: props) {
    return (
        <View style={styles.blob}>
            <Text style={styles.title}>Daily Nutrition</Text>

            <View style={{ flexDirection: "row", justifyContent: "space-between", margin: 20 }}>
                <Text style={styles.info}>Calories:</Text>
                <Text style={styles.info}>{props.currCal} / {props.calGoal} kcal</Text>
            </View>

            <View style={styles.bar}>
                <View style={{ 
                    width: (props.currCal / props.calGoal) * 350.7, 
                    height: 10, 
                    borderRadius: 20, 
                    backgroundColor: "#7A0019" 
                }} />
            </View>

            <View style={styles.statsBox}>
                <View style={{ ...styles.statsColumns, marginLeft: 20 }}>
                    <Text style={{ ...styles.info }}>Carbs:</Text>
                    <Text style={styles.current}>{props.currCarbs}g</Text>
                    <Text style={{ ...styles.info }}>/ {props.carbGoal}g</Text>
                </View>

                <View style={styles.statsColumns}>
                    <Text style={{ ...styles.info }}>Protein:</Text>
                    <Text style={styles.current}>{props.currProtein}g</Text>
                    <Text style={{ ...styles.info }}>/ {props.proteinGoal}g</Text>
                </View>

                <View style={{ ...styles.statsColumns, marginRight: 20 }}>
                    <Text style={{ ...styles.info }}>Fats:</Text>
                    <Text style={styles.current}>{props.currFats}g</Text>
                    <Text style={{ ...styles.info }}>/ {props.fatsGoal}g</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    blob: {
        width: 390.7,
        height: 240.11,
        backgroundColor: "white",
        borderRadius: 30,
    },
    title: {
        color: "black",
        fontWeight: "bold",
        fontSize: 20,
        marginTop: 20,
        marginLeft: 20,
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
    statsBox: {
        flexDirection: "row", 
        justifyContent: "space-between", 
        marginLeft: 20, 
        marginRight: 20
    },
    statsColumns: {
        flexDirection: "column", 
        alignItems: "center",
        marginTop: 20,
    }
});
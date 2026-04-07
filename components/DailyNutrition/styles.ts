import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    blob: {
        width: 390.7,
        height: 260.11,
        backgroundColor: "white",
        borderWidth: 1.5,
        borderColor: "#ccc",
        borderRadius: 30,
    },
    line: {
        flexDirection: "row", 
        justifyContent: "space-between", 
        backgroundColor: "transparent",
    },
    title: {
        color: "black",
        fontWeight: "bold",
        fontSize: 20,
        marginTop: 20,
        marginLeft: 20,
    },
    counter: {
        width: 190,
        color: "black",
        fontSize: 16,
        fontWeight: "bold",
        marginTop: 20,
        marginRight: 20,
        borderWidth: 1.5,
        borderColor: "#ccc",
        borderRadius: 20,
        padding: 5,
        textAlign: "center",
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
        marginHorizontal: 20,
    },
    statsColumns: {
        width: 105,
        backgroundColor: "transparent",
        flexDirection: "column", 
        alignItems: "center",
        marginTop: 15,
        borderWidth: 1.5,
        borderColor: "#ccc",
        borderRadius: 20,
        padding: 10,
    }
});
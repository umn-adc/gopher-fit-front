import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
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
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
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
        width: 175,
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
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
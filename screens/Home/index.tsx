import { StyleSheet, ScrollView } from "react-native";

import EditScreenInfo from "@components/EditScreenInfo";
import { Text, View } from "@components/Themed";

import { StatsBlob } from "@components/StatsBlob";
import CaloriesBlob from "../../assets/images/caloriesBlob";
import ProteinBlob from "../../assets/images/proteinBlob";
import StreaksBlob from "../../assets/images/streaksBlob";
import WorkoutsBlob from "../../assets/images/workoutsBlob";

export default function Home() {
  return (
    <ScrollView>
      <View style={styles.container}>

        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 20, marginTop: 20 }}>
          <StatsBlob numerator={1847} goal={6133} unit="kcal" stat="Calories" Icon={CaloriesBlob} /> 
          <StatsBlob numerator={120} goal={150} unit="g" stat="Protein" Icon={ProteinBlob} />
          <StatsBlob numerator={5} goal={7} unit="" stat="Streaks" Icon={StreaksBlob} />
          <StatsBlob numerator={3} goal={5} unit="this week" stat="Workouts" Icon={WorkoutsBlob} />
        </View>

        <View
          style={styles.separator}
          lightColor="#eee"
          darkColor="rgba(255,255,255,0.1)"
        />

        <Text style={styles.title}>Welcome Home!</Text>

        <View
          style={styles.separator}
          lightColor="#eee"
          darkColor="rgba(255,255,255,0.1)"
        />
        <EditScreenInfo path="screens/Home/index.tsx" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});

import { StyleSheet, ScrollView } from "react-native";

import EditScreenInfo from "@components/EditScreenInfo";
import { Text, View } from "@components/Themed";

import { StatsBlob } from "@components/StatsBlob";
import CaloriesBlob from "../../assets/images/caloriesBlob";
import ProteinBlob from "../../assets/images/proteinBlob";
import StreaksBlob from "../../assets/images/streaksBlob";
import WorkoutsBlob from "../../assets/images/workoutsBlob";

import { DailyNutrition } from "@components/DailyNutrition";

export default function Home() {
  return (
    <ScrollView>
      <View style={styles.container}>

        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 20, marginTop: 20 }}>
          <StatsBlob numerator={1847} goal={6133} unit="kcal" stat="Calories" Icon={CaloriesBlob} /> 
          <StatsBlob numerator={120} goal={150} unit="g" stat="Protein" Icon={ProteinBlob} />
          <StatsBlob numerator={3} goal={5} unit="this week" stat="Workouts" Icon={WorkoutsBlob} />
          <StatsBlob numerator={5} unit="days" stat="Streak" Icon={StreaksBlob} />
        </View>

        <DailyNutrition 
          currCal={1847} calGoal={6133} 
          currCarbs={210} carbGoal={250} 
          currProtein={120} proteinGoal={150} 
          currFats={55} fatsGoal={65} 
        />

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
    gap: 20,
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

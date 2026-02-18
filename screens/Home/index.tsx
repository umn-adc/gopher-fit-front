import { StyleSheet, ScrollView } from "react-native";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import EditScreenInfo from "@components/EditScreenInfo";
import Header from "@components/Header";
import { Text, View } from "@components/Themed";

export default function Home() {
  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome Home!</Text>
        <Header
          title="Hi, Victor! 👋"
          subtitle="Ready to crush your goals today?"
        />
        <Header
          title="Nutrition"
          subtitle="Track your meals and macros"
        />
        <Header
          title="Workouts"
          subtitle="Track your training"
          icon={<MaterialCommunityIcons name="dumbbell" size={24} color="white" />}
        />
        <Header
          title="Social"
          subtitle="Connect and compete"
          icon={<MaterialCommunityIcons name="trophy-variant-outline" size={24} color="white" />}
        />
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
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
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

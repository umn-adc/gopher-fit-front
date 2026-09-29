import { Screen, Section } from "../components/Form";
import { Text } from "../components/Themed";
export default function ModalScreen() {
  return (
    <Screen title="GopherFit">
      <Section>
        <Text>
          Track your meals, macro goals and workouts, and connect with friends.
        </Text>
        <Text>
          Home shows today&apos;s nutrition and workouts from Monday at midnight
          to the following Monday in your device&apos;s local timezone. Workouts
          with unknown dates are excluded.
        </Text>
        <Text>
          Your login is kept in memory. Reloading or restarting the app requires
          logging in again.
        </Text>
      </Section>
    </Screen>
  );
}

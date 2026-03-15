import React from "react";
import { Text, View } from "react-native";
import { styles } from "./styles";

interface HeaderProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  gradientColors?: string[]; // TODO: Add gradient once nativewind has been set up
}


export default function Header({ title, subtitle, icon }: HeaderProps) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  )
}


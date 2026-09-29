import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  Action,
  Feedback,
  Field,
  Loading,
  Screen,
  Section,
  styles,
} from "../../components/Form";
import { ListStatus } from "../../components/ListStatus";
import { ui } from "../../components/Design";
import { Text, View } from "../../components/Themed";
import { api, ApiError, errorMessage } from "../../lib/api";
import type {
  FavoriteMeal,
  MacroInput,
  Macros,
  Meal,
  MealItem,
  MealItemInput,
} from "../../lib/api-types";
import { usePagedList, useTask } from "../../lib/hooks";
import { localDate, name, numberValue } from "../../lib/validation";
import { favoriteInput, logFavoriteInput, mealInput } from "../../lib/writes";
const newMeal = () => ({ date: localDate(), meal_type: "", time: "" });
export default function Nutrition() {
  const list = usePagedList<Meal>("/nutrition/meals");
  const favorites = usePagedList<FavoriteMeal>("/nutrition/favorites");
  const [editing, setEditing] = useState<Meal | "new" | null>(null);
  const [draft, setDraft] = useState(newMeal);
  const task = useTask();
  function edit(meal: Meal | "new") {
    setEditing(meal);
    setDraft(
      meal === "new"
        ? newMeal()
        : { date: meal.date, meal_type: meal.meal_type, time: meal.time },
    );
    task.setError("");
    task.setMessage("");
  }
  return (
    <Screen
      title="Nutrition"
      subtitle="Fuel your goals"
      icon="utensils"
      colors={["#268bff", "#00b6d5"]}
    >
      <MacroGoals />
      <Section title="Favorite meals">
        <Text style={ui.muted}>
          Save a meal you eat often, then log it again on any day.
        </Text>
        {favorites.items.map((favorite) => (
          <FavoriteCard
            key={favorite.id}
            favorite={favorite}
            refresh={favorites.reload}
            onLogged={list.reload}
          />
        ))}
        <ListStatus
          list={favorites}
          empty="No favorites yet. Use Save as favorite on a meal with food items."
        />
      </Section>
      <Section title="Meals">
        <View style={styles.row}>
          <Action
            title="Add meal"
            disabled={task.saving}
            onPress={() => edit("new")}
          />
          <Action
            title="Refresh meals"
            secondary
            disabled={list.loading || task.saving}
            onPress={() => void list.reload()}
          />
        </View>
        <Feedback {...task} />
        {editing && (
          <Section title={editing === "new" ? "New meal" : "Edit meal"}>
            <Field
              label="Meal type"
              placeholder="Breakfast, snack…"
              value={draft.meal_type}
              onChangeText={(meal_type) => setDraft({ ...draft, meal_type })}
            />
            <Field
              label="Date (YYYY-MM-DD)"
              value={draft.date}
              onChangeText={(date) => setDraft({ ...draft, date })}
            />
            <Field
              label="Local time (optional HH:MM)"
              value={draft.time}
              onChangeText={(time) => setDraft({ ...draft, time })}
            />
            <Action
              title={task.saving ? "Saving meal…" : "Save meal"}
              disabled={task.saving}
              onPress={() =>
                void task.run(async () => {
                  const path =
                    editing === "new"
                      ? "/nutrition/meals"
                      : `/nutrition/meals/${editing.id}`;
                  await api.request<Meal | void>(path, {
                    method: editing === "new" ? "POST" : "PUT",
                    body: mealInput(draft),
                  });
                  setEditing(null);
                  setDraft(newMeal());
                  await list.reload();
                })
              }
            />
            <Action
              title="Cancel meal edit"
              secondary
              disabled={task.saving}
              onPress={() => setEditing(null)}
            />
          </Section>
        )}
        {list.items.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            onEdit={() => edit(meal)}
            refresh={list.reload}
            onFavorited={favorites.reload}
          />
        ))}
        <ListStatus
          list={list}
          empty="No meals yet. Add a meal, then log its food items."
        />
      </Section>
    </Screen>
  );
}
const emptyItem = {
  name: "",
  calories: "0",
  protein: "0",
  carbs: "0",
  fat: "0",
};
function MealCard({
  meal,
  onEdit,
  refresh,
  onFavorited,
}: {
  meal: Meal;
  onEdit: () => void;
  refresh: () => Promise<void>;
  onFavorited: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<MealItem | "new" | null>(null);
  const [draft, setDraft] = useState(emptyItem);
  const [deleting, setDeleting] = useState(false);
  const [favoriteName, setFavoriteName] = useState<string | null>(null);
  const task = useTask();
  function edit(item: MealItem | "new") {
    setEditing(item);
    setDraft(
      item === "new"
        ? emptyItem
        : {
            name: item.name,
            calories: String(item.calories),
            protein: String(item.protein),
            carbs: String(item.carbs),
            fat: String(item.fat),
          },
    );
  }
  const path = `/nutrition/meals/${meal.id}`;
  return (
    <Section
      title={`${meal.meal_type} · ${meal.date}${meal.time ? ` ${meal.time}` : ""}`}
    >
      <Text>{meal.total_calories} kcal</Text>
      <View style={styles.row}>
        <Action
          title="Edit meal"
          secondary
          disabled={task.saving}
          onPress={onEdit}
        />
        <Action
          title="Add food"
          secondary
          disabled={task.saving}
          onPress={() => edit("new")}
        />
        <Action
          title="Save as favorite"
          secondary
          disabled={task.saving || !meal.items?.length}
          onPress={() => setFavoriteName(meal.meal_type)}
        />
        <Action
          title="Delete meal"
          secondary
          disabled={task.saving}
          onPress={() => setDeleting(true)}
        />
      </View>
      {favoriteName !== null && (
        <>
          <Field
            label="Favorite name"
            value={favoriteName}
            onChangeText={setFavoriteName}
          />
          <Action
            title={task.saving ? "Saving favorite…" : "Save favorite"}
            disabled={task.saving}
            onPress={() =>
              void task.run(async () => {
                await api.request<FavoriteMeal>("/nutrition/favorites", {
                  method: "POST",
                  body: favoriteInput(
                    { name: favoriteName, meal_type: meal.meal_type },
                    meal.items,
                  ),
                });
                setFavoriteName(null);
                await onFavorited();
              }, "Saved as a favorite.")
            }
          />
          <Action
            title="Cancel favorite"
            secondary
            disabled={task.saving}
            onPress={() => setFavoriteName(null)}
          />
        </>
      )}
      {deleting && (
        <>
          <Text>Delete this meal and all its food items?</Text>
          <Action
            title="Confirm meal deletion"
            disabled={task.saving}
            onPress={() =>
              void task.run(async () => {
                await api.request<void>(path, { method: "DELETE" });
                await refresh();
              })
            }
          />
          <Action
            title="Keep meal"
            secondary
            onPress={() => setDeleting(false)}
          />
        </>
      )}
      <Feedback {...task} />
      {(meal.items ?? []).map((item) => (
        <View key={item.id} style={{ gap: 8, paddingVertical: 8 }}>
          <Text>
            {item.name} · {item.calories} kcal · P {item.protein}g / C{" "}
            {item.carbs}g / F {item.fat}g
          </Text>
          <View style={styles.row}>
            <Action
              title={`Edit ${item.name}`}
              secondary
              disabled={task.saving}
              onPress={() => edit(item)}
            />
            <Action
              title={`Delete ${item.name}`}
              secondary
              disabled={task.saving}
              onPress={() =>
                void task.run(async () => {
                  await api.request<void>(`${path}/items/${item.id}`, {
                    method: "DELETE",
                  });
                  await refresh();
                })
              }
            />
          </View>
        </View>
      ))}
      {!meal.items?.length && <Text>No food items yet.</Text>}
      {editing && (
        <Section title={editing === "new" ? "Add food item" : "Edit food item"}>
          {(Object.keys(emptyItem) as (keyof typeof emptyItem)[]).map((key) => (
            <Field
              key={key}
              label={
                key === "name"
                  ? "Food name"
                  : `${key[0].toUpperCase() + key.slice(1)} (${key === "calories" ? "kcal" : "g"})`
              }
              keyboardType={key === "name" ? "default" : "number-pad"}
              value={draft[key]}
              onChangeText={(value) => setDraft({ ...draft, [key]: value })}
            />
          ))}
          <Action
            title={task.saving ? "Saving food…" : "Save food"}
            disabled={task.saving}
            onPress={() =>
              void task.run(async () => {
                const body: MealItemInput = {
                  name: name(draft.name, "Food name"),
                  calories: numberValue(draft.calories, "Calories"),
                  protein: numberValue(draft.protein, "Protein"),
                  carbs: numberValue(draft.carbs, "Carbs"),
                  fat: numberValue(draft.fat, "Fat"),
                };
                await api.request<MealItem>(
                  `${path}/items${editing === "new" ? "" : `/${editing.id}`}`,
                  { method: editing === "new" ? "POST" : "PUT", body },
                );
                setEditing(null);
                await refresh();
              })
            }
          />
          <Action
            title="Cancel food edit"
            secondary
            disabled={task.saving}
            onPress={() => setEditing(null)}
          />
        </Section>
      )}
    </Section>
  );
}
function FavoriteCard({
  favorite,
  refresh,
  onLogged,
}: {
  favorite: FavoriteMeal;
  refresh: () => Promise<void>;
  onLogged: () => Promise<void>;
}) {
  const [mode, setMode] = useState<"log" | "edit" | "delete" | null>(null);
  const [logDraft, setLogDraft] = useState({
    date: "",
    time: "",
    meal_type: "",
  });
  const [editDraft, setEditDraft] = useState({
    name: favorite.name,
    meal_type: favorite.meal_type,
    items: favorite.items,
  });
  const task = useTask();
  const path = `/nutrition/favorites/${favorite.id}`;
  function open(next: typeof mode) {
    setMode(mode === next ? null : next);
    setLogDraft({ date: localDate(), time: "", meal_type: favorite.meal_type });
    setEditDraft({
      name: favorite.name,
      meal_type: favorite.meal_type,
      items: favorite.items,
    });
    task.setError("");
    task.setMessage("");
  }
  return (
    <Section title={favorite.name}>
      <Text>
        {favorite.meal_type} · {favorite.total_calories} kcal
      </Text>
      <Text style={ui.muted}>
        {favorite.items.length
          ? favorite.items.map((item) => item.name).join(", ")
          : "No food items."}
      </Text>
      <View style={styles.row}>
        <Action
          title="Log favorite"
          accessibilityLabel={`Log ${favorite.name}`}
          disabled={task.saving}
          onPress={() => open("log")}
        />
        <Action
          title="Edit favorite"
          accessibilityLabel={`Edit favorite ${favorite.name}`}
          secondary
          disabled={task.saving}
          onPress={() => open("edit")}
        />
        <Action
          title="Delete favorite"
          accessibilityLabel={`Delete favorite ${favorite.name}`}
          secondary
          disabled={task.saving}
          onPress={() => open("delete")}
        />
      </View>
      {mode === "log" && (
        <>
          <Field
            label="Log date (YYYY-MM-DD)"
            value={logDraft.date}
            onChangeText={(date) => setLogDraft({ ...logDraft, date })}
          />
          <Field
            label="Local time (optional HH:MM)"
            value={logDraft.time}
            onChangeText={(time) => setLogDraft({ ...logDraft, time })}
          />
          <Field
            label="Meal type"
            value={logDraft.meal_type}
            onChangeText={(meal_type) =>
              setLogDraft({ ...logDraft, meal_type })
            }
          />
          <Action
            title={task.saving ? "Logging…" : "Log meal"}
            disabled={task.saving}
            onPress={() =>
              void task.run(async () => {
                const body = logFavoriteInput(logDraft);
                await api.request<Meal>(path + "/log", {
                  method: "POST",
                  body,
                });
                setMode(null);
                await onLogged();
              }, `Logged ${favorite.name} for ${logDraft.date}.`)
            }
          />
        </>
      )}
      {mode === "edit" && (
        <>
          <Field
            label="Favorite name"
            value={editDraft.name}
            onChangeText={(name) => setEditDraft({ ...editDraft, name })}
          />
          <Field
            label="Meal type"
            value={editDraft.meal_type}
            onChangeText={(meal_type) =>
              setEditDraft({ ...editDraft, meal_type })
            }
          />
          {editDraft.items.map((item) => (
            <View key={item.id} style={ui.between}>
              <Text style={{ flex: 1 }}>
                {item.name} · {item.calories} kcal
              </Text>
              <Action
                title="Remove"
                accessibilityLabel={`Remove ${item.name} from favorite`}
                compact
                secondary
                disabled={task.saving}
                onPress={() =>
                  setEditDraft({
                    ...editDraft,
                    items: editDraft.items.filter((kept) => kept !== item),
                  })
                }
              />
            </View>
          ))}
          <Action
            title={task.saving ? "Saving favorite…" : "Save favorite"}
            disabled={task.saving}
            onPress={() =>
              void task.run(async () => {
                await api.request<FavoriteMeal>(path, {
                  method: "PUT",
                  body: favoriteInput(editDraft, editDraft.items),
                });
                setMode(null);
                await refresh();
              }, "Favorite saved.")
            }
          />
        </>
      )}
      {mode === "delete" && (
        <>
          <Text>
            Delete this favorite? Meals already logged from it are kept.
          </Text>
          <Action
            title="Confirm favorite deletion"
            disabled={task.saving}
            onPress={() =>
              void task.run(async () => {
                await api.request<void>(path, { method: "DELETE" });
                await refresh();
              })
            }
          />
          <Action
            title="Keep favorite"
            secondary
            onPress={() => setMode(null)}
          />
        </>
      )}
      <Feedback {...task} />
    </Section>
  );
}
const macroFields = {
  calories_target: "Calories (kcal)",
  protein_target: "Protein (g)",
  carbs_target: "Carbs (g)",
  fat_target: "Fat (g)",
};
const emptyMacros = {
  calories_target: "0",
  protein_target: "0",
  carbs_target: "0",
  fat_target: "0",
};
function MacroGoals() {
  const [draft, setDraft] = useState(emptyMacros);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const task = useTask();
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      setLoading(true);
      setLoadError("");
      api
        .request<Macros>("/nutrition/macros", { signal: controller.signal })
        .then((value) => {
          if (!controller.signal.aborted) {
            setDraft({
              calories_target: String(value.calories_target),
              protein_target: String(value.protein_target),
              carbs_target: String(value.carbs_target),
              fat_target: String(value.fat_target),
            });
            setMissing(false);
          }
        })
        .catch((e) => {
          if (!controller.signal.aborted) {
            if (e instanceof ApiError && e.status === 404) {
              setMissing(true);
              setDraft(emptyMacros);
            } else setLoadError(errorMessage(e));
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
      return () => controller.abort();
    }, [retry]),
  );
  return (
    <Section title="Daily macro targets">
      {loading ? (
        <Loading />
      ) : loadError ? (
        <>
          <Feedback error={loadError} />
          <Action
            title="Retry targets"
            secondary
            onPress={() => setRetry((r) => r + 1)}
          />
        </>
      ) : (
        <>
          {missing && <Text>No targets configured yet.</Text>}
          {(Object.keys(macroFields) as (keyof typeof macroFields)[]).map(
            (key) => (
              <Field
                key={key}
                label={`${macroFields[key]} target`}
                value={draft[key]}
                keyboardType="number-pad"
                onChangeText={(value) => setDraft({ ...draft, [key]: value })}
              />
            ),
          )}
          <Feedback {...task} />
          <Action
            title={task.saving ? "Saving targets…" : "Save targets"}
            disabled={task.saving}
            onPress={() =>
              void task.run(async () => {
                const body: MacroInput = {
                  calories_target: numberValue(
                    draft.calories_target,
                    "Calories target",
                  ),
                  protein_target: numberValue(
                    draft.protein_target,
                    "Protein target",
                  ),
                  carbs_target: numberValue(draft.carbs_target, "Carbs target"),
                  fat_target: numberValue(draft.fat_target, "Fat target"),
                };
                await api.request<Macros>("/nutrition/macros", {
                  method: "PUT",
                  body,
                });
                setMissing(false);
              })
            }
          />
        </>
      )}
    </Section>
  );
}

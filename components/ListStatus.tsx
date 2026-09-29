import { Text } from "./Themed";
import { Action, Feedback, Loading } from "./Form";
export function ListStatus({
  list,
  empty,
}: {
  list: {
    loading: boolean;
    loaded: boolean;
    error: string;
    items: unknown[];
    more: boolean;
    reload: () => Promise<void>;
    loadMore: () => Promise<void>;
  };
  empty: string;
}) {
  return (
    <>
      {list.loading && <Loading />}
      <Feedback error={list.error} />
      {list.error && (
        <Action
          title="Retry loading"
          secondary
          disabled={list.loading}
          onPress={() => void list.reload()}
        />
      )}
      {list.loaded && !list.items.length && <Text>{empty}</Text>}
      {list.more && !list.error && (
        <Action
          title="Load more"
          secondary
          disabled={list.loading}
          onPress={() => void list.loadMore()}
        />
      )}
    </>
  );
}

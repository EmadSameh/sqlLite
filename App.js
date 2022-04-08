import { useState, useEffect } from "react";
import {
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Constants from "expo-constants";
import * as SQLite from "expo-sqlite";

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("db.hi");
  return db;
}

const db = openDatabase();

function Items({ done: doneHeading, onPressItem, onPressDelete }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select * from items where done = ?;`,
        [doneHeading ? 1 : 0],
        (_, { rows: { _array } }) => setItems(_array)
      );
    });
  }, []);

  const heading = doneHeading ? "Completed" : "pending:";

  if (items === null || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      {items.map(({ id, done, value }) => (
        <TouchableOpacity
          key={id}
          style={{
            backgroundColor: done ? "#fff" : "#fff",
            borderColor: "#000",
            borderWidth: 1,
            padding: 8,
          }}
        >
          <Button
            title={done ? "remove" : "done"}
            onPress={() => onPressItem && onPressItem(id)}
          ></Button>
          {!done ? (
            <Button
              title={"Remove"}
              onPress={() => onPressDelete && onPressDelete(id)}
            ></Button>
          ) : null}
          <Text style={{ color: done ? "#000" : "#fff" }}>{value}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function App() {
  const [text, setText] = useState(null);
  const [forceUpdate, forceUpdateId] = useForceUpdate();

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "create table if not exists items (id integer primary key not null, done int, value text);"
      );
    });
  }, []);

  const add = (text) => {
    // is text empty?
    if (text === null || text === "") {
      return false;
    }

    db.transaction(
      (todo) => {
        todo.executeSql("insert into items (done, value) values (0, ?)", [
          text,
        ]);
        todo.executeSql("select * from items", [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
        );
      },
      null,
      forceUpdate
    );
  };

  return (
    <View style={styles.container}>
      {Platform.OS === "web" ? (
        <View
          style={{ flex: 5, justifyContent: "center", alignItems: "center" }}
        ></View>
      ) : (
        <>
          <View style={styles.Row}>
            <TextInput
              onChangeText={(text) => setText(text)}
              onSubmitEditing={() => {
                add(text);
                setText(null);
              }}
              placeholder="to do"
              style={styles.input}
              value={text}
            />
          </View>
          <ScrollView>
            <Items
              key={`forceupdate-todo-${forceUpdateId}`}
              done={false}
              onPressItem={(id) =>
                db.transaction(
                  (tx) => {
                    tx.executeSql(`update items set done = 1 where id = ?;`, [
                      id,
                    ]);
                  },
                  null,
                  forceUpdate
                )
              }
              onPressDelete={(id) =>
                db.transaction(
                  (tx) => {
                    tx.executeSql(`delete all from items where id = ?;`, [id]);
                  },
                  null,
                  forceUpdate
                )
              }
            />
            <Items
              done
              key={`forceupdate-done-${forceUpdateId}`}
              onPressItem={(id) =>
                db.transaction(
                  (tx) => {
                    tx.executeSql(`delete from items where id = ?;`, [id]);
                  },
                  null,
                  forceUpdate
                )
              }
            />
          </ScrollView>
        </>
      )}
    </View>
  );
}

function useForceUpdate() {
  const [value, setValue] = useState(0);
  return [() => setValue(value + 1), value];
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    flex: 1,
    paddingTop: Constants.statusBarHeight,
  },
  heading: {
    fontSize: 20,

    textAlign: "center",
  },
  Row: {
    flexDirection: "row",
  },
  input: {
    borderColor: "#000",
    borderWidth: 1,
    flex: 1,
    height: 50,
    margin: 20,
  },
  listArea: {
    backgroundColor: "#000",
    flex: 1,
    paddingTop: 20,
  },
  sectionContainer: {
    marginBottom: 20,
    marginHorizontal: 20,
  },
  sectionHeading: {
    fontSize: 20,
    marginBottom: 10,
  },
});

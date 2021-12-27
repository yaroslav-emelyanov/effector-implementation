import "./styles.css";

import {
  createStore,
  createEvent,
  createEffect,
  useStore
} from "./effector.clone";

const sleep = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay));

const loadTitleFx = createEffect(async () => {
  await sleep(1000);
  return "loaded title";
});

const loadTitleWithErrorFx = createEffect(async () => {
  await sleep(1000);
  throw new Error("Title can not loaded");
});

const setTitle = createEvent<string>();
const resetTitle = createEvent();

const $title = createStore("default title");

setTitle.watch((newTitle) => {
  console.log("setTitle", newTitle);
});

$title
  .on(setTitle, (_, payload) => payload)
  .on(loadTitleFx.doneData, (_, str) => str)
  .on(loadTitleWithErrorFx.failData, () => "some error")
  .reset(resetTitle);

$title.watch((value) => {
  console.log("title", value);
});

export default function App() {
  const title = useStore($title);

  return (
    <div className="App">
      <h2>Set title</h2>
      <h1>{title}</h1>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        type="text"
      />
      <button onClick={resetTitle}>X</button>

      <div>
        <button onClick={() => loadTitleFx()}>Load new title</button>
        <button onClick={() => loadTitleWithErrorFx()}>
          Load title with error
        </button>
      </div>
    </div>
  );
}

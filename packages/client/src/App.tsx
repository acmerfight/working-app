import { Provider } from "jotai";
import { Counter } from "./components/Counter";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { store } from "./store";

export function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <div className="app">
          <header className="header">
            <h1>Working App</h1>
            <p className="subtitle">Hono + React + Jotai + TypeScript</p>
          </header>
          <main className="main">
            <Counter />
          </main>
        </div>
      </ErrorBoundary>
    </Provider>
  );
}


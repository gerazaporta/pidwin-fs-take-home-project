import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { createStore, applyMiddleware, compose, StoreEnhancer } from "redux";
import { thunk } from "redux-thunk";
import App from "./App";
import "./index.css";
import reducers from "./reducers";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./themes/Default";

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

// @ts-expect-error
const store = createStore(
  reducers, 
  composeEnhancers(applyMiddleware(thunk)) as StoreEnhancer
);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <ThemeProvider theme={theme}>
    <Provider store={store}>
      <App />
    </Provider>
  </ThemeProvider>
);
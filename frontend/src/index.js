import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter } from "react-router-dom";
import "overlayscrollbars/overlayscrollbars.css";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { MetaMaskContextProvider } from "./utility/hooks/useMetaMask";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <Provider store={store}>
      <Suspense>
        <MetaMaskContextProvider>
          <App />
        </MetaMaskContextProvider>
      </Suspense>
    </Provider>
  </BrowserRouter>
);

reportWebVitals();

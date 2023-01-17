/* @flow */

import React, { Component, Suspense } from "react";
import { Provider, connect } from "react-redux";
import { compose } from "redux";
import { ApolloProvider } from "react-apollo";
import { PersistGate } from "redux-persist/integration/react";
import { hot } from "react-hot-loader";
import { persistor, store } from "../store";
import client from "../client";


import { ThemeProvider } from "styled-components";
import { lightTheme, darkTheme, GlobalStyle } from "../../theme";
import initLightDarkBackground from "../lib/initLightDarkBackground";
import Loader from "./Loader";
import Sidebar from "./Sidebar";
import MainView from "./mainView/MainView";
import Landing from "./Landing";
import GenericFooter from "./GenericFooter";
import TopBar from "./topbar/TopBar";

type AppProps = {
  theme: string,
  page: string,
};

type AppState = {};

class App extends Component<AppProps, AppState> {
  props: AppProps;
  state: AppState;

  constructor(props: AppProps) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const { theme } = this.props;
    initLightDarkBackground(theme);
  }

  componentDidUpdate(prevProps) {
    const { theme: oldTheme } = prevProps;
    const { theme } = this.props;
    if (oldTheme !== theme) {
      initLightDarkBackground(theme);
    }
  }

  render() {
    const { theme, page } = this.props;
    let panelShown;
    if (page === "landing") {
      panelShown = <Landing/>;
    } else {
      panelShown = <MainView/>;
    }
    return (
      <div id="main">
        <GlobalStyle theme={theme === "light"? lightTheme : darkTheme}/>
        <ThemeProvider theme={theme === "light"? lightTheme : darkTheme}>
          <Suspense fallback={<Loader />}>
            <TopBar/>
            <Sidebar/>
            {panelShown}
            <GenericFooter />
          </Suspense>
        </ThemeProvider>
      </div>
    );
  }
}

const reduxConnect = connect((state) => ({
  theme: state.settings.get("theme"),
  page: state.browsing.get("page"),
}),
(/*dispatch*/) => ({
}),
);

const TranslatedApp = compose(
  reduxConnect
)(App);

class WrappedAppWithStore extends React.Component<*> {
  render() {
    return (
      <ApolloProvider client={client}>
        <Provider store={store}>
          <PersistGate loading={<Loader />} persistor={persistor}>
            <TranslatedApp />
          </PersistGate>
        </Provider>
      </ApolloProvider>
    );
  }
}

// $FlowIgnoreError
export default module.hot?
  hot(module)(WrappedAppWithStore) : WrappedAppWithStore;

/* @flow */

import React, { Component } from "react";
import { connect } from "react-redux";
import { compose, bindActionCreators } from "redux";
import { withTranslation } from "react-i18next";
import config from "../../config";
import styled from "styled-components";
import Browser from "../Browser";


import type { TFunction } from "react-i18next";
import Loader from "../Loader";

const Main = styled.div`
  min-height: calc(100vh);
  padding: 80px 16px 48px 16px;
  background-image: ${({theme}) => `linear-gradient(to top, ${theme.backgroundBottom} 0%, ${theme.backgroundTop} 100%)`};
`;

type MainViewProps = {
  t: TFunction,
  page: string,
};

type MainViewState = {
};

class MainView extends Component<MainViewProps, MainViewState> {
  props: MainViewProps;
  state: MainViewState;

  constructor(props: MainViewProps) {
    super(props);
    this.state = {
    };
  }

  render() {
    const { page } = this.props;
    let panelShown;
    if (page === "settings") {
      // show settings page
    } else {
      panelShown = <Browser/>;
    }
    return (
      <Main id="mainview">
        {panelShown}
      </Main>
    );
  }
}

// const MainViewWithTranslate = withTranslation()(MainView);

const reduxConnect = connect(state => ({
  page: state.browsing.get("page"),
}), (dispatch) => bindActionCreators({
}, dispatch));

export default compose(
  withTranslation(),
  reduxConnect
)(MainView);

import React from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { withTranslation } from "react-i18next";
import styled from "styled-components";

import Charts from "../Charts";
import Analytics from "../Analytics";
import Backtest from "../Backtest";
import Disclaimer from "../Disclaimer";

import type { TFunction } from "react-i18next";

const Wrapper = styled.div`
  position: relative;
`;

type BrowserProps = {
  t: TFunction,
  page: string,

}

const Browser = ({
  t,
  page,
}: BrowserProps) => {
  let panelShown;
  if (page === "charts") {
    panelShown = <Charts/>;
  } else if (page === "analytics") {
    panelShown = <Analytics/>;
  } else if (page === "backtest") {
    panelShown = <Backtest/>;
  } else if (page === "disclaimer") {
    panelShown = <Disclaimer/>;
  }

  return (
    <Wrapper>
      {panelShown}
    </Wrapper>
  );
};

const reduxConnect = connect(state => ({
  page: state.browsing.get("page"),
}),
(dispatch) => ({
  // browseToCampaigns: () => dispatch(browseToCampaigns()),
}),
);

export default compose(
  withTranslation("browser"),
  reduxConnect
)(Browser);

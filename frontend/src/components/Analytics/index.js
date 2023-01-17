/* @flow */

import React, {Fragment} from "react";
import styled from "styled-components";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";
import { compose } from "redux";
import {
  setTab,
} from "../../actions";

import Navs from "../Navs";
import ExpirationHistory from "./panels/ExpirationHistory";
import ExpirationAverages from "./panels/ExpirationAverages";
import ExpirationDistribution from "./panels/ExpirationDistribution";
import IVHistory from "./panels/IVHistory";
import Trades from "./panels/Trades";

import type { TFunction } from "react-i18next";

const NavsContainer = styled.div`
  max-width: 1024px;
  margin: auto;
  box-sizing: border-box;
  width: 100%;
  margin-bottom: 16px;
`;

const AnalyticsFeed = styled.div`
  position: relative;
  .analytics-container {
    margin-bottom: 35px;
  }
`;

const TABS = [
  { label: "nav.expirations", slug: "expirations" },
  { label: "nav.IV", slug: "IV" },
  { label: "nav.trades", slug: "trades" },
];

type AnalyticsProps = {
  t: TFunction,
  setTab: Function,
  activeTab: string,
}

const Analytics = ({t, setTab, activeTab}: AnalyticsProps) => {
  return (
    <AnalyticsFeed>
      <NavsContainer>
        <Navs
          items={TABS.map(tabInfos => ({
            label: t(tabInfos.label),
            slug: tabInfos.slug,
          }))}
          onClick={setTab}
          active={activeTab}
        />
      </NavsContainer>
      {activeTab === "expirations" && <Fragment>
        <div className="analytics-container">
          <ExpirationHistory/>
        </div>
        <div className="analytics-container">
          <ExpirationAverages/>
        </div>
        <div className="analytics-container">
          <ExpirationDistribution/>
        </div>
      </Fragment>}
      {activeTab === "IV" && <div className="analytics-container">
        <IVHistory/>
      </div>}
      {activeTab === "trades" && <div className="analytics-container">
        <Trades/>
      </div>}
    </AnalyticsFeed>
  );
};


const reduxConnect = connect(
  state => ({
    activeTab: state.browsing.get("tab"),
  }),
  dispatch => ({
    setTab: (tab: string) => dispatch(setTab({tab})),
  })
);

export default compose(
  withTranslation("browser"),
  reduxConnect
)(Analytics);

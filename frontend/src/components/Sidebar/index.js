/* @flow */

import React, { Component } from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { compose } from "redux";
import { withTranslation } from "react-i18next";
import navMenus from "../../utils/navMenus";

import {Moon} from "@styled-icons/fa-regular/Moon";
import {Sun} from "@styled-icons/octicons/Sun";

import {
  browseToCharts,
  browseToAnalytics,
  browseToAutomation,
  browseToBacktest,
  browseToDisclaimer,
  closeSidebar,
  toggleTheme,
} from "../../actions";

import type { TFunction } from "react-i18next";

import config from "../../config";
import Button from "../Button";

// import MenuButton from "../MenuButton";

const SIDEBAR_WIDTH = 240;

const SidebarElement = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: block;
  }
  margin: 0;
  padding: 0;
  left: 0;
  top: 0;
  width: ${SIDEBAR_WIDTH}px;
  z-index: 900;
  background-color: ${({ theme }) => theme.topbarPrimary};
  position: fixed;
  height: 100%;
  overflow-y: auto;
  transition: transform .5s ease;
  transform: ${({ opened }) => (opened? `translateX(0px)` : `translateX(-${SIDEBAR_WIDTH}px)`)};
  .title {
    height: 64px;
    border-bottom: solid 1px ${({ theme }) => theme.topbarSeparator};
    ${'' /* padding: 5px 0px 5px 15px;
    display: flex;
    flex-direction: row;
    align-items: center;
    border-bottom: solid 1px rgba(255,255,255,.1);
    font-family: Montserrat;
    color: ${({ theme }) => theme.topbarText};
    text-align: center;
    font-weight: 600;
    .menuButton {
      color: ${({ theme }) => theme.topbarText};
      width: 40px;
      height: 54px;
      margin-left: 5px;
      box-sizing: border-box;
      display: flex;
      position: absolute;
      font-size: 0;
    } */}
  }
  > nav {
  display: block;
  margin: 0;
  padding: 0;
  border: 0;
  text-decoration: none;
  }
  > .buttonContainer {
    margin-top: 10px;
    height: 56px;
    padding: 16px 16px;
  }
  .options {
    width: 100%;
    flex-shrink: 0;
    > .lightDark {
      width: 64px;
      height: 64px;
      margin: auto;
      padding: 20px;
      cursor: pointer;
      color: ${({ theme }) => theme.fadedTopbarText};
      &:hover {
        color: ${({ theme }) => theme.topbarText};
      }
    }
  }
`;

const NavItem = styled.a`
  &:not([href]),
  &:not([href]):not([tabindex]) {
    color: ${({ theme, selected }) => (selected? theme.topbarText : theme.fadedTopbarText)};
    &:hover {
      color: ${({ theme }) => theme.topbarText};
    }
  }
  font-size: 16px;
  font-family: Open Sans;
  font-weight: ${({ selected }) => (selected? 600 : 400)};
  cursor: pointer;
  border-bottom: 0;
  ${'' /* border-top: solid 1px rgba(255,255,255,.05); */}
  display: block;
  height: 44px;
  line-height: 44px;
  padding: 0 1em 0 2em;
  text-decoration: none;
  transition: 0.3s ease;
  &:first-child {
    border-top: 0;
  }
  &:hover {
  }
`;

const MoonButton = styled(Moon)`
  width: 24px;
  height: 24px;
`;

const SunButton = styled(Sun)`
  width: 24px;
  height: 24px;
`;

type SidebarProps = {
  t: TFunction,
  currentPage: string,
  browseToCharts: Function,
  browseToAnalytics: Function,
  browseToAutomation: Function,
  browseToBacktest: Function,
  browseToDisclaimer: Function,
  closeSidebar: Function,
  opened: boolean,
  toggleTheme: Function,
  theme: string,
};

type SidebarState = {};

class Sidebar extends Component<
  SidebarProps,
  SidebarState
> {
  props: SidebarProps;
  state: SidebarState;

  constructor(props: SidebarProps) {
    super(props);
    this.state = {};
  }

  render() {
    const { t, currentPage, opened, theme, toggleTheme } = this.props;
    return (
      <SidebarElement opened={opened}>
        <div className="title">
          {/* <div className="menuButton">
            <MenuButton onClick={closeSidebar}/>
          </div> */}
          {/* <div className="titleText">
            {t("generousConnect")}
          </div> */}
        </div>
        <nav>
          {navMenus.map(navId => (
            <NavItem
              key={navId}
              selected={currentPage === navId}
              onClick={() => this._handleClick(navId)}
            >
              {t(`nav.${navId}`)}
            </NavItem>
          ))}
        </nav>
        <div className="options">
          <div className="lightDark" onClick={toggleTheme}>
            {theme === "light"? <MoonButton/> : <SunButton/>}
          </div>
        </div>
      </SidebarElement>
    );
  }

  _handleClick: Function = (page) => {
    const {
      browseToCharts,
      browseToAnalytics,
      browseToAutomation,
      browseToBacktest,
      browseToDisclaimer,
      closeSidebar,
    } = this.props;
    if (page === "charts") {
      browseToCharts();
      closeSidebar();
    } else if (page === "analytics") {
      browseToAnalytics();
      closeSidebar();
    } else if (page === "automation") {
      browseToAutomation();
      closeSidebar();
    } else if (page === "backtest") {
      browseToBacktest();
      closeSidebar();
    } else if (page === "disclaimer") {
      browseToDisclaimer();
      closeSidebar();
    }
  }
}

const reduxConnect = connect(
  state => ({
    theme: state.settings.get("theme"),
    currentPage: state.browsing.get("page"),
    opened: state.sidebar.get("opened"),
  }),
  dispatch => ({
    browseToCharts: () => dispatch(browseToCharts()),
    browseToAnalytics: () => dispatch(browseToAnalytics()),
    browseToBacktest: () => dispatch(browseToBacktest()),
    browseToAutomation: () => dispatch(browseToAutomation()),
    browseToDisclaimer: () => dispatch(browseToDisclaimer()),
    closeSidebar: () => dispatch(closeSidebar()),
    toggleTheme: () => dispatch(toggleTheme()),
  })
);

export default compose(
  withTranslation("common"),
  reduxConnect
)(Sidebar);

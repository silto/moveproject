import React, { Fragment, Component} from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { withTranslation } from "react-i18next";
import styled from "styled-components";
import type { TFunction } from "react-i18next";
import navMenus from "../../utils/navMenus";
import MenuButton from "../MenuButton";
import {Moon} from "@styled-icons/fa-regular/Moon";
import {Sun} from "@styled-icons/octicons/Sun";
import {
  browseToLanding,
  browseToCharts,
  browseToAnalytics,
  browseToAutomation,
  browseToBacktest,
  browseToDisclaimer,
  toggleSidebar,
  toggleTheme,
} from "../../actions";
import logo from "../../images/topbar_logo.svg";

const StyledTopBar = styled.div`
  background-color: ${({ theme }) => theme.topbarPrimary};
  height: 64px;
  position: fixed;
  width: 100%;
  top: 0;
  z-index: 1000;
  display: flex;
  .menuLeft {
    width: 64px;
    ${'' /* border-right: solid 1px rgba(255,255,255,.1); */}
    padding: 5px 0px 5px 15px;
    flex-shrink: 0;
    overflow: visible;
    ${'' /* width: 241px; */}
    @media (min-width: 769px)${'' /*  and (max-width: 900px) */} {
      width: 256px;
    }
    > .menuButton {
      color: ${({ theme }) => theme.topbarText};
      width: 40px;
      height: 54px;
      margin-left: 5px;
      box-sizing: border-box;
      display: none;
      position: absolute;
      font-size: 0;
      @media (max-width: 768px) {
        display: flex;
      }
    }
    > .logo {
      box-sizing: border-box;
      height: 64px;
      padding: 0 0;
      margin: 0 auto;
      cursor: pointer;
      @media (max-width: 768px) {
        display: none;
      }
      > img {
        height: 54px;
      }
    }
  }
  .menuRight {
    width: 256px;
    padding-left: 192px;
    @media ${'' /*  (min-width: 769px) and  */}(max-width: 900px){
      width: 64px;
      padding-left: 0px;
    }
    flex-shrink: 0;
    @media (max-width: 768px) {
      display: none;
    }
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
  .browsing {
    flex-grow: 1;
    height: 64px;
    > nav {
      display: flex;
      flex-direction: row;
      justify-content: center;
      @media (max-width: 768px) {
        display: none;
      }
      height: 64px;
      width: 100%;
      margin: 0;
      padding: 0;
      border: 0;
      text-decoration: none;
    }
    > .logozone {
      display: none;
      height: 59px;
      text-align: center;
      padding-top: 5px;
      > .logo {
        box-sizing: border-box;
        height: 64px;
        padding: 0 0;
        margin: 0 auto;
        cursor: pointer;
        > img {
          height: 54px;
        }
      }
      @media (max-width: 768px) {
        display: block;
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
  font-family: Open Sans;
  font-weight: ${({ selected }) => (selected? 600 : 400)};
  cursor: pointer;
  display: block;
  height: 44px;
  line-height: 44px;
  padding: 10px 16px 10px 16px;
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

type TopBarProps = {
  t: TFunction,
  browseToLanding: Function,
  browseToCharts: Function,
  browseToAnalytics: Function,
  browseToAutomation: Function,
  browseToBacktest: Function,
  browseToDisclaimer: Function,
  toggleSidebar: Function,
  toggleTheme: Function,
  currentPage: string,
  theme: string,
}

type TopBarStates = {};

class TopBar extends Component<
  TopBarProps,
  TopBarStates
> {
  props: TopBarProps;
  state: TopBarStates;

  constructor(props: TopBarProps) {
    super(props);
    this.state = {};
  }

  render() {
    const {t, toggleSidebar, toggleTheme, currentPage, theme} = this.props;
    return (
      <Fragment>
        <StyledTopBar>
          <div className="menuLeft">
            <div className="menuButton">
              <MenuButton onClick={toggleSidebar}/>
            </div>
            <span
              className="logo"
              onClick={() => this._handleClick("landing")}
            >
              <img
                src={logo}
                alt="MOVE Project"
              />
            </span>
          </div>
          <div className="browsing">
            <div className="logozone">
              <span
                className="logo"
                onClick={() => this._handleClick("landing")}
              >
                <img
                  src={logo}
                  alt="MOVE Project"
                />
              </span>
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
          </div>
          <div className="menuRight">
            <div className="lightDark" onClick={toggleTheme}>
              {theme === "light"? <MoonButton/> : <SunButton/>}
            </div>
          </div>
        </StyledTopBar>
      </Fragment>
    );
  }
  _handleClick: Function = (page) => {
    const {
      browseToLanding,
      browseToCharts,
      browseToAnalytics,
      browseToAutomation,
      browseToBacktest,
      browseToDisclaimer,
    } = this.props;
    if (page === "landing") {
      browseToLanding();
    } else if (page === "charts") {
      browseToCharts();
    } else if (page === "analytics") {
      browseToAnalytics();
    } else if (page === "automation") {
      browseToAutomation();
    } else if (page === "backtest") {
      browseToBacktest();
    } else if (page === "disclaimer") {
      browseToDisclaimer();
    }
  }
}

const reduxConnect = connect(
  state => ({
    theme: state.settings.get("theme"),
    currentPage: state.browsing.get("page"),
  }),
  dispatch => ({
    browseToLanding: () => dispatch(browseToLanding()),
    browseToCharts: () => dispatch(browseToCharts()),
    browseToAnalytics: () => dispatch(browseToAnalytics()),
    browseToBacktest: () => dispatch(browseToBacktest()),
    browseToAutomation: () => dispatch(browseToAutomation()),
    browseToDisclaimer: () => dispatch(browseToDisclaimer()),
    toggleSidebar: () => dispatch(toggleSidebar()),
    toggleTheme: () => dispatch(toggleTheme()),
  })
);

export default compose(
  withTranslation("common"),
  reduxConnect
)(TopBar);

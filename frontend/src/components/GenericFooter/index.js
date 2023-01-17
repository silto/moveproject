/* @flow */

import React, { Component } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import type { TFunction } from "react-i18next";
import { withTranslation } from "react-i18next";
import { trackEvent } from "../../analytics";
import {
  browseToDisclaimer,
} from "../../actions";
import styled from "styled-components";

const Footer = styled.footer`
  height: 150px;
  background-color: ${({ theme }) => theme.footerBackground};
  display: grid;
  grid-template-rows: 80px 30px;
  padding: 0 16px;
  box-sizing: border-box;
  text-align: center;
  font-family: Montserrat;
  color: ${({ theme }) => theme.footerText};
  > div {
    max-width: 1200px;
    box-sizing: border-box;
    width: 100%;
    margin: auto;
    > a {
      color: ${({ theme }) => theme.action};
      display: inline-block;
      text-decoration: none;
      cursor: pointer;
      &:hover {
        text-decoration: underline;
      }
    }
  }
  > .credits {
    margin: 32px auto auto;
  }
  > .footerLinks {
    margin: 0 auto auto;
    > .footerLink {
      cursor: pointer;
      color: ${({ theme }) => theme.footerLink};
      font-size: 14px;
      line-height: 14px;
      &:hover {
        text-decoration: underline;
      }
    }
  }
`;

type GenericFooterProps = {
  t: TFunction,
  browseToDisclaimer: Function,
};

class GenericFooter extends Component<GenericFooterProps> {
  props: GenericFooterProps;

  constructor(props: GenericFooterProps) {
    super(props);
  }

  render() {
    const { t, browseToDisclaimer } = this.props;
    return (
      <Footer>
        <div className="credits">
          <span>&copy; {t("common:copyright")}</span>
          <a
            onClick={() => this._handleTwitterClick("KryptoAlpha")}
            href="https://twitter.com/0x_Krypto"
            rel="noreferrer"
            target="_blank">Krypto</a>
          {" & "}
          <a
            onClick={() => this._handleTwitterClick("silto")}
            href="https://twitter.com/_silto_"
            rel="noreferrer"
            target="_blank">Silto</a>.
        </div>
        <div className="footerLinks">
          <span
            className="footerLink"
            onClick={browseToDisclaimer}
          >
            {t("disclaimer")}
          </span>
        </div>
      </Footer>
    );
  }
  _handleTwitterClick: Function = (handle) => {
    trackEvent({
      category: "referral",
      action: `go to ${handle} twitter`,
    });
  }
}

const reduxConnect = connect(
  state => ({
    theme: state.settings.get("theme"),
    currentPage: state.browsing.get("page"),
  }),
  dispatch => ({
    browseToDisclaimer: () => dispatch(browseToDisclaimer()),
  })
);

export default compose(
  withTranslation("common"),
  reduxConnect
)(GenericFooter);

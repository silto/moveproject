/* @flow */

import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import styled from "styled-components";
import { withTranslation } from "react-i18next";
import type { TFunction } from "react-i18next";
import config from "../../config";
import Button from "../Button";
import SubscriptionField from "../SubscriptionField";
import {Checkbox} from "../CheckboxField";
import ErrorMessage, {formatError} from "../Error/ErrorMessage";
import {AngleRight} from "@styled-icons/fa-solid/AngleRight";
import { trackEvent } from "../../analytics";
import bigLogo from "../../images/big_logo_landing.svg";
import parallaxBackground from "../../images/MOVE_Project_background_parallax-2.jpg";
import {
  browseToCharts,
  browseToAnalytics,
  browseToDisclaimer,
  setTab,
} from "../../actions";

const LandingContainer = styled.div`
  min-height: calc(100vh);
  display: flex;
  flex-direction: column;
  background-color: #fff;
  section {
    width: 100%;
    padding-top: 80px;
    padding-bottom: 80px;
    .content {
      max-width: 980px;
      margin-left: auto;
      margin-right: auto;
      .textBlock {
        max-width: 900px;
        margin: auto;
        padding: 0 40px;
      }
      .buttonContainer {
        .buttonLine {
          max-width: 280px;
        }
        max-width: 900px;
        margin: 32px auto 0;
        padding: 0 60px;
      }
    }
    &.logoWithParallax {
      background-image: url(${parallaxBackground});
      background-size: cover;
      background-repeat: no-repeat;
      background-attachment: scroll;
      background-position: center;
      padding-bottom: 60px;
      overflow: hidden;
      transform-style: inherit;
      padding: 0;
      .bgcover {
        background-color: #00000087;
        width: 100%;
        height: 100%;
        padding-top: 144px;
        padding-bottom: 60px;
      }
      .logoContainer {
        max-height: 186px;
        max-width: 432px;
        padding: 0 32px;
        margin-left: auto;
        margin-right: auto;
      }
      .catch {
        text-align: center;
        color: ${({ theme }) => theme.white};
        font-family: Open Sans;
        font-weight: 600;
        font-size: 20px;
      }
    }
    &.whatIsMOVE, &.newsletter {
      background-color: #fff;

      h3 {
        text-align: left;
        color: ${({ theme }) => theme.landingText};
        font-family: Open Sans;
        font-weight: 600;
        font-size: 30px;
        margin-top: 0;
      }
      p {
        font-family: Open Sans;
        color: ${({ theme }) => theme.landingText};
        font-weight: 400;
        font-size: 16px;
        white-space: pre-wrap;
      }
    }
    &.newsletter {
      .subscriptionContainer {
        text-align: center;
        margin: auto;
        padding: 0 40px;
        h4 {
          color: ${({ theme }) => theme.landingText};
          font-family: Open Sans;
          font-weight: 600;
          font-size: 24px;
          margin-top: 0;
          margin-bottom: 16px;
        }
        .subtitle {
          color: ${({ theme }) => theme.landingLabelText};
          font-family: Montserrat;
          font-weight: 400;
          font-size: 14px;
          line-height: 16px;
          margin-bottom: 12px;
        }
        .success {
          padding-bottom: 85px;
          color: ${({ theme }) => theme.landingText};
          font-family: Montserrat;
          font-weight: 400;
          font-size: 18px;
          line-height: 18px;
          margin-bottom: 0px;
        }
        .checkBoxUnderLine {
          max-width: 280px;
          margin: 16px auto 0;
          .link {
            color: ${({ theme }) => theme.primary};
            cursor: pointer;
            font-family: Open Sans;
            font-weight: 400;
            font-size: 16px;
            &:hover {
              text-decoration: underline;
            }
          }
          label {
            > span {
              color: ${({ theme }) => theme.landingText};
            }
          }
        }
      }
    }
    &.whatIsMOVEProject {
      flex-grow: 1;
      background-color: ${({ theme }) => theme.landingDarkerPrimary};
      h3 {
        text-align: left;
        color: ${({ theme }) => theme.white};
        font-family: Open Sans;
        font-weight: 600;
        font-size: 30px;
        margin-top: 0;
      }
      p {
        font-family: Open Sans;
        color: ${({ theme }) => theme.white};
        font-weight: 400;
        font-size: 16px;
        white-space: pre-wrap;
      }
      ul {
        font-family: Open Sans;
        color: ${({ theme }) => theme.white};
        font-weight: 400;
        font-size: 15px;
        white-space: pre-wrap;
        padding-left: 36px;
        list-style: none;
        margin-top: 30px;
        li {
          padding-bottom: 24px;
          span {
            cursor: pointer;
            &:hover {
              text-decoration: underline;
            }
          }
        }
      }
    }
  }
`;

const ListMark = styled(AngleRight)`
  width: 16px;
  height: 16px;
  margin-right: 12px;
  margin-bottom: 2px;
`;

type LandingProps = {
  t: TFunction,
  browseToCharts: Function,
  browseToAnalytics: Function,
  browseToDisclaimer: Function,
  setTab: Function,
};

type LandingState = {
  agreeTerms: boolean,
  subscriptionError?: string,
  subscriptionSuccess: boolean,
};

const emailRegex = /^.+@.+\..+/;

class Landing extends Component<
  LandingProps,
  LandingState
> {
  props: LandingProps;
  state: LandingState;

  constructor(props: LandingProps) {
    super(props);
    this.state = {
      agreeTerms: false,
      subscriptionError: null,
      subscriptionSuccess: false,
    };
  }

  render() {
    const { t } = this.props;
    const { agreeTerms, subscriptionError, subscriptionSuccess } = this.state;

    return <LandingContainer>
      <section className="logoWithParallax">
        <div className="bgcover">
          <div className="content">
            <div className="logoContainer">
              <img
                src={bigLogo}
                alt="MOVE Project"
              />
            </div>
            <div className="catch">
              <h2>
                {t("catchPhrase")}
              </h2>
            </div>
          </div>
        </div>
      </section>
      <section className="whatIsMOVE">
        <div className="content">
          <div className="textBlock">
            <h3>
              {t("whatIsMOVE")}
            </h3>
            <p>
              {t("moveExplanation1")}
            </p>
            <p>
              {t("moveExplanation2")}
            </p>
          </div>
          <div className="buttonContainer">
            <div className="buttonLine">
              <Button
                id="knowMoreButton"
                onClick={this._gotoMediumExplanation}
                color="primary"
                width="100%"
                height="auto"
                type="submit"
                tabIndex="0"
                variant="line"
              >
                {t("knowMore")}
              </Button>
            </div>
          </div>
        </div>
      </section>
      <section className="whatIsMOVEProject">
        <div className="content">
          <div className="textBlock">
            <h3>
              {t("whatIsMOVEProject")}
            </h3>
            <p>
              {t("projectMoveExplanation1")}
            </p>
            <ul>
              <li>
                <ListMark/>
                <span onClick={() => this._handleClick("charts")}>{t("browseExpired")}</span>
              </li>
              <li>
                <ListMark/>
                <span onClick={() => this._handleClick("analytics","expirations")}>{t("expirationsChart")}</span>
              </li>
              <li>
                <ListMark/>
                <span onClick={() => this._handleClick("analytics","IV")}>{t("IVChart")}</span>
              </li>
              <li>
                <ListMark/>
                <span onClick={() => this._handleClick("analytics","trades")}>{t("TradesChart")}</span>
              </li>
            </ul>
          </div>
          <div className="buttonContainer">
            <div className="buttonLine">
              <Button
                id="knowMoreProjectButton"
                onClick={this._gotoMediumProjectExplanation}
                color="white"
                width="100%"
                height="auto"
                type="submit"
                tabIndex="0"
                variant="line"
              >
                {t("knowMoreProject")}
              </Button>
            </div>
          </div>
        </div>
      </section>
      <section className="newsletter">
        <div className="content">
          <div className="textBlock">
            <h3>
              {t("newsletterTitle")}
            </h3>
            <p>
              {t("newsletterExplanation")}
            </p>
          </div>
          <div className="subscriptionContainer">
            <h4>
              {t("signup")}
            </h4>
            <p className="subtitle">
              {t("alwaysFree")}
            </p>
            {subscriptionSuccess?
              <div className="success">
                <p>
                  {t("subscriptionSuccess")}
                </p>
              </div> :
              <Fragment>
                <SubscriptionField
                  onSubmit={(email) => this._handleSubscribe(email)}
                />
                {subscriptionError?
                  <ErrorMessage>
                    {t(`errors.${formatError(subscriptionError)}`)}
                  </ErrorMessage> : null
                }
                <div className="checkBoxUnderLine">
                  <Checkbox
                    id="agreeTerms"
                    label={<span>{t("agreeTerms")}</span>}
                    name="agreeTerms"
                    checked={agreeTerms}
                    onChange={(value, checked) => this.setState({agreeTerms: checked})}
                  />
                  <span className="link" onClick={() => this._handleClick("disclaimer")}>{t("terms")}</span>
                </div>
              </Fragment>
            }
          </div>
        </div>
      </section>
    </LandingContainer>;
  }

  _handleClick: Function = (page, tab) => {
    const { browseToCharts, browseToAnalytics, browseToDisclaimer, setTab } = this.props;
    if (page === "charts") {
      browseToCharts();
    } else if (page === "analytics") {
      browseToAnalytics();
    } else if (page === "disclaimer") {
      browseToDisclaimer();
    }
    if (tab) {
      setTab(tab);
    }
  }

  _handleSubscribe: Function = (email) => {
    const { agreeTerms } = this.state;
    if (!agreeTerms) {
      this.setState({subscriptionError: "MUST_AGREE_TERMS"});
      return;
    }
    if (!emailRegex.test(email)) {
      this.setState({subscriptionError: "INVALID_EMAIL"});
      return;
    }
    this.setState({subscriptionError: null});

    fetch(
      `${config.API_URL}/subscribe`,
      {
        method: "POST",
        body: new URLSearchParams({email}),
      }
    )
    .then(res => {
      if (!res.ok) {
        this.setState({subscriptionError: "ERROR"});
        console.error("error submiting the form");
        return;
      }
      return res.json();
    })
    .then(json => {
      if (json && json.error) {
        this.setState({subscriptionError: json.error});
        console.error(json.error);
        return;
      }
      trackEvent({
        category: "subscription",
        action: `subscribed to the newsletter`,
      });
      this.setState({subscriptionSuccess: true});
    });
  }

  _gotoMediumExplanation: Function = () => {
    trackEvent({
      category: "referral",
      action: `go to medium post "profiting from volatility"`,
    });
    window.open("https://medium.com/@kryptoalpha/move-contracts-profiting-from-volatility-9811834429","_blank");
  }
  _gotoMediumProjectExplanation: Function = () => {
    trackEvent({
      category: "referral",
      action: `go to medium post "introducing MOVE project"`,
    });
    window.open("https://medium.com/@moveproject/introducing-move-project-f3fe0e1ad1d5","_blank");
  }
}

const reduxConnect = connect(
  state => ({
  }),
  dispatch => ({
    browseToCharts: () => dispatch(browseToCharts()),
    browseToAnalytics: () => dispatch(browseToAnalytics()),
    browseToDisclaimer: () => dispatch(browseToDisclaimer()),
    setTab: (tab: string) => dispatch(setTab({tab})),
  })
);

export default compose(
  withTranslation(["landing"]),
  reduxConnect,
)(Landing);

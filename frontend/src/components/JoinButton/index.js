/* @flow */

import React from "react";
import styled from "styled-components";
import { compose } from "redux";
import { withTranslation } from "react-i18next";
import config from "../../config";
import Button from "../Button";
import { trackEvent } from "../../analytics";

import type { TFunction } from "react-i18next";

const StyledJoinButton = styled.div`
  @media (max-width: 768px) {
    display: none;
  }
  position: absolute;
  height: 120px;
  width: 200px;
  top: 0;
  right: 0;
  z-index: 500;
  > .buttonContainer {
    margin-top: 64px;
    height: 56px;
    padding: 16px 16px 0px 0px;
  }
`;

const gotoJoin = () => {
  trackEvent({
    category: "referral",
    action: `go to FTX`,
  });
  window.open(`https://ftx.com/referrals#a=${config.referralCode}`, "_blank");
};

const JoinButton = ({ t }: {t: TFunction}) => {
  return <StyledJoinButton>
    <div className="buttonContainer">
      <Button
        id="joinButton"
        onClick={gotoJoin}
        color="primary"
        width="100%"
        type="submit"
        tabIndex="0"
        variant="line"
      >
        {t("joinFTX")}
      </Button>
    </div>
  </StyledJoinButton>;
};

export default compose(
  withTranslation("common"),
)(JoinButton);

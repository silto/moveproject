/* @flow */

import React, { Component } from "react";
import styled from "styled-components";
import { compose } from "redux";
import { withTranslation } from "react-i18next";
import type { TFunction } from "react-i18next";

import Container from "../Container";
import Title from "../Title";


const Feed = styled.div`
  position: relative;
  padding-top: 56px;
`;

const TextZone = styled.div`
  font-size: 16px;
  font-weight: 400;
  font-family: Open Sans;
  color: ${({ theme }) => theme.normalText};
  margin-left: auto;
  margin-right: auto;
  max-width: 1024px;
  white-space: pre-wrap;
  > p {
    margin-top: 20px;
    &.centered {
      text-align: center;
    }
  }
  li {
    margin-top: 10px;
    margin-left: 20px;
    font-weight: 600;
  }
`;


const Disclaimer = ({ t }: {t: TFunction}) => {
  return <Feed>
    <Container>
      <Title>{t("title")}</Title>
      <TextZone>
        <p>{t("p1")}</p>
        <ul>
          <li>{t("terms.t1")}</li>
          <li>{t("terms.t2")}</li>
          <li>{t("terms.t3")}</li>
          <li>{t("terms.t4")}</li>
          <li>{t("terms.t5")}</li>
        </ul>
        <p>{t("p2")}</p>
        <p>{t("p3")}</p>
        <p>{t("p4")}</p>
        <p>{t("p5")}</p>
        <p>{t("p6")}</p>
      </TextZone>
    </Container>
  </Feed>;
};


export default compose(
  withTranslation("disclaimer"),
)(Disclaimer);

import React from "react";
import { withTranslation } from "react-i18next";
import styled from "styled-components";
import Spinner from "./Spinner";
import type { TFunction } from "react-i18next";

const StyledLoader = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  font-family: Open Sans;
  font-size: 16px;
  font-weight: 400;
  color: ${({ theme }) => theme.grey};

  > div {
    margin: 16px auto;
  }
`;

type LoaderProps = {
  t: TFunction,
  size: number|string,
};

const Loader = ({ t, size }: LoaderProps) => (
  <StyledLoader>
    <Spinner size={size} />
    <div>{t("common:loading")}</div>
  </StyledLoader>
);

export default withTranslation()(Loader);

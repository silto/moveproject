import React, { useState } from "react";
import styled from "styled-components";
import { withTranslation } from "react-i18next";
import Button from "../Button";
import type { TFunction } from "react-i18next";

const SubscriptionContainer = styled.div`
  ${'' /* max-width: 480px; */}
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  > div {
    display: flex;
    > button {
      cursor: pointer;
      height: 48px;
      display: inline-block;
      -ms-flex-line-pack: center;
      align-content: center;
      border-radius: 0 6px 6px 0;
      border: none;
      background-color: ${({ theme }) => theme.landingDarkerPrimary};
      padding: 0 24px;
      color: ${({ theme }) => theme.white};
      font-weight: 600;
      outline: none;
      transition: .3s ease;
      white-space: nowrap;
      overflow: visible;
      &:focus {
        border: none;
      }
    }
    > input {
      font-family: Open Sans;
      font-weight: 400;
      font-size: 18px;
      line-height: 18px;
      color: ${({ theme }) => theme.landingText};
      outline: none;
      border-radius: 6px 0 0 6px;
      border-right: 0;
      width: 100%;
      height: 48px;
      padding: 12px;
      box-sizing: border-box;
      border: 1px solid #ddd;
      &:focus {
        border-color: ${({ theme }) => theme.primary};
        border-width: 2px 0 2px 2px;
        outline: none;
      }
    }
  }
`;

export type SubscriptionFieldProps = {
  t: TFunction,
  onSubmit: Function,
  error?: string,
}

const SubscriptionField = ({ onSubmit, error, t }: SubscriptionFieldProps) => {
  const [email, setEmail] = useState("");
  const handleChange: Function = (e) => {
    const value = e.target.value;
    setEmail(value);
  };
  return (
    <SubscriptionContainer error={error}>
      <div>
        <input
          type="email"
          value={email}
          onChange={handleChange}
          placeholder={t("emailAddress")}
        />
        <Button
          variant="default"
          color="primary"
          onClick={() => onSubmit(email)}
        >
          {t("subscribe")}
        </Button>
      </div>
    </SubscriptionContainer>
  );
};

export default withTranslation("common")(SubscriptionField);

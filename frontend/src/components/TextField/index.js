import React from "react";
import styled from "styled-components";
import InfoTooltip from "../Tooltips/InfoTooltip";

const Fieldset = styled.fieldset`
  & + fieldset {
    padding-top: 24px;
  }

  > div {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: ${({ explanation, isLong }) => (isLong? `auto auto` : (explanation? `auto auto 40px` : `auto 40px`))};
    grid-template-areas: ${({ explanation }) => (explanation? `"label" "explanation" "input"` : `"label" "input"`)};
    grid-gap: 8px;
    padding: 0 0;
    box-sizing: border-box;
    > .explanation {
      grid-area: explanation;
      font-family: Open Sans;
      color: ${({ theme }) => theme.form};
      font-weight: 400;
      font-size: 13px;
      white-space: pre-wrap;
    }
    > label {
      grid-area: label;
      color: ${({ theme }) => theme.form};
      font-family: Montserrat;
      font-weight: 600;
      font-size: 12px;
      line-height: 16px;
      text-transform: uppercase;
      transition: 0.3s ease;
      margin-bottom: ${({ explanation }) => (explanation? `0` : `0.5rem`)};
    }
  }
`;

const StyledInput = styled.input`
  grid-area: input;
  height: 40px;
  background-color: ${({ theme }) => theme.containerBackground};
  border: 1px solid ${({ error, theme }) => (error? theme.red : theme.form)};
  border-radius: 0.25rem;
  transition: 0.3s ease;
  font-family: Open Sans;
  font-weight: 400;
  font-size: 16px;
  line-height: 16px;
  padding-left: 12px;
  padding-right: 12px;
  color: ${({ theme }) => theme.form};
  &::placeholder {
    color: ${({ theme }) => theme.form};
  }
    /* Chrome, Safari, Edge, Opera */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  &[type=number] {
    -moz-appearance: textfield;
  }
  ::-webkit-calendar-picker-indicator {
      filter: ${({ theme }) => theme.inverter};
  }
  &:focus {
    box-shadow: none;
    border-color: ${({ theme }) => theme.primary};
    border-width: 2px;
    outline: none;
    & + label {
      color: ${({ theme }) => theme.primary};
    }
  }
`;

const StyledTextArea = styled.textarea`
  grid-area: input;
  min-height: 120px;
  background-color: ${({ theme }) => theme.containerBackground};
  border: 1px solid ${({ error, theme }) => (error? theme.red : theme.form)};
  border-radius: 0.25rem;
  transition: 0.3s ease;
  font-family: Open Sans;
  font-weight: 400;
  font-size: 16px;
  line-height: 16px;
  padding: 8px;
  color: ${({ theme }) => theme.form};
  &:focus {
    box-shadow: none;
    border-color: ${({ theme }) => theme.primary};
    border-width: 2px;
    outline: none;
    & + label {
      color: ${({ theme }) => theme.primary};
    }
  }
`;

const TextField = ({ id, label, infoTooltip, explanation, placeholder, options, ...rest }, ref) => {
  return (
    <Fieldset explanation={explanation} isLong={options && options.includes("long")}>
      <div>
        {options && options.includes("long")?
          <StyledTextArea id={id} placeholder={placeholder} ref={ref} {...rest} /> :
          <StyledInput id={id} placeholder={placeholder} ref={ref} {...rest} />
        }
        {explanation && <div className="explanation">{explanation}</div>}
        {label && <label htmlFor={id}>{label}{infoTooltip && <InfoTooltip text={infoTooltip}/>}</label>}
      </div>
    </Fieldset>
  );
};

const TextFieldForward = React.forwardRef(TextField);

export default TextFieldForward;

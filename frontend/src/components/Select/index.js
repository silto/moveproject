import React from "react";
import styled from "styled-components";
import InfoTooltip from "../Tooltips/InfoTooltip";

const StyledSelect = styled.fieldset`
  & + fieldset {
    padding-top: 24px;
  }

  > div {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: ${({ explanation, explanationPosition }) => (
    explanation? (explanationPosition === "below"? `auto 40px auto` : `auto auto 40px`) : `auto 40px`
  )};
    grid-template-areas: ${({ explanation, explanationPosition }) => (
    explanation? (explanationPosition === "below"? `"label" "input" "explanation"` : `"label" "explanation" "input"`) : `"label" "input"`
  )};
    grid-gap: 8px;
    padding: 0 0;
    box-sizing: border-box;
    > label {
      grid-area: label;
      color: ${({ theme }) => theme.form};
      font-family: Montserrat;
      font-weight: 400;
      font-size: 15px;
      line-height: 16px;
      ${'' /* text-transform: uppercase; */}
      transition: 0.3s ease;
      margin-bottom: ${({ explanation }) => (explanation? `0` : `0.5rem`)};
    }
    > .explanation {
      grid-area: explanation;
      font-family: Open Sans;
      color: ${({ theme }) => theme.normalText};
      font-weight: 400;
      font-size: 13px;
      white-space: pre-wrap;
    }
    > select {
      display: block;
      font-size: 16px;
      font-family: Open Sans;
      font-weight: 400;
      cursor: pointer;
      color: ${({ theme }) => theme.normalText};
      padding: 0 2em 0 0.8em;
      box-sizing: border-box;
      margin: 0;
      border: 1px solid ${({ error, theme }) => (error? theme.red : theme.form)};
      box-shadow: 0 1px 0 1px rgba(0, 0, 0, 0.04);
      border-radius: 0.5em;
      -moz-appearance: none;
      -webkit-appearance: none;
      appearance: none;
      background-color: ${({ theme }) => theme.containerBackground};
      background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
      background-repeat: no-repeat, repeat;
      background-position: right 0.7em top 50%, 0 0;
      background-size: 0.65em auto, 100%;
      border-radius: 0.25rem;
      height: 40px;
      width: 100%;

      &:focus {
        box-shadow: none;
        border-color: ${({ theme }) => theme.primary};
        border-width: 2px;
        outline: none;
        & + label {
          color: ${({ theme }) => theme.primary};
        }
      }
    }
  }
`;

type SelectProps = {
  id: ?string,
  label: ?string,
  infoTooltip: ?string|React.Node,
  explanation: ?string,
  explanationPosition: ?string,
  placeholder: ?string,
  items: ?Array<{
    label: string,
    value: string,
  }>,
  value: ?string|Array<string>,
  onChange: Function,
  error: ?boolean,
  disabled: ?boolean,
}
//explanationPosition can be "above" or "below"
const Select = ({ id, label, infoTooltip, explanation, explanationPosition, placeholder, items, value, onChange, error, disabled }: SelectProps) => {
  const handleChange = e => {
    onChange(e.target.value);
  };
  return (
    <StyledSelect error={error} explanation={explanation} explanationPosition={explanationPosition}>
      <div>
        <select id={id} onChange={handleChange} value={value} disabled={disabled}>
          <option value="" hidden invalid="true">
            {placeholder}
          </option>
          {items &&
            items.map(item => (
              <option key={item.value} value={item.value}>
                {item.label || item.value}
              </option>
            ))}
        </select>
        {explanation && <div className="explanation">{explanation}</div>}
        <label htmlFor={id}>{label}{infoTooltip && <InfoTooltip text={infoTooltip}/>}</label>
      </div>
    </StyledSelect>
  );
};

export default Select;

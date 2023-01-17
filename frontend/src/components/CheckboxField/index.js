import React from "react";
import styled from "styled-components";

const StyledCheckboxField = styled.fieldset`
  & + fieldset {
    padding-top: 24px;
  }

  > div {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: ${({ explanation }) => (explanation? `auto auto auto` : `auto auto`)};
    grid-template-areas: ${({ explanation }) => (explanation? `"label" "explanation" "checkboxlist"` : `"label" "checkboxlist"`)};
    grid-gap: 8px;
    padding: 0 0;
    box-sizing: border-box;
    > .explanation {
      grid-area: explanation;
      font-family: Open Sans;
      color: ${({ theme }) => theme.normalText};
      font-weight: 400;
      font-size: 13px;
      white-space: pre-wrap;
    }
    > label {
      grid-area: label;
      color: ${({ theme }) => theme.normalText};
      font-family: Montserrat;
      font-weight: 400;
      font-size: 12px;
      line-height: 16px;
      text-transform: uppercase;
      transition: 0.3s ease;
      margin-bottom: ${({ explanation }) => (explanation? `0` : `0.5rem`)};
    }
    > .CheckboxList {
      grid-area: checkboxlist;
    }
  }
`;

const StyledCheckbox = styled.label`
  display: block;
  position: relative;
  ${({ alignRight }) => (alignRight? "text-align: right;" : "")};
  padding-left: ${({ alignRight }) => (alignRight? "0px" : "35px")};
  padding-right: ${({ alignRight }) => (alignRight? "35px" : "0px")};
  margin-bottom: 12px;
  cursor: pointer;
  font-family: Open Sans;
  font-weight: 400;
  font-size: 16px;
  user-select: none;
  white-space: pre-wrap;

  > input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;

    &:checked ~ .box {
      background-color: ${({ theme }) => theme.primary};
      border: ${({ theme }) => `1px solid ${theme.darkPrimary}`};
      &:after {
        display: block;
      }
    }
  }

  > .box {
    position: absolute;
    top: 0;
    ${({ alignRight }) => (alignRight? "right: 0;" : "left: 0;")};
    height: 25px;
    width: 25px;
    background-color: ${({ theme }) => theme.checkBoxLightGrey};
    border-radius: 4px;
    border: ${({ error, theme }) => (error? `1px solid ${theme.red}` : `1px solid ${theme.checkBoxLightGreyBorder}`)};

    &:after {
      content: "";
      position: absolute;
      display: none;

      left: 10.5px;
      top: 6px;
      width: 5px;
      height: 10px;
      border: ${({ theme }) => `solid ${theme.white}`};
      border-width: 0 3px 3px 0;
      transform: rotate(45deg);
    }
  }

  &:hover > input {
    &:checked ~ .box {
      ${'' /* background-color: ${({ theme }) => theme.darkPrimary}; */}
      border: ${({ theme }) => `1px solid ${theme.darkerPrimary}`};
    }
    & ~ .box {
      ${'' /* background-color: ${({ theme }) => theme.checkBoxLightGreyHover}; */}
      border: ${({ theme }) => `1px solid ${theme.checkBoxLightGreyBorderHover}`};
    }
  }
`;

const Checkbox = ({ value, id, label, checked, onChange, error, alignRight }) => {
  const handleChange = e => {
    onChange(value, e.target.checked);
  };
  return (
    <StyledCheckbox htmlFor={id} error={error} alignRight={alignRight}>
      {label}
      <input
        type="checkbox"
        id={id}
        name={label}
        value={value}
        onChange={handleChange}
        checked={checked}
      />
      <span className="box" />
    </StyledCheckbox>
  );
};
export {Checkbox};

const CheckboxField = ({ id, label, explanation, items, value, onChange, error }) => {
  const handleChange = (val, checked) => {
    if (checked) {
      onChange([...value, val]);
    } else {
      onChange(value.filter(k => k !== val));
    }
  };
  return (
    <StyledCheckboxField explanation={explanation}>
      <div>
        <div className="CheckboxList">
          {items &&
            items.map((item, i) => (
              <Checkbox
                key={item.value}
                id={`${id}-${i}`}
                label={label}
                checked={value.includes(item.value)}
                onChange={handleChange}
                {...item}
                error={error}
              />
            ))}
        </div>
        {explanation && <div className="explanation">{explanation}</div>}
        <label>{label}</label>
      </div>
    </StyledCheckboxField>
  );
};

export default CheckboxField;

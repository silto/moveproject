import React from "react";
import styled from "styled-components";
import InfoTooltip from "../Tooltips/InfoTooltip";

const GlobalContainer = styled.label`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const InputContainer = styled.label`
  position: relative;
  display: inline-block;
  width: ${({ width }) => width}px;
  height: ${({ height }) => height}px;
  > input {
    display: none;
  }
`;

const Input = styled.input`
  &:checked + span {
    background-color: ${({ theme }) => theme.primary};
  }
  &:disabled + span {
    background-color: ${({ theme, twoSided }) => (twoSided? theme.toggleDarkPrimary : theme.toggleGrey)};
    opacity: 0.4;
    cursor: not-allowed;
  }
  &:disabled:checked + span {
    background-color: ${({ theme }) => theme.primary};
    opacity: 0.4;
    cursor: not-allowed;
  }
  &:focus + span {
    box-shadow: 0 0 1px #2196f3;
  }
  &:checked + span:before {
    -webkit-transform: translateX(${({ translate }) => translate}px);
    -ms-transform: translateX(${({ translate }) => translate}px);
    transform: translateX(${({ translate }) => translate}px);
  }
`;

const Slider = styled.span`
  position: absolute;
  cursor: pointer;
  display: flex;
  align-items: center;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme, twoSided }) => (twoSided? theme.toggleDarkPrimary : theme.toggleGrey)};
  -webkit-transition: 0.2s;
  transition: 0.2s;
  border-radius: 34px;
  &:before {
    position: relative;
    border-radius: 50%;
    content: '';
    height: ${({ sliderHeight }) => sliderHeight}px;
    width: ${({ sliderWidth }) => sliderWidth}px;
    left: 4px;
    background-color: ${({ theme }) => theme.white};
    -webkit-transition: 0.2s;
    transition: 0.2s;
  }
`;

const Label = styled.span`
  color: ${({ theme }) => theme.form};
  font-size: 15px;
  font-family: Montserrat;
  padding: 0 10px;
`;

export type ToggleProps = {
  id?: string,
  checked: boolean,
  disabled: ?boolean,
  onChange: () => void,
  twoSided: ?boolean,
  name: ?string,
  value: string,
  labelRight: string,
  labelLeft: ?string,
  sliderWidth: ?number,
  sliderHeight: ?number,
  width: ?number,
  height: ?number,
  translate: ?any,
  infoTooltip: ?string|React.Node,
};

const Toggle = ({
  id,
  onChange,
  checked,
  disabled,
  width,
  height,
  translate,
  twoSided,
  name,
  value,
  labelRight,
  labelLeft,
  sliderWidth,
  sliderHeight,
  infoTooltip,
}: ToggleProps) => {
  const handleChange = e => {
    onChange(e.target.checked);
  };
  return (
    <GlobalContainer>
      {labelLeft && <Label>{labelLeft}</Label>}
      <InputContainer width={width} height={height}>
        <Input
          type="checkbox"
          id={id}
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          translate={translate}
          onChange={handleChange}
          twoSided={twoSided}
        />
        <Slider
          sliderWidth={sliderWidth}
          sliderHeight={sliderHeight}
          twoSided={twoSided}
          checked={checked}
        />
      </InputContainer>
      {labelRight && <Label>{labelRight}{infoTooltip && <InfoTooltip text={infoTooltip}/>}</Label>}
    </GlobalContainer>
  );
};

Toggle.defaultProps = {
  sliderWidth: 26,
  sliderHeight: 26,
  width: 60,
  height: 34,
  translate: 26,
};

export default Toggle;

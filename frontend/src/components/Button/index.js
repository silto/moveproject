/*eslint-disable indent*/

import React from "react";
import styled from "styled-components";

const StyledButton = styled.button`
  background-color: ${({ theme, color, variant }) =>
    (variant === "default" &&
      ((color === "primary" && theme.primary) ||
        (color === "secondary" && theme.secondary) ||
        (color === "warning" && theme.red) ||
        (color === "success" && theme.green) ||
        (color === "white" && theme.white) ||
        theme.grey)) ||
    (variant === "line" && "transparent")};
  color: ${({ theme, variant, color }) =>
    (variant === "line" &&
      ((color === "primary" && theme.primary) ||
        (color === "secondary" && theme.secondary) ||
        (color === "warning" && theme.red) ||
        (color === "success" && theme.green) ||
        (color === "white" && theme.white) ||
        theme.grey)) ||
    (variant === "default" &&
      ((color === "primary" && theme.white) ||
        (color === "secondary" && theme.white) ||
        (color === "warning" && theme.white) ||
        (color === "success" && theme.white) ||
        (color === "white" && theme.primary) ||
        theme.grey))};
  border: ${({ theme, variant, color }) =>
    `2px solid ${(variant === "line" &&
      ((color === "primary" && theme.primary) ||
        (color === "secondary" && theme.secondary) ||
        (color === "warning" && theme.red) ||
        (color === "success" && theme.green) ||
        (color === "white" && theme.white) ||
        theme.grey)) ||
      (variant === "default" && "transparent")}`};
  outline: none;
  border-radius: 4px;
  height: ${({ height }) => height || "40px"};
  box-sizing: border-box;
  padding: ${({ padding }) => padding || "0 4px"};
  width: ${({ width }) => width};
  min-width: ${({ minWidth }) => minWidth};
  position: relative;
  overflow: hidden;
  font-family: Montserrat;
  font-weight: 600;
  font-size: ${({ fontSize }) => fontSize || "16px"};
  display: inline-block;
  text-decoration: none;
  vertical-align: middle;
  line-height: 36px;
  text-align: center;
  cursor: pointer;

  &:after {
    content: "";
    position: absolute;
    background-color: ${({ theme, color, variant }) =>
      (color === "primary" && theme.white) ||
      (color === "secondary" && theme.white) ||
      (color === "warning" && theme.white) ||
      (color === "success" && theme.white) ||
      (color === "white" && theme.white) ||
      theme.grey};
    opacity: 0;
    top: 0;
    left: 0%;
    width: 100%;
    height: 100%;
    transition: 0.3s ease;
  }

  &:hover {
    text-decoration: none;
    color: ${({ theme, variant, color }) =>
      (variant === "line" &&
        ((color === "primary" && theme.primary) ||
          (color === "secondary" && theme.secondary) ||
          (color === "warning" && theme.red) ||
          (color === "success" && theme.green) ||
          (color === "white" && theme.white) ||
          theme.grey)) ||
      (variant === "default" &&
        ((color === "primary" && theme.white) ||
          (color === "secondary" && theme.white) ||
          (color === "warning" && theme.white) ||
          (color === "success" && theme.white) ||
          (color === "white" && theme.primary) ||
          theme.grey))};
    &:after {
      opacity: 0.1;
    }
  }
  &:focus {
    border: ${({ theme, variant, color }) =>
      `2px solid ${(variant === "line" &&
        ((color === "primary" && theme.primary) ||
          (color === "secondary" && theme.secondary) ||
          (color === "warning" && theme.red) ||
          (color === "success" && theme.green) ||
          (color === "white" && theme.white) ||
          theme.grey)) ||
        (variant === "default" && "transparent")}`};
    outline: none;
    text-decoration: none;
    ${'' /* &:after {
      opacity: 0;
    } */}
  }
  &.disabled {
    text-decoration: none;
    background-color: ${({ theme, color, variant }) =>
      (variant === "default" && theme.grey) ||
      (variant === "line" && "transparent")};
    color: ${({ theme, variant, color }) =>
      (variant === "line" && theme.grey) ||
      (variant === "default" && theme.white)};
    border: ${({ theme, variant, color }) =>
      `2px solid ${(variant === "line" && theme.grey) ||
        (variant === "default" && "transparent")}`};
    &:after {
      opacity: 0;
    }
  }
`;

const Button = ({ color, width, height, padding, disabled, ...rest }: Object) => {
  return <StyledButton color={color} height={height} width={width} padding={padding} disabled={disabled} className={disabled? "disabled":null} {...rest} />;
};

Button.defaultProps = {
  variant: "default",
};

export default Button;

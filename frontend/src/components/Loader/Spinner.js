import React from "react";
import styled, { keyframes } from "styled-components";

const loader = ({ theme }) => keyframes`
  0%{
    background-color: ${theme.primary};
    height: 0;
    width: 0;
  }

  29%{
    background-color: ${theme.primary};
  }

  30%{
    background-color: transparent;
    border-width: 16px;
    opacity: 1;
    height: 100%;
    width: 100%;
  }

  100%{
    border-width: 0;
    opacity: 0;
    background-color: transparent;
    height: 100%;
    width: 100%;
  }
`;

const StyledSpinner = styled.div`
  height: 0;
  width: 0;
  box-sizing: border-box;
  border: 0 solid ${({ theme }) => theme.primary};
  border-radius: 50%;
  animation: ${loader} 1.15s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const StyledContainer = styled.div`
  overflow: visible;
  height: ${({ size }) => size}px;
  width: ${({ size }) => size}px;
  position: relative;
`;

const Spinner = ({ size }: {size: number|string}) => (
  <StyledContainer size={size}>
    <StyledSpinner size={size} />
  </StyledContainer>
);

Spinner.defaultProps = {
  size: 32,
};

export default Spinner;

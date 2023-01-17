import React from "react";
import styled from "styled-components";

const StyledMenuButton = styled.button`
  vertical-align: middle;
  color: inherit;
  outline: none;
  background: none;
  margin: 0;
  border: none;
  padding: 0;
  width: 100%;
  height: 100%;
  line-height: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  -webkit-tap-highlight-color: transparent;
  &:focus { outline: none; }
  > .menu-icon {
    fill: ${({ theme }) => theme.topbarText};
    > svg {
      pointer-events: none;
      display: block;
      width: 100%;
      height: 100%;
    }
  }
`;

const MenuButton = ({ onClick }: {onClick: Function}) => {
  return <StyledMenuButton onClick={onClick}>
    <div className="menu-icon">
      <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false">
        <g>
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
        </g>
      </svg>
    </div>
  </StyledMenuButton>;
};

export default MenuButton;

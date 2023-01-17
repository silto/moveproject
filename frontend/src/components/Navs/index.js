import React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;

  & > * {
    box-sizing: border-box;
    cursor: pointer;
    display: flex;

    font-family: Montserrat;
    font-size: 14px;
    font-weight: 600;

    outline: none;
    position: relative;
    text-decoration: none;
    transition: 0.3s ease;

    align-self: center;
    align-items: center;
    color: ${({ theme }) => theme.navText};
    justify-self: center;
    height: 40px;
    padding: 10px 0px;
    text-transform: uppercase;
    white-space: nowrap;

    & + * {
      margin-left: 32px;
    }
    &:after {
      background-color: transparent;
      content: " ";
      height: 2px;
      left: 0;

      position: absolute;
      top: 28px;
      transition: 0.3s ease;
      width: 100%;
    }
    &:hover,
    &.active {
      color: ${({ theme }) => theme.primary};
      &:after {
        background-color: ${({ theme }) => theme.primary};
      }
    }
    & > * {
    }
  }
`;

const Navs = ({ items, renderItems, active, onClick, ...rest }) => {
  return (
    <Wrapper {...rest}>
      {items.map(item => renderItems({ item, onClick, active }))}
    </Wrapper>
  );
};

Navs.defaultProps = {
  onClick: () => {},
  renderItems: ({ item, onClick, active }) => (
    <div
      key={item.slug}
      onClick={() => onClick(item.slug)}
      className={item.slug === active ? "active" : ""}
    >
      {item.label}
    </div>
  )
};

export default Navs;

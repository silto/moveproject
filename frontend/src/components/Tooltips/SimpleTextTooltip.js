import React from "react";
import styled from "styled-components";
import Tippy from "@tippy.js/react";

const SimpleTippy = styled(Tippy)`
  border: 1px solid ${({ theme }) => theme.form};
  border-radius: 4px;
  padding: 10px;
  box-shadow: 0 0 20px 4px rgba(154, 161, 177, .15), 0 4px 80px -8px rgba(36, 40, 47, .25), 0 4px 4px -2px rgba(91, 94, 105, .15);
  background: ${({ theme }) => theme.containerBackground};
  font-family: Open Sans;
  color: ${({ theme }) => theme.normalText};
  font-weight: 400;
  font-size: 14px;
  white-space: pre-wrap;


  .tippy-backdrop {
  	background-color: #fff
  }

  .tippy-svg-arrow {
  	fill: #fff
  }

  &[data-placement^='top'] {
    .tippy-arrow {
      border-width: 7px 7px 0;
    	border-top-color: #fff;
    }
  }
  &[data-placement^='bottom'] {
    .tippy-arrow {
      border-width: 0 7px 7px;
    	border-bottom-color: #fff;
    }
  }
  &[data-placement^='left'] {
    .tippy-arrow {
      border-width: 7px 0 7px 7px;
    	border-left-color: #fff;
    }
  }
  &[data-placement^='right'] {
    .tippy-arrow {
      border-width: 7px 7px 7px 0;
    	border-right-color: #fff;
    }
  }
`;

const SimpleTextTooltip = ({text, children, maxWidth}: {text: string|React.Node, children?: React.Node, maxWidth?: number}) => (
  <SimpleTippy
    content={<span>{text}</span>}
    maxWidth={maxWidth || 300}
  >
    {children}
  </SimpleTippy>
);

export default SimpleTextTooltip;

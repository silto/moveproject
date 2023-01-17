import React from "react";
import styled from "styled-components";
import {Info} from "@styled-icons/octicons/Info";

import SimpleTextTooltip from "./SimpleTextTooltip";

const InfoLogo = styled(Info)`
  width: 16px;
  height: 16px;
  margin-left: 8px;
  color: ${({ theme }) => theme.primary};
  cursor: pointer;
  display: inline-block;
`;

const InfoTooltip = ({text}: {text: string|React.Node}) => (
  <SimpleTextTooltip
    text={text}
  >
    <InfoLogo/>
  </SimpleTextTooltip>
);

export default InfoTooltip;

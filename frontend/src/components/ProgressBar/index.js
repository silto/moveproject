import React from "react";
import styled from "styled-components";
import { withTranslation } from "react-i18next";

const Wrapper = styled.div`
  display: ${({ heading }) => (heading && `grid`) || `flex`};
  grid-template-areas: ${({ headingPosition }) =>
    (headingPosition === "bottom" && `"bar bar" "label percentage"`) ||
    `"label percentage" "bar bar"`};
  justify-content: space-between;
  grid-row-gap: 6px;
  height: 40px;
  grid-template-rows: ${({ headingPosition }) =>
    (headingPosition === "bottom" && `4px 20px`) || `20px 4px`};
  width: ${({ width }) => width || "100%"};
`;
const Percentage = styled.div`
  grid-area: percentage;
  color: ${({ theme }) => theme.grey};
  font-size: 12px;
  font-family: Open Sans;
  font-weight: 600;
  text-transform: uppercase;
  align-self: end;
`;
const Label = styled.div`
  grid-area: label;
  color: ${({ theme }) => theme.grey};
  font-size: 12px;
  font-family: Open Sans;
  font-weight: 600;
  text-transform: uppercase;
  align-self: end;
`;
const Bar = styled.progress`
  -webkit-appearance: none;
  appearance: none;
  grid-area: bar;
  width: 100%;
  align-self: ${({ heading }) => (heading && `start`) || `center`};
  height: 4px;

  &::-webkit-progress-bar {
    background-color: ${({ theme }) => theme.lightGrey};
    border-radius: 4px;
  }

  &::-webkit-progress-value {
    background-color: ${({ theme }) => theme.primary};
    border-radius: 4px;
    transition: 0.3s ease;
  }
`;

const ProgressBar = ({
  t,
  width,
  value,
  max,
  heading,
  formatLabel,
  headingPosition,
  formatOnComplete,
  completedLabel,
  formatPercentage,
  ...rest
}) => {
  const percentage =
    (max !== 0 && value >= 0 && value <= max && (value * 100) / max) || 0;
  return (
    <Wrapper className={"progressBar"} width={width} heading={heading} headingPosition={headingPosition}>
      {heading && <Label>{formatLabel({ t, percentage, value, max })}</Label>}
      {heading && (
        <Percentage>
          {percentage.toFixed(0) === "100" && completedLabel
            ? completedLabel
            : formatPercentage({ percentage, value, max })}
        </Percentage>
      )}
      <Bar
        value={percentage.toFixed(0)}
        max={100}
        heading={heading}
        {...rest}
      />
    </Wrapper>
  );
};

ProgressBar.defaultProps = {
  max: 100,
  heading: true,
  formatLabel: ({ t }) => t("common:progress"),
  headingPosition: "top",
  completeLabel: false,
  formatPercentage: ({ percentage }) => `${percentage.toFixed(0)} %`
};

export default withTranslation("common")(ProgressBar);

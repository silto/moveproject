import styled from "styled-components";

const ChartZone = styled.div`
  font-size: 16px;
  font-weight: 400;
  font-family: Open Sans;
  color: ${({ theme }) => theme.normalText};
  margin-left: auto;
  margin-right: auto;
  > .selector {
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 20px;
  }
  > .infoSummaryPlaceHolder {
    height: 120px;
    padding-top: 40px;
    > div {
      margin: auto;
    }
  }
  > .infoSummary {
    margin: 20px auto 20px auto;
    text-align: center;

    h3 {
      color: ${({ theme }) => theme.titleText};
      font-weight: 600;
      font-size: 20px;
      margin: 0 0 16px;
    }
    .textLine {
      width: 100%;
      margin-bottom: 16px;
      strong {
        color: ${({ theme }) => theme.titleText};
        font-weight: 600;
      }
    }
    .separator {
      display: inline-block;
      border-top: 1px solid ${({ theme }) => theme.normalText};
      height: 5px;
      width: 45px;
      margin: 0 8px 0;
      @media (max-width: 768px) {
        display: block;
        width: 0;
      }
    }
  }
  > .toggle {
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 20px;
  }
  .chartContainer {
    width: 100%;
    height: calc(76vh);
    > .highcharts-stocktools-wrapper {
      max-height: calc(76vh);
    }
  }
`;

export default ChartZone;

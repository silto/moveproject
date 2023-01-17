import styled from "styled-components";

const Container = styled.div`
${"" /* max-width: 800px; */}
  min-height: calc(100vh - 256px);
  margin: 0 auto;
  box-sizing: border-box;
  height: auto;
  padding: 32px;
  border: ${({ theme }) => (theme.containerBorder? `1px solid ${theme.containerBorder}` : "none")};
  border-radius: 4px;
  box-shadow: ${({ theme }) => (theme.containerShadow? `0px 2px 1px -1px ${
    theme.containerShadow}33, 0px 1px 1px 0px ${
    theme.containerShadow}24, 0px 1px 3px 0px ${
    theme.containerShadow}1f` : "none")};
  ${"" /* box-shadow: ${({ theme }) => `${theme.containerShadow}12 0px 5px 10px, ${theme.black}0d 0px 5px 5px`}; */}
  background: ${({ theme }) => theme.containerBackground};

  @media (max-width: 600px) {
    padding: 16px;
  }

`;

export default Container;

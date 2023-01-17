import styled from "styled-components";

const Title = styled.h2`
  text-align: center;
  color: ${({ theme }) => theme.titleText};
  font-family: Open Sans;
  font-weight: 600;
  font-size: 30px;
  margin: 0 0 32px;
  ${'' /* text-transform: uppercase; */}
`;

export default Title;

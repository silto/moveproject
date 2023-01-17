import styled from "styled-components";

const ErrorMessage = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.red};
  font-family: Open Sans;
  font-weight: 600;
  font-size: 14px;
  margin-top: 8px;
  margin-bottom: 8px;
`;

const formatError = (message) => (message ?
  message.toLowerCase()
  .replace(/_(.)/g,(key, p1) => p1.toUpperCase()) : "")
  .replace(/-/g, ".");
export {formatError};
export default ErrorMessage;

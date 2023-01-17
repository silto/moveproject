import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  body {
    color: ${({ theme }) => theme.normalText};
    background-color: ${({ theme }) => theme.backgroundTop};
  }
  ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
  }
  ::-webkit-scrollbar-thumb {
      border-radius: 12px;
      background: ${({ theme }) => theme.scrollBarThumb};
  }
  ::-webkit-scrollbar-track {
      background: ${({ theme }) => theme.scrollBarTrack};
  }
`;

export const lightTheme = {
  topbarPrimary: "#000000",
  topbarText: "#FFFFFF",
  topbarSeparator: "#373940",
  fadedTopbarText: "#e3e3e3",
  navText: "#64666b",
  titleText: "#20232a",
  normalText: "#64666b",
  action: "#2cb4c9",
  form: "#828282",
  primary: "#2cb4c9",
  containerBackground: "#ffffff",
  containerShadow: "#000000",
  backgroundBottom: "#F3F3F4",
  backgroundTop: "#F3F3F4",
  footerBackground: "#000000",
  footerText: "#8a8a8a",
  footerLink: "#bdbdbd",
  footerSeparator: "#eaeaea",
  toggleDarkPrimary: "#155868",
  toggleGrey: "#cccccc",
  checkBoxDarkPrimary: "#0a6cbd",
  checkBoxDarkerPrimary: "#084078",
  checkBoxLightGrey: "#f2f2f2",
  checkBoxLightGreyHover: "#cccccc",
  checkBoxLightGreyBorder: "#bbbbbb",
  checkBoxLightGreyBorderHover: "#909090",
  green: "#2bc77a",
  red: "#fa3b69",
  landingText: "#2e2e2f",
  landingDarkerPrimary: "#084078",
  landingLabelText: "#64666b",
  white: "#fff",
  scrollBarTrack: "rgba(0, 0, 0, 0.05)",
  scrollBarThumb: "rgba(0, 0, 0, 0.2)",
  inverter: "invert(0)",
};

export const darkTheme = {
  topbarPrimary: "#000000",
  topbarText: "#FFFFFF",
  topbarSeparator: "#373940",
  fadedTopbarText: "#e3e3e3",
  navText: "#e3e3e3",
  titleText: "#ffffff",
  normalText: "#e0e0e0",
  action: "#2cb4c9",
  form: "#bababa",
  primary: "#2cb4c9",
  containerBackground: "#111722",
  containerShadow: null,
  backgroundBottom: "#0A0E17",
  backgroundTop: "#0A0E17",
  footerBackground: "#000000",
  footerText: "#8a8a8a",
  footerLink: "#bdbdbd",
  footerSeparator: "#373940",
  toggleDarkPrimary: "#155868",
  toggleGrey: "#64666b",
  checkBoxDarkPrimary: "#0a6cbd",
  checkBoxDarkerPrimary: "#084078",
  checkBoxLightGrey: "#f2f2f2",
  checkBoxLightGreyHover: "#cccccc",
  checkBoxLightGreyBorder: "#bbbbbb",
  checkBoxLightGreyBorderHover: "#909090",
  green: "#2bc77a",
  red: "#fa3b69",
  landingText: "#2e2e2f",
  landingDarkerPrimary: "#084078",
  landingLabelText: "#64666b",
  white: "#fff",
  scrollBarTrack: "rgba(255, 255, 255, 0.05)",
  scrollBarThumb: "rgba(255, 255, 255, 0.2)",
  inverter: "invert(1)",
};

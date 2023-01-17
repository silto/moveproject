import { lightTheme, darkTheme } from "../../theme";



const initLightDarkBackground = (theme) => {
  const themeObj = theme === "light"? lightTheme : darkTheme;
  document.body.style.backgroundImage = `linear-gradient(to top, ${themeObj.backgroundBottom} 0%, ${themeObj.backgroundTop} 100%)`;
};

export default initLightDarkBackground;

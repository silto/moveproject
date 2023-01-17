
export const extractProp = function(state, property) {
  let lastStage = state;
  if (typeof property === "string") {
    lastStage = state.get(property);
  } else {
    for (let i = 0; i < property.length - 1; i++) {
      lastStage = state[property[i]];
    }
    lastStage = lastStage.get(property[property.length - 1]);
  }
  return lastStage;
};

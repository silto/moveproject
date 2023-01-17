module.exports = function(apiInterface, interfaceConfig) {
  let settings = {
    _allowance: 0,
    set: (newAllowance) => {
      this._allowance = newAllowance;
    },
    get: () => {
      return this._allowance;
    },
  };
  return apiInterface.getAllowance(interfaceConfig)
  .then(allowance => {
    settings._allowance = allowance.remaining || 0;
    return settings;
  });
};

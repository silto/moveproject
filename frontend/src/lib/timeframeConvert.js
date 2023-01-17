const HCtfTable = {
  "1m": "1",
  "3m": "3",
  "5m": "5",
  "15m": "15",
  "30m": "30",
  "1h": "60",
  "2h": "120",
  "4h": "240",
  "6h": "360",
  "12h": "720",
  "1d": "1D",
  "3d": "3D",
  "1w": "1W",
};

module.exports.HCtoTV = (HCtf) => {
  return HCtfTable[HCtf];
};

const TVtfTable = {
  "1": "1m",
  "3": "3m",
  "5": "5m",
  "15": "15m",
  "30": "30m",
  "60": "1h",
  "120": "2h",
  "240": "4h",
  "360": "6h",
  "720": "12h",
  "1D": "1d",
  "3D": "3d",
  "1W": "1w",
};

module.exports.TVtoHC = (TVtf) => {
  return TVtfTable[TVtf];
};



module.exports.getIpFromRequest = (req) => {
  if (!req) {
    return null;
  }
  let ipAddr = req.headers["x-forwarded-for"];
  console.info("forwarded ip", ipAddr);
  console.info("req remote address", req.connection && req.connection.remoteAddress);
  if (ipAddr){
    const list = ipAddr.split(",");
    ipAddr = list[0];
  } else {
    ipAddr = req.connection && req.connection.remoteAddress;
  }
  return ipAddr;
};

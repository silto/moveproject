/* eslint-disable camelcase */
const moment = require("moment");
const { OHLC_TIMEFRAMES } = require("./constants");
const config = require("../../config");
const btcApiInterface = require("../interface")[config.priceDataInterface];
const btcApiInterfaceConfig = config.interfacesConfig[config.priceDataInterface];

/* Returns probability of occuring below and above target price. */
module.exports.probability = function(price, target, days, volatility) {
  const p = price;
  const q = target;
  const t = days / 365;
  const v = volatility;

  const vt = v*Math.sqrt(t);
  const lnpq = Math.log(q/p);

  const d1 = lnpq / vt;

  const y = Math.floor(1/(1+.2316419*Math.abs(d1))*100000)/100000;
  const z = Math.floor(.3989423*Math.exp(-((d1*d1)/2))*100000)/100000;
  const y5 = 1.330274*Math.pow(y,5);
  const y4 = 1.821256*Math.pow(y,4);
  const y3 = 1.781478*Math.pow(y,3);
  const y2 = 0.356538*Math.pow(y,2);
  const y1 = 0.3193815*y;
  let x = 1-z*(y5-y4+y3-y2+y1);
  x = Math.floor(x*100000)/100000;

  if (d1<0) {
    x=1-x;
  }

  const pabove = Math.floor(x*1000)/10;
  const pbelow = Math.floor((1-x)*1000)/10;

  return [[pbelow],[pabove]];
};
//  JavaScript adopted from Bernt Arne Odegaard's Financial Numerical Recipes
//  http://finance.bi.no/~bernt/gcc_prog/algoritms/algoritms/algoritms.html
//  by Steve Derezinski, CXWeb, Inc.  http://www.cxweb.com
//  Copyright (C) 1998  Steve Derezinski, Bernt Arne Odegaard
//
//  This program is free software; you can redistribute it and/or
//  modify it under the terms of the GNU General Public License
//  as published by the Free Software Foundation.

//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//  http://www.fsf.org/copyleft/gpl.html

const ndist = function(z) {
  return (1.0/(Math.sqrt(2*Math.PI)))*Math.exp(-0.5*z);
};

const N = function(z) {
  const b1 =  0.31938153;
  const b2 = -0.356563782;
  const b3 =  1.781477937;
  const b4 = -1.821255978;
  const b5 =  1.330274429;
  const p  =  0.2316419;
  const c2 =  0.3989423;
  const a=Math.abs(z);
  if (a>6.0) {
    return 1.0;
  }
  const t = 1.0/(1.0+a*p);
  const b = c2*Math.exp((-z)*(z/2.0));
  let n = ((((b5*t+b4)*t+b3)*t+b2)*t+b1)*t;
  n = 1.0-b*n;
  if (z < 0.0) {
    n = 1.0 - n;
  }
  return n;
};

const black_scholes = module.exports.black_scholes = function(call,S,X,r,v,t) {
// call = Boolean (to calc call, call=True, put: call=false)
// S = stock prics, X = strike price, r = no-risk interest rate
// v = volitility (1 std dev of S for (1 yr? 1 month?, you pick)
// t = time to maturity

// define some temp vars, to minimize function calls
  const sqt = Math.sqrt(t);
  let Nd2;  //N(d2), used often
  // let nd1;  //n(d1), also used often
  let ert;  //e(-rt), ditto
  let delta;  //The delta of the option

  const d1 = (Math.log(S/X) + r*t)/(v*sqt) + 0.5*(v*sqt);
  const d2 = d1 - (v*sqt);

  if (call) {
    delta = N(d1);
    Nd2 = N(d2);
  } else { //put
    delta = -N(-d1);
    Nd2 = -N(-d2);
  }

  ert = Math.exp(-r*t);
  // nd1 = ndist(d1);

  // const gamma = nd1/(S*v*sqt);
  // const vega = S*sqt*nd1;
  // const theta = -(S*v*nd1)/(2*sqt) - r*X*ert*Nd2;
  // const rho = X*t*ert*Nd2;

  return ( S*delta-X*ert *Nd2);
};

const option_implied_volatility = function(call,S,X,r,t,o) {
// call = Boolean (to calc call, call=True, put: call=false)
// S = stock prics, X = strike price, r = no-risk interest rate
// t = time to maturity
// o = option price

// define some temp vars, to minimize function calls
  const sqt = Math.sqrt(t);
  const MAX_ITER = 100;
  const ACC = 0.0001;

  let sigma = (o/S)/(0.398*sqt);
  let price,diff,d1,vega;
  for (let i=0;i<MAX_ITER;i++) {
    price = black_scholes(call,S,X,r,sigma,t);
    diff = o-price;
    if (Math.abs(diff) < ACC) {
      return sigma;
    }
    d1 = (Math.log(S/X) + r*t)/(sigma*sqt) + 0.5*sigma*sqt;
    vega = S*sqt*ndist(d1);
    sigma = sigma+diff/vega;
  }
  return new Error("could not converge");
};

module.exports.callIV = function(s,x,r,t,o) {
  return option_implied_volatility(true,s,x,r/100,t,o);
};

const putIV = module.exports.putIV = function(s,x,r,t,o) {
  // console.log("getting IV with params");
  // console.log(s);
  // console.log(x);
  // console.log(r);
  // console.log(t);
  // console.log(o);
  return option_implied_volatility(false,s,x,r/100,t,o);
};

module.exports.getMoveIV = function(candle, effectiveDate, expiration, btcInterfaceAllowance) {
  const price = candle.open;
  const timestamp = candle.timestamp;
  const timeframe = candle.timeframe;
  return btcApiInterface.market.getOHLC(btcInterfaceAllowance, `CCCAGG__BTC/USD`, {
    period: timeframe,
    after: timestamp,
    before: timestamp + OHLC_TIMEFRAMES[timeframe],
  }, btcApiInterfaceConfig)
  .then((btcdata) => {
    if (!btcdata || !btcdata[0]) {
      return null;
    }
    const underlyingPrice = btcdata[0].open;
    const equivalentPUTPrice = price / 2;
    const timeToMaturity = expiration.diff(moment(effectiveDate || candle.date),"hours");
    const IV = putIV(underlyingPrice,underlyingPrice,0,timeToMaturity/(365*24),equivalentPUTPrice);
    return Math.floor(IV * 1000) / 1000;
  })
  .catch((e) => {
    console.error(e);
    return null;
  });
};

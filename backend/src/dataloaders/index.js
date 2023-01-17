/* @flow */
const mongoose = require("mongoose");
const DataLoader = require("dataloader");

const {
  createMoveLoader,
  createMoveSymbolLoader,
  createMovesForDatesLoader,
  createMoveRefsLoader,
} = require("./move");
const {
  createOhlcLoader,
  createOhlcAtDateLoader,
  createOhlcAtPositionLoader,
  createOhlcAtPositionForDatesLoader,
} = require("./ohlc");
const {
  createTradesLoader,
} = require("./trade");
const {
  createBTCOhlcLoader,
} = require("./btcohlc");
const {
  createUserLoader,
} = require("./user");
const {
  createBacktestLoader,
} = require("./backtest");
const {
  createMonthlyExpirationAvgLoader,
} = require("./dataAggregators/expirations/distributions/monthly");
const {
  createWeeklyExpirationAvgLoader,
} = require("./dataAggregators/expirations/distributions/weekly");
const {
  createExpirationDistributionLoader,
} = require("./dataAggregators/expirations/distributions/byPrice");
const {
  createExpirationsMinMaxLoader,
  createExpirationsLoader,
} = require("./dataAggregators/expirations/histories");
const {
  createTradesSummaryLoader,
} = require("./dataAggregators/trades");
/* eslint-disable no-unused-vars */
const User = mongoose.model("User");
const Move = mongoose.model("Move");
const OHLC = mongoose.model("OHLC");
const Trade = mongoose.model("Trade");
const BTCOHLC = mongoose.model("BTCOHLC");
const Backtest = mongoose.model("Backtest");
/* eslint-enable no-unused-vars */
/*::
import type {MovesForDatesQueryParams} from "./move";
import type {OHLCSubQueryParams, OHLCAtDateQueryParams, OHLCAtPositionQueryParams} from "./ohlc";
import type {TradeSubQueryParams} from "./trade";
import type {BTCOHLCQueryParams} from "./btcohlc";
import type {
  MonthlyExpirationData,
  MonthlyExpirationParams,
} from "./dataAggregators/expirations/distributions/monthly";
import type {
  WeeklyExpirationData,
  WeeklyExpirationParams,
} from "./dataAggregators/expirations/distributions/weekly";
import type {
  ExpirationDistributionParams,
  ExpirationDistributionData,
} from "./dataAggregators/expirations/distributions/byPrice";
import type {
  ExpirationParams,
  ExpirationData,
  ExpirationMinMaxParams,
  ExpirationMinMaxData,
} from "./dataAggregators/expirations/histories";
import type {
  TradesSummary,
} from "./dataAggregators/trades";
export type UserLoaders = {
  move: DataLoader<string,Move>,
  moveSymbol: DataLoader<string,Move>,
  moveRefs: DataLoader<boolean,Array<{_id: Object, symbol: string}>>,
  ohlc: DataLoader<OHLCSubQueryParams,Array<OHLC>>,
  ohlcAtDate: DataLoader<OHLCAtDateQueryParams,OHLC>,
  ohlcAtPosition: DataLoader<OHLCAtPositionQueryParams,OHLC>,
  ohlcAtPositionForDates: DataLoader<OHLCAtPositionForDatesQueryParams,Array<OHLC>>,
  movesForDates: DataLoader<MovesForDatesQueryParams,Array<OHLC>>,
  trades: DataLoader<TradeSubQueryParams,Array<Trade>>,
  btcohlc: DataLoader<BTCOHLCQueryParams,Array<BTCOHLC>>,
  backtest: DataLoader<string,Backtest>,
  weeklyExpirationAvg: DataLoader<WeeklyExpirationParams,WeeklyExpirationData>,
  monthlyExpirationAvg: DataLoader<MonthlyExpirationParams,MonthlyExpirationData>,
  expirationDistribution: DataLoader<ExpirationDistributionParams,ExpirationDistributionData>,
  expirations: DataLoader<ExpirationParams,Array<ExpirationData>>,
  expirationsMinMax: DataLoader<ExpirationMinMaxParams,Array<ExpirationMinMaxData>>,
  tradesSummary: DataLoader<String,TradesSummary>,
  user?: DataLoader<boolean,User>,
}
export type AuthenticatedUserLoaders = {
  user: DataLoader<boolean,User>,
}
*/

const createUserLoaders = exports.createUserLoaders = (
  userId/*: string|false*/
)/*: UserLoaders*/ => {
  const notSpecificLoaders/*: Object*/ = {
    move: createMoveLoader(),
    moveSymbol: createMoveSymbolLoader(),
    moveRefs: createMoveRefsLoader(),
    ohlc: createOhlcLoader(),
    ohlcAtDate: createOhlcAtDateLoader(),
    ohlcAtPosition: createOhlcAtPositionLoader(),
    ohlcAtPositionForDates: createOhlcAtPositionForDatesLoader(),
    movesForDates: createMovesForDatesLoader(),
    trades: createTradesLoader(),
    btcohlc: createBTCOhlcLoader(),
    backtest: createBacktestLoader(),
    weeklyExpirationAvg: createWeeklyExpirationAvgLoader(),
    monthlyExpirationAvg: createMonthlyExpirationAvgLoader(),
    expirationDistribution: createExpirationDistributionLoader(),
    expirations: createExpirationsLoader(),
    expirationMinMax: createExpirationsMinMaxLoader(),
    tradesSummary: createTradesSummaryLoader(),
  };
  if (!userId) {
    return notSpecificLoaders;
  }
  const specificLoaders = Object.assign(notSpecificLoaders, {
    user: createUserLoader(userId),
  });
  return specificLoaders;
};

const userLoadersLoader = new DataLoader(
  (userIds/*: Array<string|false> */) => Promise.resolve(
    userIds.map(userId => createUserLoaders(userId))
  ),
  {cache: false}
);

module.exports.userLoadersLoader = userLoadersLoader;

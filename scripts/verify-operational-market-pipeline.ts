import { buildOperationalMarketIntelligence, formatOperationalTelegramMessage } from '../src/lib/market/operationalMarketPipeline';

const operational = buildOperationalMarketIntelligence('BTC', '1h');

console.log(
  JSON.stringify(
    {
      symbol: operational.snapshot.asset.symbol,
      linePoints: operational.snapshot.candles.length,
      technicalSignal: operational.technical.finalSignal,
      analystConfidence: operational.analyst.confidence,
      directorDecision: operational.director.decision,
      telegramPreview: formatOperationalTelegramMessage('BTC', '1h'),
    },
    null,
    2,
  ),
);

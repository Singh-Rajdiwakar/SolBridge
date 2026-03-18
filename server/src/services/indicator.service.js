function toFixedNumber(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}

export function calculateSMA(candles, period = 20) {
  return candles.map((candle, index) => {
    if (index < period - 1) {
      return null;
    }
    const slice = candles.slice(index - period + 1, index + 1);
    const average = slice.reduce((sum, item) => sum + item.close, 0) / period;
    return {
      time: candle.time,
      value: toFixedNumber(average),
    };
  });
}

export function calculateEMA(candles, period = 21) {
  const multiplier = 2 / (period + 1);
  let previousEma = null;

  return candles.map((candle, index) => {
    if (index < period - 1) {
      return null;
    }

    if (previousEma === null) {
      const seed = candles.slice(index - period + 1, index + 1).reduce((sum, item) => sum + item.close, 0) / period;
      previousEma = seed;
    } else {
      previousEma = candle.close * multiplier + previousEma * (1 - multiplier);
    }

    return {
      time: candle.time,
      value: toFixedNumber(previousEma),
    };
  });
}

export function calculateRSI(candles, period = 14) {
  const values = [];
  let avgGain = 0;
  let avgLoss = 0;

  for (let index = 1; index < candles.length; index += 1) {
    const change = candles[index].close - candles[index - 1].close;
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);

    if (index <= period) {
      avgGain += gain;
      avgLoss += loss;

      if (index === period) {
        avgGain /= period;
        avgLoss /= period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        values.push({
          time: candles[index].time,
          value: toFixedNumber(100 - 100 / (1 + rs), 2),
        });
      } else {
        values.push(null);
      }
      continue;
    }

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    values.push({
      time: candles[index].time,
      value: toFixedNumber(100 - 100 / (1 + rs), 2),
    });
  }

  return [null, ...values];
}

export function calculateMACD(candles, fast = 12, slow = 26, signalPeriod = 9) {
  const fastEma = calculateEMA(candles, fast);
  const slowEma = calculateEMA(candles, slow);
  const macdLine = candles.map((candle, index) => {
    if (!fastEma[index] || !slowEma[index]) {
      return null;
    }
    return {
      time: candle.time,
      value: toFixedNumber(fastEma[index].value - slowEma[index].value, 4),
    };
  });

  let signal = null;
  const signalLine = macdLine.map((point, index) => {
    if (!point) {
      return null;
    }

    const validPoints = macdLine.slice(0, index + 1).filter(Boolean);
    if (validPoints.length < signalPeriod) {
      return null;
    }

    if (signal === null) {
      signal =
        validPoints.slice(-signalPeriod).reduce((sum, item) => sum + item.value, 0) / signalPeriod;
    } else {
      const multiplier = 2 / (signalPeriod + 1);
      signal = point.value * multiplier + signal * (1 - multiplier);
    }

    return {
      time: point.time,
      value: toFixedNumber(signal, 4),
    };
  });

  const histogram = macdLine.map((point, index) => {
    if (!point || !signalLine[index]) {
      return null;
    }
    return {
      time: point.time,
      value: toFixedNumber(point.value - signalLine[index].value, 4),
    };
  });

  return {
    macdLine,
    signalLine,
    histogram,
  };
}

export function calculateBollingerBands(candles, period = 20, stdDev = 2) {
  return candles.map((candle, index) => {
    if (index < period - 1) {
      return null;
    }

    const slice = candles.slice(index - period + 1, index + 1);
    const mean = slice.reduce((sum, item) => sum + item.close, 0) / period;
    const variance =
      slice.reduce((sum, item) => sum + (item.close - mean) ** 2, 0) / period;
    const deviation = Math.sqrt(variance);

    return {
      time: candle.time,
      upper: toFixedNumber(mean + deviation * stdDev),
      middle: toFixedNumber(mean),
      lower: toFixedNumber(mean - deviation * stdDev),
    };
  });
}

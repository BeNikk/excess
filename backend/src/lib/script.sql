CREATE TABLE ticks (
    time TIMESTAMPTZ NOT NULL,
    symbol TEXT NOT NULL,
    price DOUBLE PRECISION,
    volume DOUBLE PRECISION
);
-- i have created a hyper table based on the time column in the ticks table.
SELECT create_hypertable('ticks', 'time'); 

-- materialised views for getting candles.
CREATE MATERIALIZED VIEW candles1m
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', time) AS bucket,
    symbol,
    first(price, time) AS open,
    max(price) AS high,
    min(price) AS low,
    last(price, time) AS close,
    SUM(volume) AS volume
FROM ticks
GROUP BY bucket, symbol;

CREATE MATERIALIZED VIEW candles5m
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('5 minutes', time) AS bucket,
    symbol,
    first(price, time) AS open,
    max(price) AS high,
    min(price) AS low,
    last(price, time) AS close,
    SUM(volume) AS volume
FROM ticks
GROUP BY bucket, symbol;
CREATE MATERIALIZED VIEW candles1h
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    symbol,
    first(price, time) AS open,
    max(price) AS high,
    min(price) AS low,
    last(price, time) AS close,
    SUM(volume) AS volume
FROM ticks
GROUP BY bucket, symbol;
--continuos aggregate policies
SELECT add_continuous_aggregate_policy(
    'candles1m'::regclass,
    start_offset => NULL,                 
    end_offset => '1 minute'::interval,  
    schedule_interval => '1 minute'::interval
);
SELECT add_continuous_aggregate_policy(
    'candles5m'::regclass,
    start_offset => NULL,                 
    end_offset => '5 minutes'::interval,  
    schedule_interval => '5 minutes'::interval
);
SELECT add_continuous_aggregate_policy(
    'candles1h'::regclass,
    start_offset => NULL,                 
    end_offset => '1 hour'::interval,  
    schedule_interval => '1 hour'::interval
);


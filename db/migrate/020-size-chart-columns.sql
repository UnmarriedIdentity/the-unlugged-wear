-- 020-size-chart-columns.sql — explicit measurement order for size charts
-- TL-BE-05. jsonb does not keep object key order, so the order of a chart's
-- measurements (Chest, Length, Shoulder, Sleeve) needs its own column.
ALTER TABLE size_charts ADD COLUMN columns text[] NOT NULL DEFAULT '{}';

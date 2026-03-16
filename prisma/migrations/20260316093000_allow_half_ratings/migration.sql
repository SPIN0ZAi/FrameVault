-- Allow half-step ratings by storing values as floating-point numbers
ALTER TABLE "ratings"
    ALTER COLUMN "value" TYPE DOUBLE PRECISION
    USING "value"::DOUBLE PRECISION;

ALTER TABLE "show_ratings"
    ALTER COLUMN "value" TYPE DOUBLE PRECISION
    USING "value"::DOUBLE PRECISION;

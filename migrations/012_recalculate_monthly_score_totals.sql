-- Recalculate monthly score totals using point-based dimensions (max = weight per category).

UPDATE hr_monthly_scores
SET total_score = ROUND(
  (
    CASE
      WHEN kpi_score <= 75 THEN GREATEST(kpi_score, 0)
      ELSE (LEAST(kpi_score, 100) / 100.0) * 75
    END
    + CASE
      WHEN task_score <= 10 THEN GREATEST(task_score, 0)
      ELSE (LEAST(task_score, 100) / 100.0) * 10
    END
    + CASE
      WHEN comms_score <= 10 THEN GREATEST(comms_score, 0)
      ELSE (LEAST(comms_score, 100) / 100.0) * 10
    END
    + CASE
      WHEN hygiene_score <= 2.5 THEN GREATEST(hygiene_score, 0)
      ELSE (LEAST(hygiene_score, 100) / 100.0) * 2.5
    END
    + CASE
      WHEN extracurricular_score <= 2.5 THEN GREATEST(extracurricular_score, 0)
      ELSE (LEAST(extracurricular_score, 100) / 100.0) * 2.5
    END
  )::numeric,
  2
),
rating = CASE
  WHEN (
    CASE WHEN kpi_score <= 75 THEN GREATEST(kpi_score, 0) ELSE (LEAST(kpi_score, 100) / 100.0) * 75 END
    + CASE WHEN task_score <= 10 THEN GREATEST(task_score, 0) ELSE (LEAST(task_score, 100) / 100.0) * 10 END
    + CASE WHEN comms_score <= 10 THEN GREATEST(comms_score, 0) ELSE (LEAST(comms_score, 100) / 100.0) * 10 END
    + CASE WHEN hygiene_score <= 2.5 THEN GREATEST(hygiene_score, 0) ELSE (LEAST(hygiene_score, 100) / 100.0) * 2.5 END
    + CASE WHEN extracurricular_score <= 2.5 THEN GREATEST(extracurricular_score, 0) ELSE (LEAST(extracurricular_score, 100) / 100.0) * 2.5 END
  ) >= 90 THEN 'excellent'
  WHEN (
    CASE WHEN kpi_score <= 75 THEN GREATEST(kpi_score, 0) ELSE (LEAST(kpi_score, 100) / 100.0) * 75 END
    + CASE WHEN task_score <= 10 THEN GREATEST(task_score, 0) ELSE (LEAST(task_score, 100) / 100.0) * 10 END
    + CASE WHEN comms_score <= 10 THEN GREATEST(comms_score, 0) ELSE (LEAST(comms_score, 100) / 100.0) * 10 END
    + CASE WHEN hygiene_score <= 2.5 THEN GREATEST(hygiene_score, 0) ELSE (LEAST(hygiene_score, 100) / 100.0) * 2.5 END
    + CASE WHEN extracurricular_score <= 2.5 THEN GREATEST(extracurricular_score, 0) ELSE (LEAST(extracurricular_score, 100) / 100.0) * 2.5 END
  ) >= 80 THEN 'strong'
  WHEN (
    CASE WHEN kpi_score <= 75 THEN GREATEST(kpi_score, 0) ELSE (LEAST(kpi_score, 100) / 100.0) * 75 END
    + CASE WHEN task_score <= 10 THEN GREATEST(task_score, 0) ELSE (LEAST(task_score, 100) / 100.0) * 10 END
    + CASE WHEN comms_score <= 10 THEN GREATEST(comms_score, 0) ELSE (LEAST(comms_score, 100) / 100.0) * 10 END
    + CASE WHEN hygiene_score <= 2.5 THEN GREATEST(hygiene_score, 0) ELSE (LEAST(hygiene_score, 100) / 100.0) * 2.5 END
    + CASE WHEN extracurricular_score <= 2.5 THEN GREATEST(extracurricular_score, 0) ELSE (LEAST(extracurricular_score, 100) / 100.0) * 2.5 END
  ) >= 70 THEN 'acceptable'
  WHEN (
    CASE WHEN kpi_score <= 75 THEN GREATEST(kpi_score, 0) ELSE (LEAST(kpi_score, 100) / 100.0) * 75 END
    + CASE WHEN task_score <= 10 THEN GREATEST(task_score, 0) ELSE (LEAST(task_score, 100) / 100.0) * 10 END
    + CASE WHEN comms_score <= 10 THEN GREATEST(comms_score, 0) ELSE (LEAST(comms_score, 100) / 100.0) * 10 END
    + CASE WHEN hygiene_score <= 2.5 THEN GREATEST(hygiene_score, 0) ELSE (LEAST(hygiene_score, 100) / 100.0) * 2.5 END
    + CASE WHEN extracurricular_score <= 2.5 THEN GREATEST(extracurricular_score, 0) ELSE (LEAST(extracurricular_score, 100) / 100.0) * 2.5 END
  ) >= 60 THEN 'below_expectation'
  ELSE 'poor'
END;

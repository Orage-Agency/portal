-- Bug fix: every intake POST without an explicit id was inserting a NEW row,
-- so each audio upload duplicated the client_intakes record (OKC had 13 rows,
-- George had 8). Consolidate all duplicate rows into one per invitation_id by
-- COALESCing every column across the rows (so no data is lost — the most
-- recent non-null value per column wins). Then add a UNIQUE constraint so
-- future inserts must upsert.

DO $migrate$
DECLARE
  v_id text;
BEGIN
  FOR v_id IN
    SELECT invitation_id
    FROM client_intakes
    GROUP BY invitation_id
    HAVING COUNT(*) > 1
  LOOP
    -- Consolidate every text column via COALESCE across all matching rows
    -- (ordered most-recent-first so newest values take precedence).
    WITH ranked AS (
      SELECT *,
             ROW_NUMBER() OVER (PARTITION BY invitation_id ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST) AS rn
      FROM client_intakes
      WHERE invitation_id = v_id
    ),
    keeper AS (
      SELECT id FROM ranked WHERE rn = 1 LIMIT 1
    ),
    merged AS (
      SELECT
        MAX(id)                                       AS keep_id,
        (array_agg(business_hours       ORDER BY rn) FILTER (WHERE business_hours       IS NOT NULL))[1] AS business_hours,
        (array_agg(service_area         ORDER BY rn) FILTER (WHERE service_area         IS NOT NULL))[1] AS service_area,
        (array_agg(services_pricing     ORDER BY rn) FILTER (WHERE services_pricing     IS NOT NULL))[1] AS services_pricing,
        (array_agg(tools_used           ORDER BY rn) FILTER (WHERE tools_used           IS NOT NULL))[1] AS tools_used,
        (array_agg(top_questions        ORDER BY rn) FILTER (WHERE top_questions        IS NOT NULL))[1] AS top_questions,
        (array_agg(agent_tone           ORDER BY rn) FILTER (WHERE agent_tone           IS NOT NULL))[1] AS agent_tone,
        (array_agg(disqualifiers        ORDER BY rn) FILTER (WHERE disqualifiers        IS NOT NULL))[1] AS disqualifiers,
        (array_agg(what_makes_different ORDER BY rn) FILTER (WHERE what_makes_different IS NOT NULL))[1] AS what_makes_different,
        (array_agg(ideal_customer       ORDER BY rn) FILTER (WHERE ideal_customer       IS NOT NULL))[1] AS ideal_customer,
        (array_agg(goals_12mo           ORDER BY rn) FILTER (WHERE goals_12mo           IS NOT NULL))[1] AS goals_12mo,
        (array_agg(audio_intro_url      ORDER BY rn) FILTER (WHERE audio_intro_url      IS NOT NULL))[1] AS audio_intro_url,
        (array_agg(audio_different_url  ORDER BY rn) FILTER (WHERE audio_different_url  IS NOT NULL))[1] AS audio_different_url,
        (array_agg(audio_customer_url   ORDER BY rn) FILTER (WHERE audio_customer_url   IS NOT NULL))[1] AS audio_customer_url,
        (array_agg(audio_goals_url      ORDER BY rn) FILTER (WHERE audio_goals_url      IS NOT NULL))[1] AS audio_goals_url,
        (array_agg(audio_operations_url ORDER BY rn) FILTER (WHERE audio_operations_url IS NOT NULL))[1] AS audio_operations_url,
        (array_agg(audio_faq_url        ORDER BY rn) FILTER (WHERE audio_faq_url        IS NOT NULL))[1] AS audio_faq_url,
        (array_agg(audio_tone_url       ORDER BY rn) FILTER (WHERE audio_tone_url       IS NOT NULL))[1] AS audio_tone_url,
        (array_agg(audio_booking_url    ORDER BY rn) FILTER (WHERE audio_booking_url    IS NOT NULL))[1] AS audio_booking_url,
        (array_agg(audio_notes_url      ORDER BY rn) FILTER (WHERE audio_notes_url      IS NOT NULL))[1] AS audio_notes_url,
        (array_agg(upsell_signals       ORDER BY rn) FILTER (WHERE upsell_signals       IS NOT NULL))[1] AS upsell_signals,
        (array_agg(transcript_intro     ORDER BY rn) FILTER (WHERE transcript_intro     IS NOT NULL))[1] AS transcript_intro,
        (array_agg(transcript_different ORDER BY rn) FILTER (WHERE transcript_different IS NOT NULL))[1] AS transcript_different,
        (array_agg(transcript_operations ORDER BY rn) FILTER (WHERE transcript_operations IS NOT NULL))[1] AS transcript_operations,
        (array_agg(transcript_faq       ORDER BY rn) FILTER (WHERE transcript_faq       IS NOT NULL))[1] AS transcript_faq,
        (array_agg(transcript_tone      ORDER BY rn) FILTER (WHERE transcript_tone      IS NOT NULL))[1] AS transcript_tone,
        (array_agg(transcript_goals     ORDER BY rn) FILTER (WHERE transcript_goals     IS NOT NULL))[1] AS transcript_goals,
        (array_agg(transcript_customer  ORDER BY rn) FILTER (WHERE transcript_customer  IS NOT NULL))[1] AS transcript_customer,
        (array_agg(transcript_booking   ORDER BY rn) FILTER (WHERE transcript_booking   IS NOT NULL))[1] AS transcript_booking,
        (array_agg(transcript_notes     ORDER BY rn) FILTER (WHERE transcript_notes     IS NOT NULL))[1] AS transcript_notes,
        MAX(status) AS status,
        MIN(created_at) AS created_at,
        MAX(updated_at) AS updated_at
      FROM ranked
    )
    UPDATE client_intakes ci SET
      business_hours        = m.business_hours,
      service_area          = m.service_area,
      services_pricing      = m.services_pricing,
      tools_used            = m.tools_used,
      top_questions         = m.top_questions,
      agent_tone            = m.agent_tone,
      disqualifiers         = m.disqualifiers,
      what_makes_different  = m.what_makes_different,
      ideal_customer        = m.ideal_customer,
      goals_12mo            = m.goals_12mo,
      audio_intro_url       = m.audio_intro_url,
      audio_different_url   = m.audio_different_url,
      audio_customer_url    = m.audio_customer_url,
      audio_goals_url       = m.audio_goals_url,
      audio_operations_url  = m.audio_operations_url,
      audio_faq_url         = m.audio_faq_url,
      audio_tone_url        = m.audio_tone_url,
      audio_booking_url     = m.audio_booking_url,
      audio_notes_url       = m.audio_notes_url,
      upsell_signals        = m.upsell_signals,
      transcript_intro      = m.transcript_intro,
      transcript_different  = m.transcript_different,
      transcript_operations = m.transcript_operations,
      transcript_faq        = m.transcript_faq,
      transcript_tone       = m.transcript_tone,
      transcript_goals      = m.transcript_goals,
      transcript_customer   = m.transcript_customer,
      transcript_booking    = m.transcript_booking,
      transcript_notes      = m.transcript_notes,
      status                = m.status,
      created_at            = COALESCE(m.created_at, ci.created_at),
      updated_at            = COALESCE(m.updated_at, ci.updated_at)
    FROM merged m
    WHERE ci.id = (SELECT id FROM keeper);

    DELETE FROM client_intakes
    WHERE invitation_id = v_id
      AND id <> (SELECT id FROM (
        SELECT id FROM client_intakes WHERE invitation_id = v_id
        ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
        LIMIT 1
      ) k);
  END LOOP;
END;
$migrate$;

-- Enforce one intake per invitation going forward.
ALTER TABLE client_intakes
  DROP CONSTRAINT IF EXISTS client_intakes_invitation_id_unique;
ALTER TABLE client_intakes
  ADD CONSTRAINT client_intakes_invitation_id_unique UNIQUE (invitation_id);

import { query } from "../db/index.js";

const parseJsonValue = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const parseTextArray = (value) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const parsed = parseJsonValue(value, null);

    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }

    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const parseBigIntArray = (value) => {
  const items = parseTextArray(value);
  return items
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);
};

const parseOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseOptionalInteger = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : null;
};

const getProfessionalProfile = async (userId) => {
  const result = await query(
    `SELECT id, user_id
     FROM professional_profiles
     WHERE user_id = $1`,
    [userId],
  );

  return result.rows[0] || null;
};

const getBusinessSetupByUserId = async (userId) => {
  const result = await query(
    `SELECT bs.*
     FROM business_setups bs
     INNER JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
     WHERE pp.user_id = $1`,
    [userId],
  );

  return result.rows[0] || null;
};

export const listCategories = async (_req, res) => {
  try {
    const result = await query(
      `SELECT
         c.id,
         c.title,
         c.created_at,
         COALESCE(
           json_agg(
             json_build_object(
               'id', s.id,
               'title', s.title,
               'category_id', s.category_id,
               'created_at', s.created_at
             )
             ORDER BY s.title
           ) FILTER (WHERE s.id IS NOT NULL),
           '[]'::json
         ) AS subcategories
       FROM categories c
       LEFT JOIN subcategories s ON s.category_id = c.id
       GROUP BY c.id
       ORDER BY c.title`,
    );

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully.",
      data: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories.",
      data: {
        error: error.message,
      },
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const result = await query(
      `INSERT INTO categories (title)
       VALUES ($1)
       RETURNING *`,
      [req.body.title.trim()],
    );

    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    const statusCode = error.code === "23505" ? 409 : 500;
    const message =
      error.code === "23505" ? "Category title already exists." : "Failed to create category.";

    return res.status(statusCode).json({
      success: false,
      message,
      data: {
        error: error.message,
      },
    });
  }
};

export const createSubcategory = async (req, res) => {
  try {
    const result = await query(
      `INSERT INTO subcategories (category_id, title)
       VALUES ($1, $2)
       RETURNING *`,
      [req.body.category_id, req.body.title.trim()],
    );

    return res.status(201).json({
      success: true,
      message: "Subcategory created successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    const statusCode = error.code === "23505" ? 409 : 500;
    const message =
      error.code === "23505"
        ? "Subcategory title already exists for this category."
        : "Failed to create subcategory.";

    return res.status(statusCode).json({
      success: false,
      message,
      data: {
        error: error.message,
      },
    });
  }
};

export const getBusinessSetup = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({
        success: false,
        message: "Only professional users can access business setup.",
        data: null,
      });
    }

    const businessSetup = await getBusinessSetupByUserId(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Business setup fetched successfully.",
      data: businessSetup,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch business setup.",
      data: {
        error: error.message,
      },
    });
  }
};

export const upsertBusinessSetup = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({
        success: false,
        message: "Only professional users can manage business setup.",
        data: null,
      });
    }

    const professionalProfile = await getProfessionalProfile(req.user.id);

    if (!professionalProfile) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
        data: null,
      });
    }

    const payload = {
      location_mode: req.body.location_mode,
      business_name: req.body.business_name ?? null,
      business_about: req.body.business_about ?? null,
      business_keywords: parseTextArray(req.body.business_keywords),
      business_media: parseTextArray(req.body.business_media),
      fixed_location_address: req.body.fixed_location_address ?? null,
      fixed_location_street_number: req.body.fixed_location_street_number ?? null,
      fixed_location_postal_code: req.body.fixed_location_postal_code ?? null,
      fixed_location_province: req.body.fixed_location_province ?? null,
      fixed_location_municipality: req.body.fixed_location_municipality ?? null,
      service_categories: parseTextArray(req.body.service_categories),
      project: req.body.project ?? null,
      book_service_notes: req.body.book_service_notes ?? null,
      team_member_ids: parseBigIntArray(req.body.team_member_ids),
      additional_notes: req.body.additional_notes ?? null,
      price_range: req.body.price_range ?? null,
      prepayment_percentage: parseOptionalNumber(req.body.prepayment_percentage),
      prepayment_instruction: req.body.prepayment_instruction ?? null,
      kilometer_allowance: parseOptionalNumber(req.body.kilometer_allowance),
      kilometer_allowance_instruction: req.body.kilometer_allowance_instruction ?? null,
      response_time_hours: parseOptionalInteger(req.body.response_time_hours),
      response_time_minutes: parseOptionalInteger(req.body.response_time_minutes),
      policy_custom_instruction: req.body.policy_custom_instruction ?? null,
      appointment_before_hours: parseOptionalInteger(req.body.appointment_before_hours),
      appointment_before_minutes: parseOptionalInteger(req.body.appointment_before_minutes),
      late_reschedule_fee_percentage: parseOptionalNumber(req.body.late_reschedule_fee_percentage),
      late_reschedule_policy_instruction: req.body.late_reschedule_policy_instruction ?? null,
      cancellation_before_hours: parseOptionalInteger(req.body.cancellation_before_hours),
      cancellation_before_minutes: parseOptionalInteger(req.body.cancellation_before_minutes),
      late_cancellation_fee_percentage: parseOptionalNumber(req.body.late_cancellation_fee_percentage),
      cancellation_policy_instruction: req.body.cancellation_policy_instruction ?? null,
      no_show_fee_percentage: parseOptionalNumber(req.body.no_show_fee_percentage),
      desired_location_area: req.body.desired_location_area ?? null,
      desired_location_province: req.body.desired_location_province ?? null,
      desired_location_services: parseTextArray(req.body.desired_location_services),
    };

    const fields = Object.keys(payload);
    const values = [professionalProfile.id, ...fields.map((field) => payload[field])];
    const updateAssignments = fields
      .map((field, index) => `${field} = $${index + 2}`)
      .concat("updated_at = NOW()")
      .join(", ");

    const result = await query(
      `INSERT INTO business_setups (
         professional_profile_id,
         ${fields.join(", ")}
       )
       VALUES (
         $1,
         ${fields.map((_, index) => `$${index + 2}`).join(", ")}
       )
       ON CONFLICT (professional_profile_id)
       DO UPDATE SET
         ${updateAssignments}
       RETURNING *`,
      values,
    );

    return res.status(200).json({
      success: true,
      message: "Business setup saved successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save business setup.",
      data: {
        error: error.message,
      },
    });
  }
};

export const createBusinessServiceDetail = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({
        success: false,
        message: "Only professional users can manage business services.",
        data: null,
      });
    }

    const businessSetup = await getBusinessSetupByUserId(req.user.id);

    if (!businessSetup) {
      return res.status(404).json({
        success: false,
        message: "Business setup not found.",
        data: null,
      });
    }

    const result = await query(
      `INSERT INTO business_service_details (business_setup_id, service_id, price)
       VALUES ($1, $2, $3)
       ON CONFLICT (business_setup_id, service_id)
       DO UPDATE SET price = EXCLUDED.price
       RETURNING *`,
      [businessSetup.id, req.body.service_id, req.body.price],
    );

    return res.status(200).json({
      success: true,
      message: "Business service detail saved successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save business service detail.",
      data: {
        error: error.message,
      },
    });
  }
};

export const listBusinessServiceDetails = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({
        success: false,
        message: "Only professional users can access business service details.",
        data: null,
      });
    }

    const businessSetup = await getBusinessSetupByUserId(req.user.id);

    if (!businessSetup) {
      return res.status(200).json({
        success: true,
        message: "Business service details fetched successfully.",
        data: [],
      });
    }

    const result = await query(
      `SELECT bsd.*, s.title AS service_title
       FROM business_service_details bsd
       INNER JOIN subcategories s ON s.id = bsd.service_id
       WHERE bsd.business_setup_id = $1
       ORDER BY s.title`,
      [businessSetup.id],
    );

    return res.status(200).json({
      success: true,
      message: "Business service details fetched successfully.",
      data: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch business service details.",
      data: {
        error: error.message,
      },
    });
  }
};

export const listCalendarEntries = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({
        success: false,
        message: "Only professional users can access calendar entries.",
        data: null,
      });
    }

    const professionalProfile = await getProfessionalProfile(req.user.id);

    if (!professionalProfile) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
        data: null,
      });
    }

    const result = await query(
      `SELECT *
       FROM calendar_entries
       WHERE professional_profile_id = $1
       ORDER BY created_at DESC`,
      [professionalProfile.id],
    );

    return res.status(200).json({
      success: true,
      message: "Calendar entries fetched successfully.",
      data: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch calendar entries.",
      data: {
        error: error.message,
      },
    });
  }
};

export const createCalendarEntry = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({
        success: false,
        message: "Only professional users can create calendar entries.",
        data: null,
      });
    }

    const professionalProfile = await getProfessionalProfile(req.user.id);

    if (!professionalProfile) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found.",
        data: null,
      });
    }

    const result = await query(
      `INSERT INTO calendar_entries (
         professional_profile_id,
         status,
         title,
         unique_code,
         start_time,
         end_time,
         start_date,
         end_date,
         blocked_time_start,
         blocked_time_end,
         location_type,
         service_ids
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        professionalProfile.id,
        req.body.status,
        req.body.title,
        req.body.unique_code,
        req.body.start_time ?? null,
        req.body.end_time ?? null,
        req.body.start_date ?? null,
        req.body.end_date ?? null,
        req.body.blocked_time_start ?? null,
        req.body.blocked_time_end ?? null,
        req.body.location_type ?? null,
        parseBigIntArray(req.body.service_ids),
      ],
    );

    return res.status(201).json({
      success: true,
      message: "Calendar entry created successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create calendar entry.",
      data: {
        error: error.message,
      },
    });
  }
};

export const listBookings = async (req, res) => {
  try {
    let result;

    if (req.user.user_type === "professional") {
      const businessSetup = await getBusinessSetupByUserId(req.user.id);

      if (!businessSetup) {
        return res.status(200).json({
          success: true,
          message: "Bookings fetched successfully.",
          data: [],
        });
      }

      result = await query(
        `SELECT *
         FROM bookings
         WHERE business_setup_id = $1
         ORDER BY created_at DESC`,
        [businessSetup.id],
      );
    } else {
      result = await query(
        `SELECT *
         FROM bookings
         WHERE customer_id = $1
         ORDER BY created_at DESC`,
        [req.user.id],
      );
    }

    return res.status(200).json({
      success: true,
      message: "Bookings fetched successfully.",
      data: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings.",
      data: {
        error: error.message,
      },
    });
  }
};

export const createBooking = async (req, res) => {
  try {
    const locationDetails = parseJsonValue(req.body.location_details, {});

    const result = await query(
      `INSERT INTO bookings (
         booking_date,
         business_setup_id,
         customer_id,
         service_id,
         team_member_id,
         start_time,
         end_time,
         location_type,
         location_details,
         notes,
         prepayment_status,
         status,
         total_price,
         images,
         contact_number,
         documents,
         province,
         municipality,
         street_address,
         street_number,
         postal_code
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
       )
       RETURNING *`,
      [
        req.body.booking_date,
        req.body.business_setup_id,
        req.user.id,
        req.body.service_id ?? null,
        req.body.team_member_id ?? null,
        req.body.start_time ?? null,
        req.body.end_time ?? null,
        req.body.location_type ?? null,
        JSON.stringify(locationDetails),
        req.body.notes ?? null,
        req.body.prepayment_status ?? null,
        req.body.status ?? "requested",
        parseOptionalNumber(req.body.total_price),
        parseTextArray(req.body.images),
        req.body.contact_number ?? null,
        parseTextArray(req.body.documents),
        req.body.province ?? null,
        req.body.municipality ?? null,
        req.body.street_address ?? null,
        req.body.street_number ?? null,
        req.body.postal_code ?? null,
      ],
    );

    return res.status(201).json({
      success: true,
      message: "Booking created successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create booking.",
      data: {
        error: error.message,
      },
    });
  }
};

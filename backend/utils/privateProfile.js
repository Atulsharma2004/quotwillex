/** Fields only the account owner may see or edit. */
export const PRIVATE_PROFILE_FIELDS = [
  "email",
  "mobileNumber",
  "dateOfBirth",
  "city",
  "state",
  "country",
  "instagram",
  "password",
  "googleId",
];

const PHONE_RE = /^[+\d][\d\s()-]{6,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const stripPrivateProfileFields = (userObj = {}) => {
  const copy = { ...userObj };
  for (const key of PRIVATE_PROFILE_FIELDS) {
    delete copy[key];
  }
  delete copy.abuseStrikeCount;
  delete copy.abuseAlertSentAt;
  delete copy.tokenVersion;
  delete copy.emailVerifyTokenHash;
  delete copy.emailVerifyExpires;
  delete copy.passwordResetTokenHash;
  delete copy.passwordResetExpires;
  return copy;
};

export const normalizeInstagram = (value = "") =>
  String(value || "")
    .trim()
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/\/+$/, "")
    .slice(0, 60);

export const normalizePhone = (value = "") => String(value || "").trim();

export const validatePrivateProfileInput = (input = {}, { requireAll = false } = {}) => {
  const errors = [];
  const cleaned = {};

  if (input.mobileNumber !== undefined || requireAll) {
    const mobileNumber = normalizePhone(input.mobileNumber);
    if (requireAll && !mobileNumber) {
      errors.push("Mobile number is required");
    } else if (mobileNumber && !PHONE_RE.test(mobileNumber)) {
      errors.push("Please enter a valid mobile number");
    } else {
      cleaned.mobileNumber = mobileNumber;
    }
  }

  if (input.dateOfBirth !== undefined || requireAll) {
    const raw = input.dateOfBirth;
    if (requireAll && !raw) {
      errors.push("Date of birth is required");
    } else if (raw) {
      const dob = new Date(raw);
      if (Number.isNaN(dob.getTime())) {
        errors.push("Please enter a valid date of birth");
      } else {
        const now = new Date();
        const minAge = new Date(
          now.getFullYear() - 13,
          now.getMonth(),
          now.getDate()
        );
        if (dob > now) {
          errors.push("Date of birth cannot be in the future");
        } else if (dob > minAge) {
          errors.push("You must be at least 13 years old");
        } else {
          cleaned.dateOfBirth = dob;
        }
      }
    } else {
      cleaned.dateOfBirth = null;
    }
  }

  for (const key of ["city", "state", "country"]) {
    if (input[key] !== undefined || requireAll) {
      const value = String(input[key] || "").trim();
      if (requireAll && !value) {
        errors.push(`${key.charAt(0).toUpperCase() + key.slice(1)} is required`);
      } else if (value.length > 80) {
        errors.push(`${key} is too long`);
      } else {
        cleaned[key] = value;
      }
    }
  }

  if (input.instagram !== undefined) {
    cleaned.instagram = normalizeInstagram(input.instagram);
  }

  if (input.email !== undefined) {
    const email = String(input.email || "")
      .trim()
      .toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      errors.push("Please enter a valid email");
    } else {
      cleaned.email = email;
    }
  }

  return { errors, cleaned };
};

export const publicSelectExclude =
  "-password -email -mobileNumber -dateOfBirth -city -state -country -instagram -googleId -abuseStrikeCount -abuseAlertSentAt -emailVerifyTokenHash -emailVerifyExpires -passwordResetTokenHash -passwordResetExpires";

/** True when mobile / DOB / location still need filling. */
export const isPrivateProfileIncomplete = (user = {}) => {
  const mobile = String(user.mobileNumber || "").trim();
  const city = String(user.city || "").trim();
  const state = String(user.state || "").trim();
  const country = String(user.country || "").trim();
  const hasDob = Boolean(user.dateOfBirth);
  return !mobile || !hasDob || !city || !state || !country;
};

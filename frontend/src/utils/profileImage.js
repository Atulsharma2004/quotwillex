/** Shared profile image rules for Signup + Edit profile. */

export const PROFILE_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

/** Max original upload size (500 KB). */
export const MAX_SOURCE_IMAGE_BYTES = 500 * 1024;

/** Max data-URL length after encode/compress (~matches backend). */
export const MAX_PROFILE_DATA_URL_CHARS = 700_000;

export const PROFILE_IMAGE_HINT =
  "JPEG, PNG, WebP, or GIF only · max 500 KB · square photos look best";

export const PROFILE_IMAGE_UNSUPPORTED =
  "Image is not supported. Use JPEG, PNG, WebP, or GIF under 500 KB.";

export const isAllowedProfileImageType = (type = "") =>
  PROFILE_IMAGE_TYPES.includes(String(type).toLowerCase());

/**
 * Validate a File from an <input type="file"> (type + size).
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export const validateProfileImageFile = (file) => {
  if (!file) {
    return { ok: false, error: "No image selected." };
  }
  if (!isAllowedProfileImageType(file.type)) {
    return {
      ok: false,
      error: PROFILE_IMAGE_UNSUPPORTED,
    };
  }
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    return {
      ok: false,
      error:
        "Image is too large (max 500 KB). Please choose a smaller photo.",
    };
  }
  return { ok: true };
};

const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });

/**
 * Downscale a data URL to a JPEG avatar. Works for wide landscape / tall images.
 */
const compressDataUrl = (dataUrl, { maxEdge = 512, quality = 0.82 } = {}) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const longest = Math.max(img.width || 1, img.height || 1);
        const scale = Math.min(1, maxEdge / longest);
        const w = Math.max(1, Math.round((img.width || 1) * scale));
        const h = Math.max(1, Math.round((img.height || 1) * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not process image."));
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Could not process image."));
      }
    };
    img.onerror = () =>
      reject(
        new Error(
          "Could not load this image for preview. Try another JPEG or PNG."
        )
      );
    img.src = dataUrl;
  });

/**
 * Read + validate (+ resize if needed) a profile image under 500 KB.
 * @returns {Promise<{ ok: true, dataUrl: string } | { ok: false, error: string }>}
 */
export const prepareProfileImageFile = async (file) => {
  const check = validateProfileImageFile(file);
  if (!check.ok) return check;

  try {
    let dataUrl = await readFileAsDataURL(file);
    if (typeof dataUrl !== "string") {
      return { ok: false, error: "Could not read image file." };
    }

    // Resize large-dimension images so the data URL stays within API limits.
    if (
      dataUrl.length > MAX_PROFILE_DATA_URL_CHARS ||
      file.size > 350 * 1024
    ) {
      dataUrl = await compressDataUrl(dataUrl, {
        maxEdge: 512,
        quality: 0.85,
      });
    }

    if (dataUrl.length > MAX_PROFILE_DATA_URL_CHARS) {
      dataUrl = await compressDataUrl(dataUrl, {
        maxEdge: 360,
        quality: 0.7,
      });
    }

    if (dataUrl.length > MAX_PROFILE_DATA_URL_CHARS) {
      return {
        ok: false,
        error:
          "Image is too large even after compression. Please use a photo under 500 KB.",
      };
    }

    return { ok: true, dataUrl };
  } catch (err) {
    return {
      ok: false,
      error: err.message || PROFILE_IMAGE_UNSUPPORTED,
    };
  }
};

/** Map API/network errors to a friendly profile-picture message. */
export const profileImageSaveError = (err) => {
  const status =
    err?.response?.status || err?.status || err?.payload?.status;
  const raw =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.payload?.message ||
    (typeof err === "string" ? err : err?.message) ||
    "";

  if (
    status === 413 ||
    /payload too large|entity too large|request entity/i.test(String(raw))
  ) {
    return "Image is too large. Please use JPEG, PNG, WebP, or GIF under 500 KB.";
  }
  if (/profile picture|image|avatar|not supported|too large/i.test(String(raw))) {
    return raw;
  }
  if (raw && raw !== "Internal server error" && raw !== "Request failed") {
    return raw;
  }
  return "Could not update profile. If you changed your photo, try a smaller image (max 500 KB).";
};

/**
 * Fraud Detection Service – EcoReward
 * Implements image hashing and timestamp/GPS validation.
 */

const crypto = require('crypto');
const fs     = require('fs');

/**
 * hashImage
 * Generates a SHA-256 hash of the image buffer or file path.
 * Used for duplicate-image detection.
 */
exports.hashImage = (input) => {
  try {
    const data = Buffer.isBuffer(input) ? input : fs.readFileSync(input);
    return crypto.createHash('sha256').update(data).digest('hex');
  } catch {
    return crypto.randomBytes(16).toString('hex'); // fallback unique hash
  }
};

/**
 * compareGPSDistance
 * Returns distance in metres between two lat/lng pairs (Haversine).
 */
exports.compareGPSDistance = (lat1, lon1, lat2, lon2) => {
  const R  = 6_371_000; // Earth radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a  = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * validateGPSProximity
 * True if EXIF GPS is within `maxMetres` of user-submitted GPS.
 */
exports.validateGPSProximity = (exifLat, exifLon, submitLat, submitLon, maxMetres = 200) => {
  if (exifLat == null || exifLon == null) return null; // EXIF GPS absent – can't verify
  const dist = exports.compareGPSDistance(exifLat, exifLon, submitLat, submitLon);
  return dist <= maxMetres;
};

/* ─────────────────────────────────────────────────────────────────── */

/**
 * EXIF Service – EcoReward
 * Extracts metadata from uploaded images (date, GPS, device).
 */

let exifr;
try { exifr = require('exifr'); } catch { exifr = null; }

/**
 * extract
 * @param {string} filePath
 * @returns {Promise<object|null>}
 */
exports.extract = async (filePath) => {
  if (!exifr) return null;
  try {
    return await exifr.parse(filePath, {
      pick: ['DateTimeOriginal', 'GPSLatitude', 'GPSLongitude', 'Make', 'Model'],
    });
  } catch {
    return null;
  }
};

/**
 * validateTimestamp
 * Rejects EXIF timestamps more than 24 hours old.
 */
exports.validateTimestamp = (exifDate) => {
  if (!exifDate) return true; // no EXIF → pass (manual review)
  const diff = Date.now() - new Date(exifDate).getTime();
  return diff <= 24 * 60 * 60 * 1000; // within 24 hours
};

/**
 * compareGPS – alias for convenience in report controller.
 */
exports.compareGPS = (exifData, submitLat, submitLon) => {
  if (!exifData?.GPSLatitude || !exifData?.GPSLongitude) return true; // can't compare
  return exports.validateGPSProximity(exifData.GPSLatitude, exifData.GPSLongitude, submitLat, submitLon);
};

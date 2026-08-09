import {
  COUNTRY_NAMES,
  getStatesForCountry,
  normalizeCountryName,
} from "../constants/locations";

/**
 * Cascading location fields: country (select) → state (select) → city (text).
 */
const LocationFields = ({
  country = "",
  state = "",
  city = "",
  onChange,
  className = "",
  selectClassName = "",
  inputClassName = "",
  labelClassName = "mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300",
  layout = "stack",
  required = false,
  showLabels = true,
  idPrefix = "location",
}) => {
  const trimmedCountry = String(country || "").trim();
  const normalizedCountry = normalizeCountryName(trimmedCountry);
  const knownCountry = COUNTRY_NAMES.some(
    (name) => name.toLowerCase() === trimmedCountry.toLowerCase()
  );
  const countryValue = knownCountry
    ? normalizedCountry
    : trimmedCountry || "";
  const states = getStatesForCountry(countryValue);
  const hasStateList = states.length > 0;
  const stateInList = hasStateList && states.includes(state);
  const legacyState =
    state && hasStateList && !stateInList ? String(state).trim() : "";
  const stateValue = stateInList ? state : legacyState || "";

  const emit = (next) => {
    onChange?.({
      country: countryValue,
      state: state || "",
      city: city || "",
      ...next,
    });
  };

  const handleCountryChange = (e) => {
    emit({
      country: e.target.value,
      state: "",
    });
  };

  const handleStateChange = (e) => {
    emit({ state: e.target.value });
  };

  const handleCityChange = (e) => {
    emit({ city: e.target.value });
  };

  const fieldWrap =
    layout === "grid"
      ? "grid gap-3 sm:grid-cols-3"
      : "flex flex-col gap-2";

  return (
    <div className={`${fieldWrap} ${className}`.trim()}>
      <div>
        {showLabels && (
          <label
            htmlFor={`${idPrefix}-country`}
            className={labelClassName}
          >
            Country
          </label>
        )}
        <select
          id={`${idPrefix}-country`}
          value={countryValue}
          onChange={handleCountryChange}
          className={selectClassName}
          required={required}
          aria-label="Country"
        >
          <option value="">Select country</option>
          {!knownCountry && trimmedCountry && (
            <option value={trimmedCountry}>{trimmedCountry} (saved)</option>
          )}
          {COUNTRY_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div>
        {showLabels && (
          <label htmlFor={`${idPrefix}-state`} className={labelClassName}>
            State / Province
          </label>
        )}
        {hasStateList ? (
          <select
            id={`${idPrefix}-state`}
            value={stateValue}
            onChange={handleStateChange}
            className={selectClassName}
            disabled={!countryValue}
            required={required && Boolean(countryValue)}
            aria-label="State or province"
          >
            <option value="">
              {countryValue
                ? "Select state / province"
                : "Select country first"}
            </option>
            {legacyState && (
              <option value={legacyState}>{legacyState} (saved)</option>
            )}
            {states.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={`${idPrefix}-state`}
            type="text"
            value={state}
            onChange={handleStateChange}
            className={inputClassName}
            placeholder={
              countryValue
                ? "State / province (optional)"
                : "Select country first"
            }
            disabled={!countryValue}
            aria-label="State or province"
          />
        )}
      </div>

      <div>
        {showLabels && (
          <label htmlFor={`${idPrefix}-city`} className={labelClassName}>
            City
          </label>
        )}
        <input
          id={`${idPrefix}-city`}
          type="text"
          value={city}
          onChange={handleCityChange}
          className={inputClassName}
          placeholder="Enter your city"
          maxLength={80}
          disabled={!countryValue}
          aria-label="City"
        />
      </div>
    </div>
  );
};

export default LocationFields;

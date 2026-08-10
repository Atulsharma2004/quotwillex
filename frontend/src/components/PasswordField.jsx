import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

/**
 * Password input with show/hide toggle.
 */
const PasswordField = ({
  name = "password",
  value,
  onChange,
  placeholder = "Password",
  required = false,
  minLength,
  autoComplete = "current-password",
  className = "",
  wrapperClassName = "relative mx-auto mb-4 w-3/4",
  id,
}) => {
  const [visible, setVisible] = useState(false);
  const inputId = id || name;

  return (
    <div className={wrapperClassName}>
      <input
        id={inputId}
        type={visible ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        className={`w-full pr-10 ${className}`.trim()}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-indigo-300"
      >
        {visible ? (
          <FaEyeSlash className="text-sm" />
        ) : (
          <FaEye className="text-sm" />
        )}
      </button>
    </div>
  );
};

export default PasswordField;

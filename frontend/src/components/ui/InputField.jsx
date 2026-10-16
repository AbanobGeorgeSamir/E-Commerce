export default function InputField({
  label,
  id,
  type,
  error,
  className = "",
  ...props
}) {
  const labelId = label?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const inputId = id || props.id || props.name || (labelId ? `input-${labelId}` : undefined);
  const errorId = inputId ? `${inputId}-error` : undefined;

  return (
    <div className="space-y-2">
      {label &&
        <label
          htmlFor={inputId}
          className="block text-sm font-bold text-slate-700">

          {label}
        </label>
      }

      <input
        id={inputId}
        type={type}
        {...props}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full px-5 py-3.5 rounded-2xl border
                ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/5"}
                outline-none font-medium transition-all ${className}`} />

      {error &&
        <p id={errorId} className="text-sm text-red-500 font-medium">
          {error}
        </p>
      }
    </div>);

}

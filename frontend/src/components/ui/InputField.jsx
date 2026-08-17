export default function InputField({
  label,
  id,
  type,
  error,
  className = "",
  ...props
}) {
  return (
    <div className="space-y-2">
      {label &&
        <label
          htmlFor={id}
          className="block text-sm font-bold text-slate-700">

          {label}
        </label>
      }

      <input
        id={id}
        type={type}
        {...props}
        className={`w-full px-5 py-3.5 rounded-2xl border
                ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/5"}
                outline-none font-medium transition-all ${className}`} />

      {error &&
        <p className="text-sm text-red-500 font-medium">
          {error}
        </p>
      }
    </div>);

}
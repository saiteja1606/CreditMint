export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-slate-100 to-white shadow-inner dark:from-slate-700/60 dark:to-slate-800">
        {Icon && <Icon className="h-8 w-8 text-slate-400 dark:text-slate-500" />}
      </div>
      <h3 className="mb-1 text-base font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      {description && <p className="mb-4 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>}
      {action}
    </div>
  )
}

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className={`relative w-full ${sizeMap[size]} bg-white dark:bg-slate-800 rounded-t-[28px] sm:rounded-[28px] shadow-2xl max-h-[92vh] flex flex-col z-10 pb-[max(env(safe-area-inset-bottom),0px)]`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 sticky top-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-t-[28px]">
              <div className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-slate-200 dark:bg-slate-700 sm:hidden" />
              <h2 className="pr-6 text-base sm:text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
              <button
                onClick={onClose}
                className="min-h-11 min-w-11 p-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            {/* Body */}
            <div className="overflow-y-auto flex-1 px-4 py-4 sm:px-6 sm:py-5">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useBorrowers } from '../hooks/useBorrowers'
import BorrowerCard from '../components/BorrowerCard'
import BorrowerModal from '../components/BorrowerModal'
import EmptyState from '../components/EmptyState'
import { Plus, Search, Users, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

export default function BorrowersPage() {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editBorrower, setEditBorrower] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [activeMenu, setActiveMenu] = useState(null)
  const menuRef = useRef(null)

  const { borrowers, loading, createBorrower, updateBorrower, deleteBorrower } = useBorrowers(search)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSave = async (data, id) => {
    if (id) {
      await updateBorrower(id, data)
    } else {
      await createBorrower(data)
    }
  }

  const handleDelete = async (id) => {
    if (confirmDelete === id) {
      await deleteBorrower(id)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(id)
      setTimeout(() => setConfirmDelete(null), 3000)
      toast('Click delete again to confirm', { icon: '!' })
    }
  }

  const openEdit = (borrower) => { setEditBorrower(borrower); setModalOpen(true) }
  const openNew = () => { setEditBorrower(null); setModalOpen(true) }

  return (
    <div className="mobile-page mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Borrowers</h1>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{borrowers.length} active contacts</p>
        </div>
        <button onClick={openNew} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl gradient-brand px-6 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] sm:w-auto">
          <Plus size={18} />
          Add Borrower
        </button>
      </div>

      <div className="card border-none bg-white/70 p-3 backdrop-blur-xl dark:bg-slate-800/70 shadow-lg ring-1 ring-slate-200/50 dark:ring-slate-700/50">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone..."
            className="input-base pl-12 h-12 bg-transparent border-transparent focus:ring-0"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl skeleton" />)}
        </div>
      ) : borrowers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No borrowers found' : 'No borrowers yet'}
          description={search ? 'Try a different search term.' : 'Add your first borrower to get started.'}
          action={!search && (
            <button onClick={openNew} className="rounded-2xl gradient-brand px-4 py-2.5 text-sm font-medium text-white">
              Add Borrower
            </button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {borrowers.map((borrower, index) => {
            const isMenuOpen = activeMenu === borrower.id
            return (
              <div key={borrower.id} className="group relative">
                <BorrowerCard borrower={borrower} index={index} />
                
                <div className="absolute right-2 top-2 z-10">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveMenu(isMenuOpen ? null : borrower.id);
                    }}
                    className={`p-2.5 rounded-2xl transition-all ${isMenuOpen ? 'bg-white dark:bg-slate-700 shadow-md text-brand-600' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <MoreVertical size={20} />
                  </button>

                  <AnimatePresence>
                    {isMenuOpen && (
                      <motion.div
                        ref={menuRef}
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className={`absolute right-0 z-50 w-44 rounded-2xl bg-white p-1.5 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 top-10`}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(borrower); setActiveMenu(null) }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <Pencil size={16} className="text-slate-400" />
                          Edit Details
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(borrower.id); if (confirmDelete === borrower.id) setActiveMenu(null) }}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                            confirmDelete === borrower.id 
                              ? 'bg-red-50 text-red-600 dark:bg-red-900/20' 
                              : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-800'
                          }`}
                        >
                          <Trash2 size={16} />
                          {confirmDelete === borrower.id ? 'Confirm Delete' : 'Delete Borrower'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <BorrowerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        borrower={editBorrower}
        onSave={handleSave}
      />
    </div>
  )
}

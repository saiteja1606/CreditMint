import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

export const useBorrowers = (search = '') => {
  const [borrowers, setBorrowers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchBorrowers = useCallback(async (signal) => {
    setLoading(true)
    try {
      const params = search ? { search } : {}
      const res = await api.get('/borrowers', { params, signal })
      setBorrowers(res.data.data.borrowers)
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        toast.error('Failed to load borrowers')
      }
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const controller = new AbortController()
    fetchBorrowers(controller.signal)
    return () => controller.abort()
  }, [fetchBorrowers])

  const createBorrower = async (data) => {
    const res = await api.post('/borrowers', data)
    await fetchBorrowers()
    toast.success('Borrower added!')
    return res.data.data.borrower
  }

  const updateBorrower = async (id, data) => {
    const res = await api.put(`/borrowers/${id}`, data)
    await fetchBorrowers()
    toast.success('Borrower updated!')
    return res.data.data.borrower
  }

  const deleteBorrower = async (id) => {
    await api.delete(`/borrowers/${id}`)
    await fetchBorrowers()
    toast.success('Borrower deleted')
  }

  return { borrowers, loading, refetch: fetchBorrowers, createBorrower, updateBorrower, deleteBorrower }
}

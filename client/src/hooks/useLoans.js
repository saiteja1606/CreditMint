import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

export const useLoans = (params = {}) => {
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLoans = useCallback(async (signal) => {
    setLoading(true)
    try {
      setError(null)
      const res = await api.get('/loans', { params, signal })
      setLoans(res.data.data.loans)
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        setError(err.response?.data?.message || 'Failed to load loans')
      }
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [JSON.stringify(params)])

  useEffect(() => {
    const controller = new AbortController()
    fetchLoans(controller.signal)
    return () => controller.abort()
  }, [fetchLoans])

  const createLoan = async (data) => {
    const res = await api.post('/loans', data)
    await fetchLoans()
    toast.success('Loan created successfully!')
    return res.data.data.loan
  }

  const updateLoan = async (id, data) => {
    const res = await api.put(`/loans/${id}`, data)
    await fetchLoans()
    toast.success('Loan updated!')
    return res.data.data.loan
  }

  const deleteLoan = async (id) => {
    await api.delete(`/loans/${id}`)
    await fetchLoans()
    toast.success('Loan deleted')
  }

  const payLoan = async (id, data) => {
    const res = await api.post(`/loans/${id}/pay`, data)
    await fetchLoans()
    toast.success('Payment recorded!')
    return res.data.data
  }

  const collectInterest = async (id, data = {}) => {
    const res = await api.post(`/loans/${id}/collect-interest`, data)
    await fetchLoans()
    toast.success('Interest collected and due date extended!')
    return res.data.data
  }

  return { loans, loading, error, refetch: fetchLoans, createLoan, updateLoan, deleteLoan, payLoan, collectInterest }
}

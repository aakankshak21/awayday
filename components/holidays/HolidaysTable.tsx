'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2, CalendarX } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { CompanyHoliday } from '@/types'

interface HolidaysTableProps {
  holidays: CompanyHoliday[]
  isManager: boolean
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function HolidaysTable({ holidays, isManager }: HolidaysTableProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!deleteTarget) return
    setLoading(true)
    try {
      const res = await fetch(`/api/holidays/${deleteTarget}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete holiday')
        return
      }
      toast.success('Holiday removed')
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
      setDeleteTarget(null)
    }
  }

  if (holidays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CalendarX className="h-12 w-12 text-gray-200 mb-4" />
        <p className="text-gray-500 font-medium">No holidays this year</p>
        <p className="text-sm text-gray-400 mt-1">
          {isManager ? 'Add company holidays using the button above' : 'Your manager has not added any holidays yet'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Date</TableHead>
            <TableHead>Day</TableHead>
            <TableHead>Holiday Name</TableHead>
            {isManager && <TableHead></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {holidays.map(holiday => {
            const date = parseISO(holiday.date)
            return (
              <TableRow key={holiday.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  {format(date, 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="text-gray-500">
                  {DAY_NAMES[date.getDay()]}
                </TableCell>
                <TableCell>{holiday.name}</TableCell>
                {isManager && (
                  <TableCell>
                    <button
                      onClick={() => setDeleteTarget(holiday.id)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                      title="Remove holiday"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Holiday?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            This will permanently remove the holiday. Employees who already have approved leave on this date will not be affected.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={loading} onClick={handleDelete}>
              {loading ? 'Removing...' : 'Yes, remove it'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

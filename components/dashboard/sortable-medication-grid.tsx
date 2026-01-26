'use client'

import { useState, useTransition, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableMedicationCard } from './sortable-medication-card'
import { AddCard } from './add-card'
import { MedicationCard, type MedicationCardProps } from './medication-card'
import { updateMedicationOrder } from '@/app/medications/actions'

interface SortableMedicationGridProps {
  medications: MedicationCardProps[]
}

export function SortableMedicationGrid({ medications }: SortableMedicationGridProps) {
  const [orderedMedications, setOrderedMedications] = useState<MedicationCardProps[]>(medications)
  const [isPending, startTransition] = useTransition()
  const [isMounted, setIsMounted] = useState(false)

  // Only enable DnD after client mount to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Sync orderedMedications when medications prop changes (new items added/removed)
  useEffect(() => {
    setOrderedMedications(medications)
  }, [medications])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = orderedMedications.findIndex((i) => i.id === active.id)
      const newIndex = orderedMedications.findIndex((i) => i.id === over.id)
      const newOrder = arrayMove(orderedMedications, oldIndex, newIndex)
      
      // Update local state immediately
      setOrderedMedications(newOrder)
      
      // Persist to database via server action
      startTransition(async () => {
        await updateMedicationOrder(newOrder.map(m => m.id))
      })
    }
  }

  // Server-side render: show cards without DnD to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {medications.map((med) => (
          <MedicationCard key={med.id} {...med} />
        ))}
        <AddCard />
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={orderedMedications.map(m => m.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {orderedMedications.map((med) => (
            <SortableMedicationCard key={med.id} {...med} />
          ))}
          <AddCard />
        </div>
      </SortableContext>
    </DndContext>
  )
}

'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MedicationCard, type MedicationCardProps } from './medication-card'

export function SortableMedicationCard(props: MedicationCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} suppressHydrationWarning>
      <MedicationCard {...props} />
    </div>
  )
}

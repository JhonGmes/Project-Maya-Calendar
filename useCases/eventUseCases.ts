
import { CalendarEvent } from '../types';
import { areIntervalsOverlapping } from 'date-fns';

export const EventUseCases = {
    /**
     * Validates if the new event overlaps with any existing events.
     * Pure function: Data IN -> Boolean OUT.
     */
    validateConflict: (newEvent: Partial<CalendarEvent>, existingEvents: CalendarEvent[]): boolean => {
        if (!newEvent.start || !newEvent.end) return false;
        
        return existingEvents.some(e => {
            // Skip if it's the same event (editing)
            if (e.id === newEvent.id) return false;
            
            // Check only active events (optional: maybe ignore cancelled ones if we had that status)
            return areIntervalsOverlapping(
                { start: new Date(e.start), end: new Date(e.end) },
                { start: new Date(newEvent.start), end: new Date(newEvent.end) }
            );
        });
    },

    /**
     * Factory function to create a standardized Event object.
     * Centralizes default values and structure.
     */
    create: (data: Partial<CalendarEvent>, generateId: () => string): CalendarEvent => {
        return {
            id: data.id || generateId(),
            title: data.title || "Novo Evento",
            start: data.start || new Date(),
            end: data.end || new Date(new Date().getTime() + 3600000), // Default 1h
            color: data.color || 'blue',
            category: data.category || 'work',
            completed: false,
            isAllDay: data.isAllDay || false,
            description: data.description,
            location: data.location
        };
    },

    /**
     * Logic to determine if an event can be moved.
     * (Placeholder for future rules like "Locked events")
     */
    canMove: (event: CalendarEvent): boolean => {
        return !event.completed;
    }
};

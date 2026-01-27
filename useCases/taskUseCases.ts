
import { Task, TaskPriority } from '../types';
import { calculatePriority } from '../utils/taskUtils';

export const TaskUseCases = {
    /**
     * Factory function to create a standardized Task object.
     * Ensures priority calculation happens on creation.
     */
    create: (
        title: string, 
        dueDate: Date | undefined, 
        teamId: string | undefined, 
        generateId: () => string
    ): Task => {
        const newTask: Task = {
            id: generateId(),
            title,
            completed: false,
            priority: 'medium', // Default, recalculated below
            dueDate: dueDate || new Date(),
            teamId: teamId
        };
        
        // Apply domain logic: Priority depends on deadline
        newTask.priority = calculatePriority(newTask);
        
        return newTask;
    },

    /**
     * Logic to toggle task completion.
     * Can assume side effects or just data transformation.
     */
    toggle: (task: Task): Task => {
        return {
            ...task,
            completed: !task.completed
        };
    },

    /**
     * Updates task details and recalculates derived fields like priority.
     */
    update: (original: Task, updates: Partial<Task>): Task => {
        const updated = { ...original, ...updates };
        // Recalculate priority if date changed
        if (updates.dueDate) {
            updated.priority = calculatePriority(updated);
        }
        return updated;
    }
};

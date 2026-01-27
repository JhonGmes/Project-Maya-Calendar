
import { useApp } from "../context/AppContext";
import { hasConflict } from "../domain/hasConflict";

export function useEventConflict() {
  const { events } = useApp();

  /**
   * Checks if a hypothetical event time range conflicts with existing events.
   * Useful for drag-and-drop or resize feedback before committing.
   */
  function check(
    candidate: {
      start: Date;
      end: Date;
    },
    ignoreEventId?: string
  ) {
    return hasConflict(events, candidate, ignoreEventId);
  }

  return { check };
}

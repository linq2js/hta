import { EMPTY_OBJECT } from "../core/types";

export function saveLocation(state, location) {
  return { location: { ...location, state: location.state || EMPTY_OBJECT } };
}

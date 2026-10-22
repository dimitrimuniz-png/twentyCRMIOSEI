type EventWithProperties = {
  properties?: object;
};

// Child rows travel with the deletion so parents can be rechecked. Subscribers
// only see the record that was deleted.
export const omitInheritedReadabilityChildRecords = <
  TEvent extends EventWithProperties,
>(
  event: TEvent,
): TEvent => {
  const properties = event.properties;

  if (
    properties === undefined ||
    !('inheritedReadabilityChildRecords' in properties)
  ) {
    return event;
  }

  const {
    inheritedReadabilityChildRecords: _childRecords,
    ...visibleProperties
  } = properties as { inheritedReadabilityChildRecords?: unknown };

  return {
    ...event,
    properties: visibleProperties,
  };
};

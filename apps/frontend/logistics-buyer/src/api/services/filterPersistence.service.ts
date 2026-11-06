// Port of FilterPersistenceService (spec 00 §13.6): localStorage `orders_filters` / `trips_filters`.
const read = (k: string) => {
  const v = localStorage.getItem(k);
  return v ? JSON.parse(v) : null;
};

export const filterPersistence = {
  saveOrderFilters: (f: unknown) => f && localStorage.setItem('orders_filters', JSON.stringify(f)),
  getOrderFilters: () => read('orders_filters'),
  clearOrderFilters: () => localStorage.removeItem('orders_filters'),
  saveTripFilters: (f: unknown) => f && localStorage.setItem('trips_filters', JSON.stringify(f)),
  getTripFilters: () => read('trips_filters'),
  clearTripFilters: () => localStorage.removeItem('trips_filters'),
};

/* Single centralized mock data source for the whole buyer flow (Customer,
   Homepage, Products … through Order Confirmation). Seeded from the curated
   @mockups/mock-data so assets stay coherent; extend mock.json as new screens
   need fields — never hardcode data inside a screen. */
import mock from './mock.json';

export default mock;
export const { customer, homepage, products, seller, sellers, reorderHistory, coupons, orders } = mock as typeof mock;

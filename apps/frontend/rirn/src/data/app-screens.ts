export const appScreens = {
  marketplace: {
    name: "Discover",
    alt: "DigiDukaan app home showing authorised distributors, wholesalers and product offers; illustrative prices and margins",
  },
  search: {
    name: "Compare",
    alt: "DigiDukaan search results showing distributor and wholesaler offers, pack sizes and illustrative prices and margins",
  },
};
export type AppScreen = keyof typeof appScreens;

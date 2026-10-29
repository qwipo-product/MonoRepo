export const appScreens = {
  home: {
    name: "Discover",
    alt: "DigiDukaan mockup home with distributor and product discovery",
  },
  distributor: {
    name: "Connect",
    alt: "Authorised distributor storefront with delivery conditions and categories",
  },
  catalogue: {
    name: "Choose",
    alt: "DigiDukaan product list with pack sizes, schemes and seller information",
  },
  cart: {
    name: "Order",
    alt: "Cart grouped by seller with delivery options and order requirements",
  },
  orders: {
    name: "Follow",
    alt: "My Orders screen showing order and fulfillment status",
  },
  tracking: {
    name: "Track",
    alt: "Order tracking from placed through packed and out for delivery",
  },
};
export type AppScreen = keyof typeof appScreens;

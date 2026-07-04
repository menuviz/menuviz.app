export const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=400&q=80`;

export type Dish = {
  name: string;
  price: string;
  img: string;
  alt: string;
};

export const dishes: Dish[] = [
  {
    name: "Smash burger, aged cheddar",
    price: "$15",
    img: unsplash("photo-1568901346375-23c9450c58cd"),
    alt: "Double smash burger with melted aged cheddar on a brioche bun",
  },
  {
    name: "Margherita, fior di latte",
    price: "$17",
    img: unsplash("photo-1565299624946-b28f40a0ae38"),
    alt: "Wood-fired margherita pizza with fior di latte and basil",
  },
  {
    name: "Lamb skewers, chimichurri",
    price: "$18",
    img: unsplash("photo-1555939594-58d7cb561ad1"),
    alt: "Char-grilled lamb skewers brushed with chimichurri",
  },
  {
    name: "Harvest bowl, tahini citrus",
    price: "$14",
    img: unsplash("photo-1546069901-ba9599a7e63c"),
    alt: "Harvest grain bowl with roasted vegetables and tahini citrus dressing",
  },
  {
    name: "Spring greens, whipped feta",
    price: "$12",
    img: unsplash("photo-1540189549336-e6e99c3679fe"),
    alt: "Spring greens with whipped feta and edible flowers",
  },
  {
    name: "Buttermilk stack, berries",
    price: "$11",
    img: unsplash("photo-1567620905732-2d1ec7ab7445"),
    alt: "Buttermilk pancake stack with fresh berries and syrup",
  },
];

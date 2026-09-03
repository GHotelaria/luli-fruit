// Direcção visual: Picnic Pop — ilustração editorial, cores de fruta e contornos verde-petróleo.
// Este ficheiro contém apenas dados configuráveis; a física e a interface ficam separadas.

export type FruitDefinition = {
  id: string;
  name: string;
  level: number;
  radius: number;
  mass: number;
  score: number;
  color: string;
  accent: string;
  weight: number;
  image: string;
};

export const FRUITS: FruitDefinition[] = [
  { id: "berry", name: "Jabuticaba", level: 1, radius: 17, mass: 0.8, score: 2, color: "#4d1b5a", accent: "#64138a", weight: 30, image: "/assets/fruit-jabuticaba-face.png" },
  { id: "cherry", name: "Uva", level: 2, radius: 22, mass: 1.1, score: 5, color: "#597fe7", accent: "#21a6af", weight: 24, image: "/assets/fruit-uva-face.png" },
  { id: "strawberry", name: "Moranguito", level: 3, radius: 27, mass: 1.5, score: 10, color: "#F05D5E", accent: "#FFB07E", weight: 18, image: "/assets/fruit-moranguito-face.png" },
  { id: "plum", name: "Ameixa", level: 4, radius: 32, mass: 2, score: 18, color: "#7866B8", accent: "#ADA0E6", weight: 13, image: "/assets/fruit-ameixa-face.png" },
  { id: "orange", name: "Laranja", level: 5, radius: 37, mass: 2.6, score: 30, color: "#F59A3B", accent: "#FFD070", weight: 9, image: "/assets/fruit-laranja-face.png" },
  { id: "apple", name: "Maçã", level: 6, radius: 42, mass: 3.3, score: 48, color: "#E95F43", accent: "#FFB164", weight: 6, image: "/assets/fruit-maca-face.png" },
  { id: "peach", name: "Pêssego", level: 7, radius: 47, mass: 4.1, score: 74, color: "#F28A72", accent: "#FFD19A", weight: 4, image: "/assets/fruit-pessego-face.png" },
  { id: "melon", name: "Melão", level: 8, radius: 52, mass: 5.1, score: 108, color: "#77B85A", accent: "#D4ED8A", weight: 2.5, image: "/assets/fruit-melao-face.png" },
  { id: "pineapple", name: "Ananás", level: 9, radius: 57, mass: 6.2, score: 160, color: "#E6B53B", accent: "#FFF08B", weight: 1.2, image: "/assets/fruit-ananas-face.png" },
  { id: "coconut", name: "Coco Solar", level: 10, radius: 63, mass: 7.5, score: 240, color: "#B97846", accent: "#E2AA6A", weight: 0.5, image: "/assets/fruit-coco-solar-face.png" },
];

export function pickNextFruit(maxLevel = 4): FruitDefinition {
  const available = FRUITS.slice(0, maxLevel);
  const total = available.reduce((sum, fruit) => sum + fruit.weight, 0);
  let cursor = Math.random() * total;
  for (const fruit of available) {
    cursor -= fruit.weight;
    if (cursor <= 0) return fruit;
  }
  return available[0];
}

export function getFruit(level: number) {
  return FRUITS[Math.min(level - 1, FRUITS.length - 1)];
}

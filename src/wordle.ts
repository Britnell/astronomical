export const parseCookies = (str: string) => {
  const pairs = str.split("; ");
  const cookies = new Map();
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    cookies.set(key, value);
  }

  return cookies;
};

export const parseGame = (gamestr: string | undefined) => {
  if (!gamestr) return null;
  try {
    return JSON.parse(decodeURIComponent(gamestr));
  } catch (e) {
    return null;
  }
};

export const readGameFromCookie = (cookieString: string | undefined) => {
  if (!cookieString) return newGame();

  const cookies = parseCookies(cookieString);

  const gamecookie = cookies.get("game");
  const game = parseGame(gamecookie) ?? newGame();
  return game;
};

export type Game = {
  solution: string;
  guesses: string[];
  marks: string[];
};
export const newGame = (): Game => ({
  solution: "drive",
  guesses: [],
  marks: [],
});

export const markGuess = (guess: string, solution: string) => {
  return guess
    .split("")
    .map((l, i) => {
      if (guess[i] === solution[i]) return "x";
      if (solution.includes(guess[i])) return "o";
      return "_";
    })
    .join("");
};

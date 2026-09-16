import { getAuth } from "./server";

// pnpm dlx auth@latest generateでschemaを生成するために空配列でexport
export const auth = getAuth({} as Env);

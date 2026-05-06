import { getAuth } from "./server";

// bun x auth@latest generateでschemaを生成するために空配列でexport
export const auth = getAuth({} as Env);

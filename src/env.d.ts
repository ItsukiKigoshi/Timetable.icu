/// <reference path="../.astro/types.d.ts" />

declare namespace App {
	interface Locals {
		lang: string;
		user: import("better-auth").User | null;
		session: import("better-auth").Session | null;
		selectedYear: number;
		selectedTerm: typeof import("@/constants/time").SELECTABLE_TERMS[number];
	}
}

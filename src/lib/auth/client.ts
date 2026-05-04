import { createAuthClient } from "better-auth/react";

export const client = createAuthClient({
	baseURL:
		typeof window !== "undefined"
			? window.location.origin
			: import.meta.env.PUBLIC_BASE_URL,
});

export const signInWithGoogle = async () => {
	const callbackURL =
		typeof window !== "undefined"
			? window.location.href
			: import.meta.env.PUBLIC_BASE_URL || "";

	const { data, error } = await client.signIn.social({
		provider: "google",
		callbackURL: callbackURL,
	});

	if (error) throw error;
	return data;
};

import { fail } from '@sveltejs/kit';
import { Game } from './game';
import type { PageServerLoad, Actions } from './$types';

// This function is called during server-side rendering to load data for the page.
export const load = (({ cookies }) => {
	// Retrieve the game state from the cookies, if available.
	const game = new Game(cookies.get('sverdle'));

	return {
		guesses: game.guesses, // The player's guessed words so far
		answers: game.answers, // An array of strings representing the guessed letters' correctness
		answer: game.answers.length >= 6 ? game.answer : null // The correct answer (revealed if game is over)
	};
}) satisfies PageServerLoad;

export const actions = {
	update: async ({ request, cookies }) => {
		// Instantiates a game with the current cookie state.
		const game = new Game(cookies.get('sverdle'));

		// Extract data from the request.
		const data = await request.formData();
		const key = data.get('key');

		// Get the index for the current round.
		const i = game.answers.length;

		// Handle different types of keys.
		if (key === 'backspace') {
			// If backspace, remove the last character from the current guess.
			game.guesses[i] = game.guesses[i].slice(0, -1);
		} else {
			// Otherwise, append the current key to the guess.
			game.guesses[i] += key;
		}

		// Update the cookie with the new game state.
		cookies.set('sverdle', game.toString(), { path: '' });
	},

	enter: async ({ request, cookies }) => {
		const game = new Game(cookies.get('sverdle'));

		// Extract the guessed word from the form data.
		const data = await request.formData();
		const guess = data.getAll('guess') as string[];

		// Attempt to enter the guessed word into the game.
		if (!game.enter(guess)) {
			// If the guess was invalid, return an error response.
			return fail(400, { badGuess: true });
		}

		// Update the game state in the cookie.
		cookies.set('sverdle', game.toString(), { path: '' });
	},

	restart: async ({ cookies }) => {
		// Delete the game state cookie to restart the game.
		cookies.delete('sverdle', { path: '' });
	}
} satisfies Actions;

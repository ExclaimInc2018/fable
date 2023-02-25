import {
  captureException,
} from 'https://raw.githubusercontent.com/timfish/sentry-deno/fb3c482d4e7ad6c4cf4e7ec657be28768f0e729f/src/mod.ts';

import { Character, CharacterRole, DisaggregatedCharacter } from './types.ts';

import { emotes } from './config.ts';

export default class Rating {
  #stars = 0;

  constructor(
    { role, popularity, stars }: {
      stars?: number;
      role?: CharacterRole;
      popularity?: number;
    },
  ) {
    if (typeof stars === 'number') {
      this.#stars = stars;
      return;
    }

    if (
      role === CharacterRole.Background ||
      !popularity || popularity < 50_000
    ) {
      this.#stars = 1;
    } else if (popularity < 200_000) {
      if (role === CharacterRole.Main) {
        this.#stars = 3;
      } else {
        this.#stars = 2;
      }
    } else if (popularity < 400_000) {
      if (role === CharacterRole.Main) {
        this.#stars = 4;
      } else {
        this.#stars = 3;
      }
    } else if (popularity > 400_000) {
      if (role === CharacterRole.Main) {
        this.#stars = 5;
      } else if (!role && popularity >= 1_000_000) {
        this.#stars = 5;
      } else {
        this.#stars = 4;
      }
    } else {
      captureException(
        `Couldn't determine the star rating for { role: "${role}", popularity: ${popularity} }`,
      );
    }
  }

  get stars(): number {
    return this.#stars;
  }

  get emotes(): string {
    return `${emotes.star.repeat(this.#stars)}${
      emotes.noStar.repeat(5 - this.#stars)
    }`;
  }

  static fromCharacter(character: Character | DisaggregatedCharacter): Rating {
    if (character.popularity) {
      return new Rating({ popularity: character.popularity });
    }

    if (character.media && 'edges' in character.media) {
      const edge = character.media.edges[0];

      if (edge) {
        return new Rating({
          popularity: edge.node.popularity,
          role: edge.role,
        });
      }
    }

    return new Rating({ popularity: 0 });
  }
}

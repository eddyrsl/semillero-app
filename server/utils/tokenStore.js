class TokenStore {
  #tokens = null;
  set(tokens) { this.#tokens = tokens; }
  get() { return this.#tokens; }
  clear() { this.#tokens = null; }
}

export const tokenStore = new TokenStore();

import pako from 'pako';
import { base64url } from 'rfc4648';
import stringify from 'json-stringify-deterministic';

export class Cursor {
  data: Record<string, unknown>;

  constructor(cursor: string) {
    const decoded = base64url.parse(cursor, { loose: true });
    const decompressed = pako.inflate(decoded, { to: 'string', raw: true });

    const [encoding, format, ...rest] = decompressed;
    if (encoding !== 'j' || format !== '1') {
      throw new Error('Invalid cursor');
    }

    this.data = JSON.parse(rest.join(''));
  }

  static #encode(data: Record<string, unknown>): string {
    const compressed = pako.deflate('j1' + stringify(data), {
      raw: true,
      strategy: pako.constants.Z_DEFAULT_STRATEGY,
      level: -1
    });

    return base64url.stringify(compressed, { pad: false });
  }

  static from(data: Record<string, unknown>): Cursor {
    return new Cursor(this.#encode(data));
  }

  toString(): string {
    return Cursor.#encode(this.data);
  }
}

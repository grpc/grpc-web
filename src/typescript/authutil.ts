/** @fileoverview gRPC Web Auth util functions. */

/** Name of authorization header key */
const AUTHORIZATION_KEY = 'Authorization';

/** Name of authorization scheme for first-party authentication. */
const FIRST_PARTY_AUTH_SCHEME = 'APISIDHASH';

/** Name of authorization scheme for secure first-party authentication. */
const SECURE_FIRST_PARTY_AUTH_SCHEME = 'SAPISIDHASH';

const FIRST_PARTY_AUTH_SCHEMES = new Set([
  SECURE_FIRST_PARTY_AUTH_SCHEME,
  FIRST_PARTY_AUTH_SCHEME,
]);

/**
 * Returns whether this requests contains first party auth.
 * @param metadata request metadata
 */
export function isFirstPartyAuth(metadata: {[key: string]: string}): boolean {
  const authHeader = metadata[AUTHORIZATION_KEY];
  return authHeader
    ? FIRST_PARTY_AUTH_SCHEMES.has(authHeader.split(' ')[0])
    : false;
}

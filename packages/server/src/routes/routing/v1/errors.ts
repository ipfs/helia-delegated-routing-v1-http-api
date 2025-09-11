/**
 * Check if an error indicates a "not found" condition
 */
export function isNotFoundError (err: any): boolean {
  return err.code === 'ERR_NOT_FOUND' ||
         err.errors?.[0]?.code === 'ERR_NOT_FOUND' ||
         err.name === 'NotFoundError' ||
         err.errors?.[0]?.name === 'NotFoundError'
}

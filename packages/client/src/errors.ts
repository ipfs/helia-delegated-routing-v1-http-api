export class InvalidRequestError extends Error {
  static name = 'InvalidRequestError'

  constructor (message = 'Invalid request') {
    super(message)
    this.name = 'InvalidRequestError'
  }
}

export class BadResponseError extends Error {
  static name = 'BadResponseError'

  constructor (message = 'Bad response') {
    super(message)
    this.name = 'BadResponseError'
  }
}

export class PlatformError extends Error {
  constructor(
    message: string,
    public platform: string,
    public statusCode: number,
    public errorCode: string,
    public retryable: boolean,
    public override cause?: Error
  ) {
    super(message);
    this.name = "PlatformError";
  }

  static fromResponse(
    platform: string,
    status: number,
    body: string
  ): PlatformError {
    const retryable = status === 429 || status >= 500;
    return new PlatformError(
      body,
      platform,
      status,
      `HTTP_${status}`,
      retryable
    );
  }
}

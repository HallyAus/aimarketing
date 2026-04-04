import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "reachpilot-media";
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";

export async function getFromR2(key: string): Promise<Buffer> {
  const result = await r2.send(
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key })
  );
  const stream = result.Body;
  if (!stream) throw new Error(`Empty response for key: ${key}`);
  return Buffer.from(await stream.transformToByteArray());
}

export async function putToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return `${R2_PUBLIC_URL}/${key}`;
}

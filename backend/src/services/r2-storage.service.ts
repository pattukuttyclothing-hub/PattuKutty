// ============================================================================
// CLOUDFLARE R2 STORAGE INTEGRATION SERVICE (READY FOR CLOUDFLARE PRO ACTIVATION)
// ============================================================================
// SAFETY NOTE: This file contains commented-out blueprint helpers for Cloudflare R2.
// Existing Supabase Storage handlers remain 100% active and untouched until you explicitly
// choose to uncomment this file and switch storage handlers.

// export class R2StorageService {
//   /**
//    * Uploads a file buffer to Cloudflare R2 storage bucket via Worker R2 binding
//    * @param bucketBindingName - Worker env binding name ("R2_PRODUCT_IMAGES" | "R2_CUSTOM_IMAGES")
//    * @param pathInBucket - Destination file key inside bucket (e.g. "products/img_123.jpg")
//    * @param buffer - File Buffer payload
//    * @param contentType - MIME type string (e.g. "image/jpeg")
//    * @returns Public CDN access URL for the uploaded object
//    */
//   static async uploadFile(
//     bucketBindingName: "R2_PRODUCT_IMAGES" | "R2_CUSTOM_IMAGES",
//     pathInBucket: string,
//     buffer: Buffer,
//     contentType: string
//   ): Promise<string> {
//     const workerEnv = process.env as Record<string, any>;
//     const bucket = workerEnv[bucketBindingName];
//
//     if (!bucket || typeof bucket.put !== "function") {
//       throw new Error(
//         `Cloudflare R2 bucket binding '${bucketBindingName}' not found in worker environment. ` +
//         `Ensure R2 bucket bindings are configured in wrangler.jsonc and Cloudflare Worker Dashboard.`
//       );
//     }
//
//     await bucket.put(pathInBucket, buffer, {
//       httpMetadata: { contentType: contentType || "image/jpeg" },
//     });
//
//     const publicDomain = process.env.R2_PUBLIC_DOMAIN || "https://pub-xxxxxxxx.r2.dev";
//     const cleanDomain = publicDomain.replace(/\/$/, "");
//     const cleanPath = pathInBucket.replace(/^\//, "");
//     return `${cleanDomain}/${cleanPath}`;
//   }
//
//   /**
//    * Deletes an object from Cloudflare R2 storage bucket
//    * @param bucketBindingName - Worker env binding name
//    * @param pathInBucket - Destination file key inside bucket
//    */
//   static async removeFile(
//     bucketBindingName: "R2_PRODUCT_IMAGES" | "R2_CUSTOM_IMAGES",
//     pathInBucket: string
//   ): Promise<void> {
//     const workerEnv = process.env as Record<string, any>;
//     const bucket = workerEnv[bucketBindingName];
//
//     if (bucket && typeof bucket.delete === "function") {
//       await bucket.delete(pathInBucket);
//     }
//   }
// }

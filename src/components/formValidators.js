import { helpers } from "vuelidate/lib/validators";

export function isS3Uri(uri) {
  return !helpers.req(uri) || uri.startsWith("s3://");
}

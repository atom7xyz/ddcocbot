import { fileURLToPath } from "node:url";
import { type FormattableString, MediaUpload } from "gramio";
import type { CallbackCtx } from "../handlers/context.ts";

const ASSETS_DIR = new URL("../../assets/", import.meta.url);

/** Telegram file_id per asset, so each image is uploaded once per process. */
const fileIds = new Map<string, string>();

/**
 * Sends a photo from the `assets/` directory. The first send uploads the file;
 * later sends reuse the file_id that Telegram returned.
 */
export async function sendAssetPhoto(
	context: CallbackCtx,
	asset: string,
	caption: string | FormattableString,
): Promise<void> {
	const cached = fileIds.get(asset);
	const photo = cached ?? (await MediaUpload.path(fileURLToPath(new URL(asset, ASSETS_DIR))));

	const sent = await context.sendPhoto(photo, { caption });

	const largest = sent.photo?.at(-1);
	if (!cached && largest) {
		fileIds.set(asset, largest.fileId);
	}
}

/**
 * Run with: node src/utils/file-content.test.js
 */
import assert from "node:assert/strict";
import { extensionFromOriginalName } from "./file-content.js";

assert.equal(extensionFromOriginalName("photo.jpg"), ".jpg");
assert.equal(extensionFromOriginalName("C:\\Users\\foo\\photo.jpg"), ".jpg");
assert.equal(extensionFromOriginalName("/Users/foo/photo.PNG"), ".png");
assert.equal(extensionFromOriginalName("C:\\Users\\foo.bar\\photo.webp"), ".webp");
assert.equal(extensionFromOriginalName("C:\\Users\\foo\\photo"), "");
assert.equal(extensionFromOriginalName(""), "");

console.log("file-content originalname ext: ok");

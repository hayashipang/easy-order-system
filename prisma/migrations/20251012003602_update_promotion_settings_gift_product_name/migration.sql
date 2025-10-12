/*
  Warnings:

  - You are about to drop the column `giftMenuItemId` on the `promotion_settings` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_promotion_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "isFreeShippingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "freeShippingThreshold" INTEGER NOT NULL DEFAULT 20,
    "isGiftEnabled" BOOLEAN NOT NULL DEFAULT false,
    "giftThreshold" INTEGER NOT NULL DEFAULT 20,
    "giftQuantity" INTEGER NOT NULL DEFAULT 1,
    "giftProductName" TEXT,
    "promotionText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_promotion_settings" ("createdAt", "freeShippingThreshold", "giftQuantity", "giftThreshold", "id", "isFreeShippingEnabled", "isGiftEnabled", "promotionText", "updatedAt") SELECT "createdAt", "freeShippingThreshold", "giftQuantity", "giftThreshold", "id", "isFreeShippingEnabled", "isGiftEnabled", "promotionText", "updatedAt" FROM "promotion_settings";
DROP TABLE "promotion_settings";
ALTER TABLE "new_promotion_settings" RENAME TO "promotion_settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

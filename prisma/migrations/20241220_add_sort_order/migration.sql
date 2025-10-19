-- AddSortOrder migration
-- 為 menu_items 表添加 sortOrder 字段

ALTER TABLE "menu_items" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- 為現有的菜單項目設置初始排序值
UPDATE "menu_items" SET "sortOrder" = (
  SELECT row_number() OVER (ORDER BY "createdAt", "name") - 1
  FROM "menu_items" AS mi2 
  WHERE mi2."id" = "menu_items"."id"
);

/*
 SQLite does not support "Dropping foreign key" out of the box, we do "backflip" for it.

 Documents:
 - https://www.sqlite.org/lang_altertable.html
 - https://www.sqlite.org/lang_foreignkeys.html

 This is how we do it:
 1. Disable foreign keys (to make sure there are no issues when dropping tables)
 2. Start a transaction
 3. Create a new table with the desired schema
 4. Copy data from the old table to the new one
 5. Drop the old table
 6. Rename the new table to the old one
 7. If there were any triggers or indexes on the old table, recreate them
 8. Commit the transaction
 9. Enable foreign keys

 About index:
 We create an index to speed up queries that select rows from the 'products' table based on the 'category_id' column.
*/

-- 1. Disable foreign keys
PRAGMA foreign_keys = off;

-- 2. Start a transaction
BEGIN;

-- 3. Create a new table with the desired schema
CREATE TABLE `applications_new` (
    `id` integer PRIMARY KEY NOT NULL,
    `job_title` text NOT NULL,
    `company` text NOT NULL,
    `status` text DEFAULT 'Saved' NOT NULL,
    `url` text,
    `requirements` text,
    `deadline` integer,
    `user_id` integer NOT NULL,
    `created_at` integer DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- 4. Copy data from the old table to the new one
INSERT INTO `applications_new` (`id`, `job_title`, `company`, `status`, `url`, `deadline`, `user_id`, `created_at`)
SELECT `id`, `job_title`, `company`, `status`, `url`, `deadline`, `user_id`, `created_at` FROM `applications`;

-- 5. Drop the old table
DROP TABLE `applications`;

-- 6. Rename the new table to the old one
ALTER TABLE `applications_new` RENAME TO `applications`;

-- 7. (skip, no triggers or indexes to recreate)

-- 8. Commit the transaction
COMMIT;

-- 9. Enable foreign keys
PRAGMA foreign_keys = on;

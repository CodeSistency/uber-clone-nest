/*
  Warnings:

  - You are about to drop the `group_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_groups` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."group_permissions" DROP CONSTRAINT "group_permissions_group_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."group_permissions" DROP CONSTRAINT "group_permissions_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_groups" DROP CONSTRAINT "user_groups_group_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_groups" DROP CONSTRAINT "user_groups_user_id_fkey";

-- DropTable
DROP TABLE "public"."group_permissions";

-- DropTable
DROP TABLE "public"."groups";

-- DropTable
DROP TABLE "public"."permissions";

-- DropTable
DROP TABLE "public"."user_groups";

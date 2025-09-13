/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Operator` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Operator_name_key" ON "public"."Operator"("name");

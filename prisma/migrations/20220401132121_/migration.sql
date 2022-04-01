-- DropForeignKey
ALTER TABLE "Ghost" DROP CONSTRAINT "Ghost_user_id_fkey";

-- AddForeignKey
ALTER TABLE "Ghost" ADD CONSTRAINT "Ghost_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("email") ON DELETE SET NULL ON UPDATE CASCADE;

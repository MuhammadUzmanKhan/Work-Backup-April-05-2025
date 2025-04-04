import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { databaseProviders } from "./database.providers";
import { ThemesModule } from "src/modules/themes/themes.module";
import { CategoriesModule } from "src/modules/categories/categories.module";
import { RoleModule } from "src/super-admin-modules/role/role.module";

@Module({
  imports: [ConfigModule.forRoot(), ThemesModule, CategoriesModule, RoleModule,],
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule { }

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './database.service';

const databaseUrl = process.env.DATABASE_URL?.trim();

@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'postgres',
    url: databaseUrl,
    ssl: { rejectUnauthorized: false },
    autoLoadEntities: true,
    synchronize: true, 
  })],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}

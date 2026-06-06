import {
	Body,
	Controller,
	Delete,
	Get,
	UploadedFiles,
	Req,
	Param,
	ParseArrayPipe,
	ParseIntPipe,
	Post,
	Put,
	UseInterceptors,
	UseGuards,
	ValidationPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ImageDeleteDto } from './dto/image-delete.dto';
import { TableUpdateItemDto } from './dto/table-update-item.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { User } from '../user/user.entity';

@UseGuards(AuthGuard)
@Controller('product')
export class ProductController {
	constructor(private readonly productService: ProductService) {}

	@Get("")
	findAll(@Req() request: Request & { user: User }) {
		return this.productService.findAll(request.user.id);
	}

	@Get('urun-kodu')
	findOnlyUrunKodu(@Req() request: Request & { user: User }) {
		return this.productService.findOnlyUrunKodu(request.user.id);
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number) {
		return this.productService.findOne(id);
	}

	@Post()
	@UseInterceptors(FilesInterceptor('images'))
	create(
		@Req() request: Request & { user: User },
		@Body(
			new ValidationPipe({
				transform: true,
				whitelist: true,
				transformOptions: { enableImplicitConversion: true },
			}),
		)
		dto: CreateProductDto,
		@UploadedFiles() files: any[],
	) {
		return this.productService.create(dto, request.user.id, files);
	}

	@Put('table-update')
	tableUpdate(
		@Req() request: Request & { user: User },
		@Body(
			new ParseArrayPipe({
				items: TableUpdateItemDto,
				whitelist: true,
				forbidNonWhitelisted: true,
			}),
		)
		tablePayload: TableUpdateItemDto[],
	) {
		return this.productService.tableUpdate(request.user.id, tablePayload);
	}

	@Delete('table-delete')
	tableDelete(
		@Req() request: Request & { user: User },
		@Body(
			new ParseArrayPipe({
				items: String,
			}),
		)
		ids: string[],
	) {
		return this.productService.tableDelete(request.user.id, ids);
	}

	@Delete('image-delete')
	imageDelete(
		@Req() request: Request & { user: User },
		@Body(
			new ValidationPipe({
				transform: true,
				whitelist: true,
				transformOptions: { enableImplicitConversion: true },
			}),
		)
		dto: ImageDeleteDto,
	) {
		return this.productService.imageDelete(request.user.id, dto);
	}

	@Put(':id')
	@UseInterceptors(FilesInterceptor('images'))
	update(
		@Req() request: Request & { user: User },
		@Param('id', ParseIntPipe) id: number,
		@Body(
			new ValidationPipe({
				transform: true,
				whitelist: true,
				transformOptions: { enableImplicitConversion: true },
			}),
		)
		dto: UpdateProductDto,
		@UploadedFiles() files: any[],
	) {
		return this.productService.update(id, dto, request.user.id, files);
	}

	
	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number) {
		return this.productService.remove(id);
	}
}

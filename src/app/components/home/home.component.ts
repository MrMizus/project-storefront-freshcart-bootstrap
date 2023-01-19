import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { filter, map, shareReplay } from 'rxjs/operators';
import { CategoryModel } from '../../models/category.model';
import { StoreQueryModel } from '../../query-models/store.query-model';
import { ProductModel } from '../../models/product.model';
import { CategoriesService } from '../../services/categories.service';
import { StoresService } from '../../services/stores.service';
import { TagsService } from '../../services/tags.service';
import { ProductsService } from '../../services/products.service';
import { StoreModel } from '../../models/store.model';
import { TagModel } from '../../models/tag.model';

@Component({
  selector: 'app-home',
  styleUrls: ['./home.component.scss'],
  templateUrl: './home.component.html',
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  readonly categories$: Observable<CategoryModel[]> = this._categoriesService.getAllCategories();
  readonly products$: Observable<ProductModel[]> = this._productsService.getAllProducts().pipe(shareReplay(1));

  readonly stores$: Observable<StoreQueryModel[]> = combineLatest([
    this._storesService.getAllStores(),
    this._tagsService.getAllTags()
  ]).pipe(map(([stores, tags]) => this._mapToStoreQueryModel(stores, tags)))

  readonly fruits$: Observable<ProductModel[]> = this.products$
    .pipe(
      map((products) => this._filterSortSliceProducts(products, '5')),
    )
  readonly snacks$: Observable<ProductModel[]> = this.products$
    .pipe(
      map((products) => this._filterSortSliceProducts(products, '2'))
    )
  readonly test$: Observable<ProductModel[]> = this._productsService.getAllProducts()

  constructor(private _categoriesService: CategoriesService, private _storesService: StoresService, private _tagsService: TagsService, private _productsService: ProductsService) {
  }

  private _filterSortSliceProducts(products: ProductModel[], categoryId: string, isDescending: boolean = true, sliceTo: number = 5) {
    return products
      .filter((product) => product.categoryId === categoryId)
      .sort((a, b) => isDescending ? b.featureValue - a.featureValue : a.featureValue - b.featureValue)
      .slice(0, sliceTo)
  }

  private _mapToStoreQueryModel(
    stores: StoreModel[],
    tags: TagModel[]
  ): StoreQueryModel[] {
    const tagMap = tags.reduce((a, c) => ({ ...a, [c.id]: c }), {}) as Record<string, TagModel>

    return stores.map((store) => ({
      name: store.name,
      logoUrl: store.logoUrl,
      distanceInMeters: Math.round(store.distanceInMeters * .01) / 10,
      tags: (store.tagIds ?? []).map((id) => tagMap[id]?.name),
      id: store.id
    }))
  }
}

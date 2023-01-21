import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { CategoryModel } from '../../models/category.model';
import { ProductModel } from '../../models/product.model';
import { ProductsService } from '../../services/products.service';
import { CategoriesService } from '../../services/categories.service';
import { ProductQueryModel } from 'src/app/query-models/product.query-model';

@Component({
  selector: 'app-category-products',
  styleUrls: ['./category-products.component.scss'],
  templateUrl: './category-products.component.html',
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryProductsComponent {
  readonly categories$: Observable<CategoryModel[]> = this._categoriesService.getAllCategories();
  readonly category$: Observable<CategoryModel> = this._activatedRoute.params.pipe(switchMap(data => this._categoriesService.getOneCategory(data["categoryId"])), shareReplay(1));
  readonly products$: Observable<ProductQueryModel[]> = combineLatest([
    this._productsService.getAllProducts(),
    this.category$
  ]).pipe(map(([products, category]) => this._mapToProductQueryModels(products).filter((product) => product.categoryId === category.id).sort((a, b) => +b.featureValue - +a.featureValue)))

  constructor(private _productsService: ProductsService, private _activatedRoute: ActivatedRoute, private _categoriesService: CategoriesService) {
  }
  private _mapToProductQueryModels(
    prodcuts: ProductModel[]
  ): ProductQueryModel[] {
    return prodcuts.map((product) => ({
      name: product.name,
      price: product.price,
      categoryId: product.categoryId,
      ratingValue: product.ratingValue,
      ratingCount: product.ratingCount,
      imageUrl: product.imageUrl,
      featureValue: product.featureValue,
      storeIds: product.storeIds,
      id: product.id,
      ratingOptions: new Array(5).fill(0).map((star, index) => {
        if (product.ratingValue >= index+1) {
          return star = 1
        }else if (product.ratingValue > index){
          return star = 0.5
        } else {
          return star = 0
        }
      })
    }));
  }
}
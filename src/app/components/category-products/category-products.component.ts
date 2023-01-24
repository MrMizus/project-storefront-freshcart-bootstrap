import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest, of, pipe } from 'rxjs';
import {
  map,
  shareReplay,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';
import { CategoryModel } from '../../models/category.model';
import { ProductQueryModel } from '../../query-models/product.query-model';
import { ProductModel } from '../../models/product.model';
import { ProductsService } from '../../services/products.service';
import { CategoriesService } from '../../services/categories.service';
import { SortSelectionModel } from 'src/app/models/sort-selection.model';

@Component({
  selector: 'app-category-products',
  styleUrls: ['./category-products.component.scss'],
  templateUrl: './category-products.component.html',
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryProductsComponent {

  readonly sort: FormGroup = new FormGroup({
    sortValue: new FormControl('Featured', Validators.required),
  });

  readonly sortValue$: Observable<SortSelectionModel> = this.sort.valueChanges.pipe(
    map((form) => form.sortValue),
    startWith({
      name: 'Featured',
      value: 'featureValue',
      isDesc: true,
    })
  );

  readonly sortSelection$: Observable<SortSelectionModel[]> = of([{
    name: 'Featured',
    value: 'featureValue',
    isDesc: true,
  },
  {
    name: 'Price: Low to High',
    value: 'price',
    isDesc: false,
  },
  {
    name: 'Price: High to Low',
    value: 'price',
    isDesc: true,
  },{
    name: 'Avg. Rating',
    value: 'ratingValue',
    isDesc: true,
  }
]);

  private _pageSizeSubject: BehaviorSubject<number> =
    new BehaviorSubject<number>(5);
  public pageSize$: Observable<number> = this._pageSizeSubject.asObservable();

  private _pageNumberSubject: BehaviorSubject<number> =
    new BehaviorSubject<number>(1);
  public pageNumber$: Observable<number> =
    this._pageNumberSubject.asObservable();

  readonly categories$: Observable<CategoryModel[]> =
    this._categoriesService.getAllCategories();
  readonly category$: Observable<CategoryModel> =
    this._activatedRoute.params.pipe(
      switchMap((data) =>
        this._categoriesService.getOneCategory(data['categoryId'])
      ),
      shareReplay(1)
    );
  readonly sortedProducts$: Observable<ProductQueryModel[]> = combineLatest([
    this._productsService.getAllProducts(),
    this.category$,
    this.sortValue$,
  ]).pipe(
    map(([products, category, sortValue]) =>
      this._mapToProductQueryModels(products)
        .filter((product) => product.categoryId === category.id)
        .sort((a, b) => {
          let value = sortValue.value as keyof ProductQueryModel
          return sortValue.isDesc ? +b[value] - +a[value] : +a[value] - +b[value]
        })
    )
  );

  readonly products$: Observable<ProductQueryModel[]> = combineLatest([
    this.sortedProducts$,
    this.pageNumber$,
    this.pageSize$,
  ]).pipe(
    map(([products, pageNumber, pageSize]) =>
      products.slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
    )
  );

  readonly limitSelection$: Observable<number[]> = of([5, 10, 15]);

  readonly pageSelection$: Observable<number[]> = combineLatest([
    this.sortedProducts$,
    this.pageSize$,
  ]).pipe(
    map(([countries, pageSize]) => {
      let pageNumbers: number[] = [];
      let numberOfPages: number = Math.ceil(countries.length / pageSize) + 1;
      for (let i = 1; i < numberOfPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    })
  );

  constructor(
    private _productsService: ProductsService,
    private _activatedRoute: ActivatedRoute,
    private _categoriesService: CategoriesService
  ) {}

  onPageNumberChange(limit: number): void {
    this.pageNumber$
      .pipe(
        take(1),
        tap(() => this._pageNumberSubject.next(limit))
      )
      .subscribe();
  }

  onPageSizeChange(page: number): void {
    combineLatest([this.sortedProducts$, this.pageNumber$, this.pageSize$])
      .pipe(
        take(1),
        tap(([products, pageNumber]) => {
          this._pageSizeSubject.next(page)
          this._pageNumberSubject.next(pageNumber <= Math.ceil(products.length / page)
          ? pageNumber
          : Math.ceil(products.length / page));
        })
      )
      .subscribe();
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
        if (product.ratingValue >= index + 1) {
          return (star = 1);
        } else if (product.ratingValue > index) {
          return (star = 0.5);
        } else {
          return (star = 0);
        }
      }),
    }));
  }
}

import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest, of, pipe } from 'rxjs';
import { debounceTime, filter, map, shareReplay, startWith, switchMap, take, tap } from 'rxjs/operators';
import { ProductModel } from '../../models/product.model';
import { SortSelectionModel } from '../../models/sort-selection.model';
import { CategoryModel } from '../../models/category.model';
import { ProductQueryModel } from '../../query-models/product.query-model';
import { ProductsService } from '../../services/products.service';
import { CategoriesService } from '../../services/categories.service';

@Component({
  selector: 'app-category-products',
  styleUrls: ['./category-products.component.scss'],
  templateUrl: './category-products.component.html',
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryProductsComponent {
  readonly productsList$: Observable<ProductModel[]> = this._productsService
    .getAllProducts()
    .pipe(shareReplay(1));

  readonly sort: FormGroup = new FormGroup({
    sortValue: new FormControl('Featured', Validators.required),
  });

  readonly sortValue$: Observable<SortSelectionModel> =
    this.sort.valueChanges.pipe(
      map((form) => form.sortValue),
      startWith({
        name: 'Featured',
        value: 'featureValue',
        isDesc: true,
      })
    );

  readonly filter: FormGroup = new FormGroup({
    priceMin: new FormControl(''),
    priceMax: new FormControl(''),
    rating: new FormControl(''),
    store: new FormControl(''),
    storeFilter: new FormControl(''),
  });

  readonly priceMin$: Observable<number> = this.filter.valueChanges.pipe(
    map((form) => form.priceMin),
    startWith(0),
    debounceTime(1000)
  );
  readonly priceMax$: Observable<number> = 
    this.filter.valueChanges
  .pipe(
    map((filterValue) => {
      if (!filterValue.priceMax) {
        return Infinity;
      }
      return filterValue.priceMax;
    }),
    startWith(Infinity),
    debounceTime(1000)
  );

  readonly rating$: Observable<number> = this.filter.valueChanges.pipe(
    map((form) => {
      console.log(form.rating)
      return form.rating
    }),
    startWith(0),
  );
  // readonly stars$: Observable<number[][]> = of([[1,1,1,1,1],[1,1,1,1,0],[1,1,1,0,0],[1,1,0,0,0]])

  readonly sortSelection$: Observable<SortSelectionModel[]> = of([
    {
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
    },
    {
      name: 'Avg. Rating',
      value: 'ratingValue',
      isDesc: true,
    },
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

  readonly filtredProducts$: Observable<ProductQueryModel[]> = combineLatest([
    this.productsList$,
    this.category$,
    this.priceMin$,
    this.priceMax$,
    this.rating$
  ]).pipe(
    map(([products, category, priceMin, priceMax, rating]) =>
      this._mapToProductQueryModels(products)
        .filter((product) => product.categoryId === category.id)
        .filter((product) => {
          return product.price >= priceMin && product.price <= priceMax;
        })
        .filter((product) => product.ratingValue >= rating)
    ),
    shareReplay(1)
  );

  readonly filtredSortedProducts$: Observable<ProductQueryModel[]> =
    combineLatest([this.filtredProducts$, this.sortValue$]).pipe(
      map(([products, sortValue]) => {
        return products.sort((a, b) => {
          let value = sortValue.value as keyof ProductQueryModel;
          return sortValue.isDesc
            ? +b[value] - +a[value]
            : +a[value] - +b[value];
        });
      })
    );

  readonly products$: Observable<ProductQueryModel[]> = combineLatest([
    this.filtredSortedProducts$,
    this.pageNumber$,
    this.pageSize$,
  ]).pipe(
    map(([products, pageNumber, pageSize]) =>
      products.slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
    )
  );

  readonly limitSelection$: Observable<number[]> = this.filtredProducts$.pipe(
    map((products) => {
      let pagesize: number[] = [];
      for (let i = 5; i <= products.length + 5; i += 5) {
        pagesize.push(i);
      }
      return pagesize;
    })
  );

  readonly pageSelection$: Observable<number[]> = combineLatest([
    this.filtredSortedProducts$,
    this.pageSize$,
  ]).pipe(
    map(([products, pageSize]) => {
      let pageNumbers: number[] = [];
      let numberOfPages: number = Math.ceil(products.length / pageSize) + 1;
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
  ) { }

  onPageNumberChange(limit: number): void {
    this.pageNumber$
      .pipe(
        take(1),
        tap(() => this._pageNumberSubject.next(limit))
      )
      .subscribe();
  }

  onPageSizeChange(page: number): void {
    combineLatest([
      this.filtredSortedProducts$,
      this.pageNumber$,
      this.pageSize$,
    ])
      .pipe(
        take(1),
        tap(([products, pageNumber]) => {
          this._pageSizeSubject.next(page);
          this._pageNumberSubject.next(
            pageNumber <= Math.ceil(products.length / page)
              ? pageNumber
              : Math.ceil(products.length / page)
          );
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

  onFilterSubmitted(filter: FormGroup): void {
  }
}

import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { debounceTime, map, shareReplay, startWith, switchMap, take, tap } from 'rxjs/operators';
import { ProductModel } from '../../models/product.model';
import { SortSelectionModel } from '../../models/sort-selection.model';
import { CategoryModel } from '../../models/category.model';
import { ProductQueryModel } from '../../query-models/product.query-model';
import { StoreModel } from '../../models/store.model';
import { ProductsService } from '../../services/products.service';
import { CategoriesService } from '../../services/categories.service';
import { StoresService } from '../../services/stores.service';


@Component({
  selector: 'app-category-products',
  styleUrls: ['./category-products.component.scss'],
  templateUrl: './category-products.component.html',
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryProductsComponent {
  test = 'Featured'

  readonly stars$: Observable<number[][]> = of([[1,1,1,1,1],[1,1,1,1,0],[1,1,1,0,0],[1,1,0,0,0]])

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

  readonly storeIdForm: FormGroup = new FormGroup({})

  readonly filter: FormGroup = new FormGroup({
    priceMin: new FormControl(''),
    priceMax: new FormControl(''),
    rating: new FormControl(0),
    store: this.storeIdForm,
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
    map((form) => Array.isArray(form.rating) ? form.rating.reduce((a:number,c:number) => a+c,0) : 0),
    startWith(1),
  );

  readonly storeFilter$: Observable<string> = this.filter.valueChanges.pipe(
    map((form) => form.storeFilter),
    startWith(''),
  );

  readonly stores$: Observable<StoreModel[]> = 
  combineLatest([
    this._storesService.getAllStores().pipe(tap(data => this.setControls(data))),
    this.storeFilter$
  ]).pipe(
    map(([stores, search]) => { 
      return stores.filter((store) => store.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()))}
  ),
  )


  readonly store$: Observable<number[]> = this.storeIdForm.valueChanges.pipe(
    map((value) => {
      let valueArray: number[] = Object.keys(value).reduce((acc: number[], curr: string) => {
        if (value[curr]) {
          return [...acc, +curr]
        } else {
          return acc
        }
      },[])
      return valueArray
    }),
    startWith([]),
    shareReplay(1)
  )

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
    this._categoriesService.getAllCategories().pipe(
      shareReplay(1)
    );

  readonly category$: Observable<CategoryModel> =
    this._activatedRoute.params.pipe(
      switchMap((data) =>
        this._categoriesService.getOneCategory(data['categoryId'])
      ),
    );

  readonly filtredProducts$: Observable<ProductQueryModel[]> = combineLatest([
    this.productsList$,
    this.category$,
    this.priceMin$,
    this.priceMax$,
    this.rating$,
    this.store$
  ]).pipe(
    map(([products, category, priceMin, priceMax, rating, storeIds]) =>
      this._mapToProductQueryModels(products)
        .filter((product) => product.categoryId === category.id)
        .filter((product) => {
          return product.price >= priceMin && product.price <= priceMax;
        })
        .filter((product) => 
          product.ratingValue >= rating)
        .filter((product) =>  storeIds.some(storeId => product.storeIds.includes(`${storeId}`)) || !storeIds.length)
    ),
    shareReplay(1)
  );

  readonly filtredSortedProducts$: Observable<ProductQueryModel[]> =
    combineLatest([this.filtredProducts$, this.sortValue$]).pipe(
      map(([products, sortValue]) => {
        return products.sort((a, b) => {
          const value = sortValue.value as keyof ProductQueryModel;
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
    private _categoriesService: CategoriesService, private _storesService: StoresService
  ) { }

  compareByID(first:any, second:any): boolean {
    return first && second && first.ID === second.ID
  }

  setControls(stores: StoreModel[]): void {
    stores.forEach(
      store => this.storeIdForm.addControl(
        store.id, new FormControl(false)
      )
    )
  }

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
}

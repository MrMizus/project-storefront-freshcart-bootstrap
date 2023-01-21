import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, Observable, startWith } from 'rxjs';
import { switchMap, map, shareReplay, debounceTime,} from 'rxjs/operators';
import { StoreModel } from '../../models/store.model';
import { ProductModel } from '../../models/product.model';
import { StoresService } from '../../services/stores.service';
import { ProductsService } from '../../services/products.service';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-store-products',
  styleUrls: ['./store-products.component.scss'],
  templateUrl: './store-products.component.html',
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoreProductsComponent {
  readonly search: FormGroup = new FormGroup({ searchProduct: new FormControl() });
  readonly store$: Observable<StoreModel> = this._activatedRoute.params.pipe(switchMap(data => this._storesService.getOneStore(data["storeId"])),
   shareReplay(1));

   readonly defaultSearchValue$: Observable<string> = this.search.valueChanges.pipe(
    map(form => form.searchProduct.toLocaleLowerCase()),
    startWith(''),
    debounceTime(1000)
  );


  readonly products$: Observable<ProductModel[]> = combineLatest([
    this.store$,
    this._productsService.getAllProducts(),
    this.defaultSearchValue$
  ]).pipe(map(([store, produts, defaultSearchValue]) => produts.filter((product) => (product.storeIds.includes(store.id) && product.name.toLocaleLowerCase().includes(defaultSearchValue)))))

  constructor(private _storesService: StoresService, private _activatedRoute: ActivatedRoute, private _productsService: ProductsService) {
  }
}

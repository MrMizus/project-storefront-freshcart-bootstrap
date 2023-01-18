import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CategoryModel } from '../../models/category.model';
import { StoreModel } from '../../models/store.model';
import { CategoriesService } from '../../services/categories.service';
import { StoresService } from '../../services/stores.service';

@Component({
  selector: 'app-footer',
  styleUrls: ['./footer.component.scss'],
  templateUrl: './footer.component.html',
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {
  readonly categories$: Observable<CategoryModel[]> = this._categoriesService.getAllCategories();
  readonly stores$: Observable<StoreModel[]> = this._storesService.getAllStores();
  readonly getToKnow$: Observable<string[]> = of(['Company', 'About', 'Blog', 'Helpe Center', 'Our Value'])

  constructor(private _categoriesService: CategoriesService, private _storesService: StoresService) {
  }
}

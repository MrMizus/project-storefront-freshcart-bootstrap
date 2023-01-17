import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CategoryProductsComponent } from './components/category-products/category-products.component';
import { HomeComponent } from './components/home/home.component';
import { StoreProductsComponent } from './components/store-products/store-products.component';
import { CategoryProductsComponentModule } from './components/category-products/category-products.component-module';
import { HomeComponentModule } from './components/home/home.component-module';
import { StoreProductsComponentModule } from './components/store-products/store-products.component-module';

const routes: Routes = [
  { path: 'categories/:categoryId', component: CategoryProductsComponent },
  { path: '', component: HomeComponent },
  { path: 'stores/:storeId', component: StoreProductsComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    CategoryProductsComponentModule,
    HomeComponentModule,
    StoreProductsComponentModule,
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}

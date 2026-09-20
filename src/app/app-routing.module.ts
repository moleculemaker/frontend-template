import { NgModule } from "@angular/core";
import { RouteReuseStrategy, RouterModule, Routes } from "@angular/router";

import { MainLayoutComponent } from "./components/main-layout/main-layout.component";
import { TestComponent } from "src/app/components/test/test.component";
import { TestResultComponent } from "src/app/components/test-result/test-result.component";
import { ParamChangeRouteReuseStrategy } from "./param-change-route-reuse.strategy";


const routes: Routes = [
  { path: "", pathMatch: "full", component: MainLayoutComponent },
  { path: 'test', component: TestComponent },
  { path: 'test/result/:id', component: TestResultComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [{ provide: RouteReuseStrategy, useClass: ParamChangeRouteReuseStrategy }],
})
export class AppRoutingModule { }

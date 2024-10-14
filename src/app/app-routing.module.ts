import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { FontMatchComponent } from "./components/font-match/font-match.component";
import { MainLayoutComponent } from "./components/main-layout/main-layout.component";
import { TemplateJobResultComponent } from "./components/template-job-result/template-job-result.component";

const routes: Routes = [
  { path: "", pathMatch:"full", component: MainLayoutComponent },
  { path: "font-match", component: FontMatchComponent },
  { path: "template-job/result/:id", component: TemplateJobResultComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

import { Component, inject } from "@angular/core";
import { Meta } from "@angular/platform-browser";

import { EnvironmentService } from "~/app/services/environment.service";

/**
 * Tells testers that a non-prod deployment is for internal testing and points them to
 * the released tool. Driven by `environment` and `prodUrl` in the runtime config, which
 * the chart sets per environment; shown for anything but prod, never when unset.
 *
 * A plain version until the design system has one (frontend-template#14).
 */
@Component({
  selector: "app-staging-banner",
  standalone: true,
  template: `
    @if (show) {
      <div class="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900" role="status">
        This is an internal testing build.
        @if (prodUrl) {
          Use the released tool at <a class="font-semibold underline" [href]="prodUrl">{{ prodUrl }}</a>.
        }
      </div>
    }
  `,
})
export class StagingBannerComponent {
  readonly show: boolean;
  readonly prodUrl: string;

  constructor() {
    const config = inject(EnvironmentService).getEnvConfig();
    this.show = !!config?.environment && config.environment !== "prod";
    this.prodUrl = config?.prodUrl ?? "";
    // Staging and prod run the same image, so index.html can't tell them apart
    if (this.show) {
      inject(Meta).updateTag({ name: "robots", content: "noindex" });
    }
  }
}

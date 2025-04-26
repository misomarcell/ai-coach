import { Component, inject } from "@angular/core";
import { PageTitleComponent } from "../../page-title/page-title.component";
import { ActivatedRoute } from "@angular/router";
import { Analysis } from "@aicoach/shared";
import { MatIconModule } from "@angular/material/icon";

@Component({
	imports: [PageTitleComponent, MatIconModule],
	templateUrl: "./analysis-details-page.component.html",
	styleUrl: "./analysis-details-page.component.scss"
})
export class AnalysisDetailsPageComponent {
	private activatedRoute = inject(ActivatedRoute);

	analysis = this.activatedRoute.snapshot.data["analysis"] as Analysis | undefined;
}

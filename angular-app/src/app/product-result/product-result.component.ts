import { popInEffect } from "@aicoach/animations";
import { FoodProduct, NUTRIENT_TAG_MAP, NutrientTag, NutrientTagLabel } from "@aicoach/shared";
import { isPlatformServer, NgStyle } from "@angular/common";
import { Component, inject, OnInit, PLATFORM_ID, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatChipsModule } from "@angular/material/chips";
import { MatIconModule } from "@angular/material/icon";
import { NutritionLabelComponent } from "../nutrition-label/nutrition-label.component";
import { ApiService } from "../services/api.service";
import { catchError, EMPTY, finalize, from, take, tap } from "rxjs";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ActivatedRoute, Router } from "@angular/router";
import { PageTitleComponent } from "../page-title/page-title.component";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
	imports: [
		NgStyle,
		PageTitleComponent,
		NutritionLabelComponent,
		MatButtonModule,
		MatChipsModule,
		MatProgressSpinnerModule,
		MatIconModule
	],
	animations: [popInEffect],
	host: {
		"[@popInEffect]": ""
	},
	templateUrl: "./product-result.component.html",
	styleUrl: "./product-result.component.scss"
})
export class ProductResultComponent implements OnInit {
	private apiService = inject(ApiService);
	private router = inject(Router);
	private snackBar = inject(MatSnackBar);
	private activatedRoute = inject(ActivatedRoute);
	private platformId = inject(PLATFORM_ID);

	isLoading = signal(true);
	product = signal<FoodProduct | null>(null);
	nutrientTags = signal<NutrientTagLabel[]>([]);

	ngOnInit(): void {
		const barcode = this.activatedRoute.snapshot.paramMap.get("barcode");
		if (!barcode || isPlatformServer(this.platformId)) {
			return;
		}

		this.apiService
			.get<FoodProduct>(`p/${barcode}`)
			.pipe(
				take(1),
				tap((product) => {
					this.product.set(product);
					this.nutrientTags.set((product.nutrientTags ?? []).map((tag) => this.getNutrientTagLabel(tag)).filter((tag) => !!tag));
				}),
				catchError((error) => {
					if (error.status === 404) {
						return from(this.router.navigate(["/foods/add"]));
					} else {
						this.snackBar.open("Error fetching product data. Please try again.", "Close", {
							panelClass: "error-snackbar"
						});
					}

					return EMPTY;
				}),
				finalize(() => this.isLoading.set(false))
			)
			.subscribe();
	}

	private getNutrientTagLabel(tag?: NutrientTag): NutrientTagLabel | undefined {
		return NUTRIENT_TAG_MAP.find((item) => item.name === tag);
	}
}

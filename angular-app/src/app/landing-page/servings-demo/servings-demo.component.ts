import { isPlatformBrowser } from "@angular/common";
import { Component, OnInit, OnDestroy, signal, PLATFORM_ID, inject } from "@angular/core";
import { MatCardModule } from "@angular/material/card";

interface FoodItem {
	id: number;
	name: string;
	calories: number;
	top: number;
}

@Component({
	selector: "app-servings-demo",
	imports: [MatCardModule],
	templateUrl: "./servings-demo.component.html",
	styleUrl: "./servings-demo.component.scss"
})
export class ServingsDemoComponent implements OnInit, OnDestroy {
	foodItems = [
		{ id: 1, name: "Grilled Chicken Breast", calories: 165 },
		{ id: 2, name: "Avocado Toast", calories: 240 },
		{ id: 3, name: "Greek Yogurt", calories: 100 },
		{ id: 4, name: "Salmon Fillet", calories: 206 },
		{ id: 5, name: "Quinoa Bowl", calories: 222 },
		{ id: 6, name: "Protein Smoothie", calories: 180 },
		{ id: 7, name: "Egg White Omelette", calories: 124 },
		{ id: 8, name: "Sweet Potato", calories: 112 },
		{ id: 9, name: "Tuna Salad", calories: 140 },
		{ id: 10, name: "Oatmeal with Berries", calories: 215 },
		{ id: 11, name: "Hummus & Veggies", calories: 166 },
		{ id: 12, name: "Turkey Sandwich", calories: 320 },
		{ id: 13, name: "Protein Pasta", calories: 270 },
		{ id: 14, name: "Almond Butter Toast", calories: 190 },
		{ id: 15, name: "Lentil Soup", calories: 230 }
	];

	private paltformId = inject(PLATFORM_ID);
	private lastTimestamp: DOMHighResTimeStamp = 0;
	private animationFrameId = 0;

	visibleItems = signal<FoodItem[]>([]);
	animationInterval: any;
	itemHeight = 58;
	containerHeight = 230;
	currentIndex = 0;
	currentTop = 0;
	scrollSpeed = 30;

	ngOnInit(): void {
		if (isPlatformBrowser(this.paltformId)) {
			this.initializeItems();
			this.startScrollAnimation();
		}
	}

	ngOnDestroy(): void {
		if (this.animationInterval) {
			cancelAnimationFrame(this.animationInterval);
		}
	}

	initializeItems(): void {
		const items: FoodItem[] = [];
		for (let i = 0; i < 5; i++) {
			const foodIndex = i % this.foodItems.length;
			items.push({
				...this.foodItems[foodIndex],
				id: Date.now() + i,
				top: i * this.itemHeight
			});
		}
		this.visibleItems.set(items);
	}

	startScrollAnimation(): void {
		this.lastTimestamp = performance.now();
		const animate = (timestamp: number) => {
			const delta = timestamp - this.lastTimestamp;
			this.lastTimestamp = timestamp;
			this.updateItemPositions(delta);

			this.animationFrameId = requestAnimationFrame(animate);
		};

		this.animationInterval = requestAnimationFrame(animate);
	}

	updateItemPositions(delta: number): void {
		const movement = this.scrollSpeed * (delta / 1000);

		this.visibleItems.update((items) => {
			const shifted = items.map((item) => ({
				...item,
				top: item.top - movement
			}));

			this.currentTop = 0;

			if (shifted[0].top < -this.itemHeight) {
				shifted.shift();
				this.currentIndex = (this.currentIndex + 1) % this.foodItems.length;

				const last = shifted[shifted.length - 1];
				const nextSource = this.foodItems[this.currentIndex];
				shifted.push({
					id: nextSource.id,
					name: nextSource.name,
					calories: nextSource.calories,
					top: last.top + this.itemHeight
				});
			}

			return shifted;
		});
	}
}

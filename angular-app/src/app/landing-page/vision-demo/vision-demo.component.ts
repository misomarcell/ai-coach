import { Component, OnInit, OnDestroy, signal, inject, PLATFORM_ID } from "@angular/core";
import { trigger, state, style, animate, transition } from "@angular/animations";
import { MatCardModule } from "@angular/material/card";
import { isPlatformBrowser } from "@angular/common";

interface FoodEmoji {
	id: number;
	emoji: string;
	name: string;
	position?: "entering" | "left" | "center" | "right" | "exiting";
}

@Component({
	selector: "app-vision-demo",
	imports: [MatCardModule],
	templateUrl: "./vision-demo.component.html",
	styleUrl: "./vision-demo.component.scss",
	animations: [
		trigger("emojiState", [
			state(
				"entering",
				style({
					transform: "translate3d(-150%, 0, 0) scale(0.5)",
					opacity: 0
				})
			),
			state(
				"left",
				style({
					transform: "translate3d(-100%, 0, 0) scale(0.5)",
					opacity: 0.8
				})
			),
			state(
				"center",
				style({
					transform: "translate3d(0, 0, 0) scale(1)",
					opacity: 1
				})
			),
			state(
				"right",
				style({
					transform: "translate3d(100%, 0, 0) scale(0.5)",
					opacity: 0.8
				})
			),
			state(
				"exiting",
				style({
					transform: "translate3d(150%, 0, 0) scale(0.5)",
					opacity: 0
				})
			),
			transition("exiting => void", [
				animate(
					"400ms cubic-bezier(0.68, -0.55, 0.27, 1.55)",
					style({
						transform: "translate3d(150%, 0, 0) scale(0.5)",
						opacity: 0
					})
				)
			]),
			transition("entering => left", animate("600ms cubic-bezier(0.68, -0.55, 0.27, 1.55)")),
			transition("left => center", animate("600ms cubic-bezier(0.68, -0.55, 0.27, 1.55)")),
			transition("center => right", animate("600ms cubic-bezier(0.68, -0.55, 0.27, 1.55)")),
			transition("right => exiting", animate("600ms cubic-bezier(0.68, -0.55, 0.27, 1.55)"))
		])
	]
})
export class VisionDemoComponent implements OnInit, OnDestroy {
	foodEmojis: FoodEmoji[] = [
		{ id: 1, emoji: "🍣", name: "Salmon Nigiri Sushi, 214 kcal" },
		{ id: 2, emoji: "🌮", name: "Beef Taco, cheese, 251 kcal" },
		{ id: 3, emoji: "🍝", name: "Spaghetti, meatballs, 623 kcal" },
		{ id: 4, emoji: "🍕", name: "Pepperoni Pizza, 285 kcal" },
		{ id: 5, emoji: "🍔", name: "Beef Burger, cheese, 357 kcal" },
		{ id: 6, emoji: "🥗", name: "Mixed Green Salad, 152 kcal" },
		{ id: 7, emoji: "🍜", name: "Shoyu Ramen, pork, 510 kcal" },
		{ id: 8, emoji: "🥞", name: "Pancakes, syrup, 352 kcal" },
		{ id: 9, emoji: "🌯", name: "Beef Burrito, rice, 723 kcal" }
	];

	private platformId = inject(PLATFORM_ID);
	visibleFoods = signal<FoodEmoji[]>([]);
	currentIndex = signal<number>(3);
	textContent = signal("");
	animationInterval: any;
	isTyping = false;
	isAnimating = false;

	ngOnInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.setupInitialState();
			this.startAnimationCycle();
		}
	}

	ngOnDestroy(): void {
		if (this.animationInterval) {
			clearInterval(this.animationInterval);
		}
	}

	setupInitialState(): void {
		const initialFoods: FoodEmoji[] = [
			{ ...this.foodEmojis[0], position: "left", id: 100 },
			{ ...this.foodEmojis[1], position: "center", id: 101 },
			{ ...this.foodEmojis[2], position: "right", id: 102 }
		];

		this.visibleFoods.set(initialFoods);
		this.textContent.set(this.foodEmojis[1].name);
	}

	startAnimationCycle(): void {
		this.animationInterval = setInterval(() => {
			if (!this.isAnimating) {
				this.isAnimating = true;
				this.runAnimationSequence().then(() => {
					this.isAnimating = false;
				});
			}
		}, 2000);
	}

	async runAnimationSequence(): Promise<void> {
		await this.deleteTextAsync();
		await this.delay(100);

		const nextIndex = this.currentIndex() % this.foodEmojis.length;
		const newFood: FoodEmoji = {
			...this.foodEmojis[nextIndex],
			position: "entering",
			id: Date.now()
		};

		this.visibleFoods.update((list) => [newFood, ...list]);

		await this.delay(0);

		this.visibleFoods.update((list) =>
			list.map((f) => {
				switch (f.position) {
					case "entering":
						return { ...f, position: "left" };
					case "left":
						return { ...f, position: "center" };
					case "center":
						return { ...f, position: "right" };
					case "right":
						return { ...f, position: "exiting" };
					default:
						return f;
				}
			})
		);

		this.visibleFoods.update((foods) =>
			foods.map((food) => {
				if (food.position === "entering") {
					return { ...food, position: "left" };
				}
				return food;
			})
		);

		await this.delay(750);
		this.visibleFoods.update((list) => list.filter((f) => f.position !== "exiting"));
		await this.typeTextAsync(this.visibleFoods().find((f) => f.position === "center")?.name || "");
		this.currentIndex.update((idx) => (idx + 1) % this.foodEmojis.length);

		await this.delay(2000);
	}

	delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async typeTextAsync(text: string): Promise<void> {
		return new Promise<void>((resolve) => {
			const currentText = text;
			let i = 0;
			this.textContent.set("");
			this.isTyping = true;

			const intervalId = setInterval(() => {
				if (i < currentText.length) {
					this.textContent.update((text) => text + currentText[i]);
					i++;
				} else {
					clearInterval(intervalId);
					this.isTyping = false;
					resolve();
				}
			}, this.getRandomNumber());
		});
	}

	async deleteTextAsync(): Promise<void> {
		return new Promise<void>((resolve) => {
			const currentText = this.textContent();
			if (currentText.length === 0) {
				resolve();
				return;
			}

			let i = currentText.length;
			this.isTyping = true;

			const intervalId = setInterval(() => {
				this.textContent.update((text) => text.slice(0, -1));
				i--;

				if (i === 0) {
					clearInterval(intervalId);
					this.isTyping = false;
					resolve();
				}
			}, this.getRandomNumber() / 3);
		});
	}

	private getRandomNumber(): number {
		return Math.floor(Math.random() * (70 - 120 + 1)) + 70;
	}
}

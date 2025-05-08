import { Component, OnInit, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";

@Component({
	imports: [RouterLink, MatButtonModule],
	templateUrl: "./landing-page.component.html",
	styleUrl: "./landing-page.component.scss"
})
export class LandingPageComponent implements OnInit {
	strings: string[] = ["Hello, world!", "How are you?", "Welcome to the type effect!"];
	currentIndex = 0;
	textContent = signal("");
	typingInterval: any;
	deletingInterval: any;

	ngOnInit(): void {
		this.typeEffect();
	}

	typeEffect() {
		const currentText = this.strings[this.currentIndex];
		let i = 0;
		this.textContent.set(""); // Clear textContent at the start

		// Type out the current text
		this.typingInterval = setInterval(() => {
			this.textContent.update((text) => text + currentText[i]);
			i++;

			if (i === currentText.length) {
				clearInterval(this.typingInterval);
				// Wait for 3 seconds, then delete the text
				setTimeout(() => this.deleteText(), 3000);
			}
		}, this.getRandomNumber()); // Typing speed (100ms between characters)
	}

	deleteText() {
		const currentText = this.strings[this.currentIndex];
		let i = currentText.length;

		// Delete the current text
		this.deletingInterval = setInterval(() => {
			this.textContent.update((text) => text.slice(0, -1));
			i--;

			if (i === 0) {
				clearInterval(this.deletingInterval);
				// After deleting, move to the next string
				this.currentIndex = (this.currentIndex + 1) % this.strings.length;
				this.typeEffect();
			}
		}, this.getRandomNumber() / 3);
	}

	private getRandomNumber() {
		return Math.floor(Math.random() * (100 - 150 + 1)) + 100;
	}
}

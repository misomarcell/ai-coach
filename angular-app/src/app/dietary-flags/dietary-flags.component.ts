import { DietaryFlag } from "@aicoach/shared";
import { Component, input } from "@angular/core";
import { MatRippleModule } from "@angular/material/core";
import { MatIconModule } from "@angular/material/icon";

interface FlagChip {
	icon: string;
	color: string;
}

@Component({
	selector: "app-dietary-flags",
	imports: [MatIconModule, MatRippleModule],
	templateUrl: "./dietary-flags.component.html",
	styleUrl: "./dietary-flags.component.scss"
})
export class DietaryFlagsComponent {
	FLAG_TO_ICON_MAP: Record<DietaryFlag, FlagChip> = {
		"vegan": { icon: "🍃", color: "#4caf50" }, // Green for positive
		"vegetarian": { icon: "🥗", color: "#8e8db2" }, // Light Blue for neutrality
		"gluten-free": { icon: "🌾", color: "#f3faff" }, // Very Light Blue for neutrality
		"keto": { icon: "🥩", color: "#1a1342" } // Dark Purple for specific group
	};

	flags = input.required<DietaryFlag[]>();
}

import { animate, style, transition, trigger } from "@angular/animations";

export const popInEffect = trigger("popInEffect", [
	transition(":enter", [
		style({
			transform: "scale(0.5)",
			opacity: 0
		}),
		animate(
			"300ms cubic-bezier(0.25, 0.8, 0.25, 1)",
			style({
				transform: "scale(1)",
				opacity: 1
			})
		)
	]),
	transition(":leave", [
		animate(
			"200ms cubic-bezier(0.4, 0.0, 1, 1)",
			style({
				transform: "scale(0.5)",
				opacity: 0
			})
		)
	])
]);

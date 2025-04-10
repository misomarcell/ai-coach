import { animate, group, query, style, transition, trigger } from "@angular/animations";

export const slideInOut = trigger("slideInOut", [
	transition(":enter", [
		style({ transform: "translateX(-100%)", opacity: 0 }),
		group([
			query(":self", animate("1ms")),
			animate("250ms cubic-bezier(0.0, 0.0, 0.2, 1)", style({ transform: "translateY(0)", opacity: 1 }))
		])
	]),
	transition(":leave", [animate("200ms cubic-bezier(0.4, 0.0, 1, 1)", style({ transform: "translateX(100%)", opacity: 0 }))])
]);

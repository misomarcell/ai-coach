import { isPlatformServer } from "@angular/common";
import { AfterViewInit, Component, ElementRef, HostListener, inject, PLATFORM_ID, signal, viewChild } from "@angular/core";
import { MatCardModule } from "@angular/material/card";

@Component({
	selector: "app-analytics-demo",
	standalone: true,
	imports: [MatCardModule],
	templateUrl: "./analytics-demo.component.html",
	styleUrls: ["./analytics-demo.component.scss"]
})
export class AnalyticsDemoComponent implements AfterViewInit {
	x = signal(0);
	y = signal(0);
	scale = signal(1);

	private platformId = inject(PLATFORM_ID);
	private container = viewChild<ElementRef<HTMLDivElement>>("container");

	private hw = 0;
	private hh = 0;
	private dragging = false;

	private pointerStartX = 0;
	private pointerStartY = 0;
	private dragStartX = 0;
	private dragStartY = 0;

	private initialBeta: number | null = null;
	private initialGamma: number | null = null;

	private readonly amplitude = 0.5; // max 50% offset
	private readonly smoothStep = 0.1; // lerp factor per event
	private readonly maxTilt = 30; // degrees mapped to amplitude

	ngAfterViewInit(): void {
		const containerElement = this.container()?.nativeElement;
		if (!containerElement || isPlatformServer(this.platformId)) {
			return;
		}

		const rect = containerElement.getBoundingClientRect();
		const radius = 18; // half of 36px
		this.hw = rect.width / 2 - radius;
		this.hh = rect.height / 2 - radius;
		this.x.set(this.hw);
		this.y.set(this.hh);
	}

	@HostListener("window:deviceorientation", ["$event"])
	onDeviceOrientation(event: DeviceOrientationEvent) {
		if (this.initialBeta === null) {
			this.initialBeta = event.beta ?? 0;
			this.initialGamma = event.gamma ?? 0;
		}

		const rawBeta = (event.beta ?? 0) - (this.initialBeta ?? 0);
		const rawGamma = (event.gamma ?? 0) - (this.initialGamma ?? 0);

		const Bnorm = Math.max(-1, Math.min(1, rawBeta / this.maxTilt));
		const Ynorm = Math.max(-1, Math.min(1, rawGamma / this.maxTilt));

		// target offsets (±30% of hw/hh)
		const targetX = this.hw + Ynorm * this.hw * this.amplitude;
		const targetY = this.hh - Bnorm * this.hh * this.amplitude; // invert so “tilt away” pulls up

		if (!this.dragging) {
			const curX = this.x();
			const curY = this.y();
			this.x.set(curX + (targetX - curX) * this.smoothStep);
			this.y.set(curY + (targetY - curY) * this.smoothStep);
		}
	}

	onPointerDown(evt: PointerEvent) {
		evt.preventDefault();
		const bulbEl = evt.target as HTMLElement;
		bulbEl.setPointerCapture(evt.pointerId);

		this.dragging = true;
		bulbEl.classList.add("grabbing");
		this.scale.set(1.1);

		this.pointerStartX = evt.clientX;
		this.pointerStartY = evt.clientY;
		this.dragStartX = this.x();
		this.dragStartY = this.y();
	}

	onPointerMove(evt: PointerEvent) {
		if (!this.dragging) return;

		const dx = evt.clientX - this.pointerStartX;
		const dy = evt.clientY - this.pointerStartY;
		const newX = Math.min(Math.max(this.dragStartX + dx, 0), this.hw * 2);
		const newY = Math.min(Math.max(this.dragStartY + dy, 0), this.hh * 2);

		this.x.set(newX);
		this.y.set(newY);
	}

	onPointerUp(evt: PointerEvent) {
		const bulbEl = evt.target as HTMLElement;
		bulbEl.releasePointerCapture(evt.pointerId);

		this.dragging = false;
		bulbEl.classList.remove("grabbing");
		this.scale.set(1);
	}

	onFocus() {
		this.scale.set(1.1);
	}
	onBlur() {
		if (!this.dragging) {
			this.scale.set(1);
		}
	}
}

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
	// position + scale signals
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

	private readonly amplitude = 0.5; // 50% of the smaller half‐size
	private readonly smoothStep = 0.2; // easing factor
	private readonly maxTilt = 30; // degrees → full 50% offset

	ngAfterViewInit(): void {
		const elRef = this.container()?.nativeElement;
		if (!elRef || isPlatformServer(this.platformId)) return;

		const rect = elRef.getBoundingClientRect();
		const radius = 18; // half of 36px bulb
		this.hw = rect.width / 2 - radius;
		this.hh = rect.height / 2 - radius;

		// start centered
		this.x.set(this.hw);
		this.y.set(this.hh);
	}

	@HostListener("window:deviceorientation", ["$event"])
	onDeviceOrientation(event: DeviceOrientationEvent) {
		if (this.initialBeta === null) {
			this.initialBeta = event.beta ?? 0;
			this.initialGamma = event.gamma ?? 0;
			return;
		}

		const rawB = (event.beta ?? 0) - (this.initialBeta ?? 0);
		const rawG = (event.gamma ?? 0) - (this.initialGamma ?? 0);

		const Bnorm = Math.max(-1, Math.min(1, rawB / this.maxTilt));
		const Gnorm = Math.max(-1, Math.min(1, rawG / this.maxTilt));

		const pxAmp = Math.min(this.hw, this.hh) * this.amplitude;

		const targetX = this.hw + Gnorm * pxAmp;
		const targetY = this.hh + Bnorm * pxAmp;

		if (!this.dragging) {
			const cx = this.x();
			const cy = this.y();
			this.x.set(cx + (targetX - cx) * this.smoothStep);
			this.y.set(cy + (targetY - cy) * this.smoothStep);
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

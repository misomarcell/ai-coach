import { Component, OnDestroy, ElementRef, ViewChild, PLATFORM_ID, inject, AfterViewInit, signal } from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { MatCardModule } from "@angular/material/card";

@Component({
	selector: "app-analytics-demo",
	standalone: true,
	imports: [CommonModule, MatCardModule],
	templateUrl: "./analytics-demo.component.html",
	styleUrl: "./analytics-demo.component.scss"
})
export class AnalyticsDemoComponent implements AfterViewInit, OnDestroy {
	@ViewChild("bulbContainer", { static: true }) bulbContainer!: ElementRef;
	@ViewChild("lightbulb", { static: false }) lightbulbEl?: ElementRef;

	private platformId = inject(PLATFORM_ID);

	// Using signals for reactive updates
	bulbX = signal(40); // Percentage position from left
	bulbY = signal(55); // Percentage position from top
	bulbScale = signal(1);
	bulbGlow = signal(1);

	private deviceMotionListener: any;
	private deviceOrientationListener: any;
	private dragStartListener: any;
	private dragListener: any;
	private dragEndListener: any;
	private isDragging = false;
	private dragStartX = 0;
	private dragStartY = 0;
	private prevBulbX = 0;
	private prevBulbY = 0;

	ngAfterViewInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			setTimeout(() => {
				this.setupEventListeners();
			}, 1000);
		}
	}

	ngOnDestroy(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.removeEventListeners();
		}
	}

	private setupEventListeners(): void {
		// Check for DeviceMotionEvent support
		if (window.DeviceMotionEvent) {
			this.deviceMotionListener = this.handleDeviceMotion.bind(this);
			window.addEventListener("devicemotion", this.deviceMotionListener, { passive: true });
		}

		// Check for DeviceOrientationEvent support
		if (window.DeviceOrientationEvent) {
			this.deviceOrientationListener = this.handleDeviceOrientation.bind(this);
			window.addEventListener("deviceorientation", this.deviceOrientationListener, { passive: true });
		}

		// Add drag support
		if (this.lightbulbEl) {
			this.setupDragListeners();
		}
	}

	private setupDragListeners(): void {
		if (!this.lightbulbEl) return;

		const element = this.lightbulbEl.nativeElement;

		// Set up drag listeners
		this.dragStartListener = this.handleDragStart.bind(this);
		this.dragListener = this.handleDrag.bind(this);
		this.dragEndListener = this.handleDragEnd.bind(this);

		// Mouse events
		element.addEventListener("mousedown", this.dragStartListener);

		// Touch events for mobile
		element.addEventListener("touchstart", this.dragStartListener, { passive: false });
	}

	private removeEventListeners(): void {
		if (this.deviceMotionListener) {
			window.removeEventListener("devicemotion", this.deviceMotionListener);
		}

		if (this.deviceOrientationListener) {
			window.removeEventListener("deviceorientation", this.deviceOrientationListener);
		}

		// Remove drag listeners
		if (this.lightbulbEl) {
			const element = this.lightbulbEl.nativeElement;

			element.removeEventListener("mousedown", this.dragStartListener);
			element.removeEventListener("touchstart", this.dragStartListener);

			window.removeEventListener("mousemove", this.dragListener);
			window.removeEventListener("touchmove", this.dragListener);

			window.removeEventListener("mouseup", this.dragEndListener);
			window.removeEventListener("touchend", this.dragEndListener);
		}
	}

	private handleDragStart(event: MouseEvent | TouchEvent): void {
		// Prevent default to avoid text selection during drag
		event.preventDefault();

		this.isDragging = true;

		// Store initial positions
		if (event instanceof MouseEvent) {
			this.dragStartX = event.clientX;
			this.dragStartY = event.clientY;
		} else if (event instanceof TouchEvent && event.touches.length > 0) {
			this.dragStartX = event.touches[0].clientX;
			this.dragStartY = event.touches[0].clientY;
		}

		this.prevBulbX = this.bulbX();
		this.prevBulbY = this.bulbY();

		// Add move and end listeners
		window.addEventListener("mousemove", this.dragListener);
		window.addEventListener("touchmove", this.dragListener, { passive: false });

		window.addEventListener("mouseup", this.dragEndListener);
		window.addEventListener("touchend", this.dragEndListener);

		// Increase size slightly during drag
		this.bulbScale.set(1.1);
		this.bulbGlow.set(1.2);
	}

	private handleDrag(event: MouseEvent | TouchEvent): void {
		if (!this.isDragging) return;

		// Prevent default to avoid page scrolling during drag on touch devices
		event.preventDefault();

		let currentX, currentY;

		if (event instanceof MouseEvent) {
			currentX = event.clientX;
			currentY = event.clientY;
		} else if (event instanceof TouchEvent && event.touches.length > 0) {
			currentX = event.touches[0].clientX;
			currentY = event.touches[0].clientY;
		} else {
			return;
		}

		// Calculate drag delta
		const deltaX = currentX - this.dragStartX;
		const deltaY = currentY - this.dragStartY;

		// Calculate the container rect
		const rect = this.bulbContainer.nativeElement.getBoundingClientRect();

		// Convert to percentage movement
		const percentDeltaX = (deltaX / rect.width) * 100;
		const percentDeltaY = (deltaY / rect.height) * 100;

		// Apply movement with tighter bounds to ensure bulb stays within container
		// Accounting for the bulb size (emoji), we limit to 6-94% range
		const newX = Math.max(0, Math.min(80, this.prevBulbX + percentDeltaX));
		const newY = Math.max(10, Math.min(80, this.prevBulbY + percentDeltaY));

		this.bulbX.set(newX);
		this.bulbY.set(newY);
	}

	private handleDragEnd(_event: MouseEvent | TouchEvent): void {
		this.isDragging = false;

		// Reset scale and glow
		this.bulbScale.set(1);
		this.bulbGlow.set(1);

		// Remove move and end listeners
		window.removeEventListener("mousemove", this.dragListener);
		window.removeEventListener("touchmove", this.dragListener);

		window.removeEventListener("mouseup", this.dragEndListener);
		window.removeEventListener("touchend", this.dragEndListener);
	}

	private handleDeviceMotion(event: DeviceMotionEvent): void {
		if (this.isDragging) return; // Skip if currently dragging

		if (event.accelerationIncludingGravity) {
			const { x, y } = event.accelerationIncludingGravity;
			if (x !== null && y !== null) {
				// Convert acceleration to position with very slow movement
				const xMultiplier = 0.3; // Very slow horizontal movement
				const yMultiplier = 0.3; // Very slow vertical movement

				// Negative tilt to the left moves the bulb to the right
				const newX = this.bulbX() + x * xMultiplier;
				// Positive tilt forward moves the bulb down
				const newY = this.bulbY() + y * yMultiplier;

				// Apply with tighter bounds to ensure bulb stays within the container
				// Accounting for the bulb size (emoji), we limit to 6-94% range
				this.bulbX.set(Math.max(6, Math.min(94, newX)));
				this.bulbY.set(Math.max(6, Math.min(94, newY)));

				// Adjust glow based on movement
				const acceleration = Math.sqrt(x * x + y * y);
				this.bulbGlow.set(Math.max(0.8, Math.min(1.2, 1 + acceleration * 0.1)));
			}
		}
	}

	private handleDeviceOrientation(event: DeviceOrientationEvent): void {
		if (this.isDragging) return; // Skip if currently dragging

		const { beta, gamma } = event;
		if (beta !== null && gamma !== null) {
			// Very slow movement
			const gammaMultiplier = 0.15; // Very slow horizontal movement (reduced by 10x)
			const betaMultiplier = 0.15; // Very slow vertical movement (reduced by 10x)

			// Negative tilt to the left moves the bulb to the right
			const newX = this.bulbX() + gamma * gammaMultiplier;
			// Positive tilt forward moves the bulb down
			const newY = this.bulbY() + beta * betaMultiplier;

			// Apply with tighter bounds to ensure bulb stays within the container
			// Accounting for the bulb size (emoji), we limit to 6-94% range
			this.bulbX.set(Math.max(6, Math.min(94, newX)));
			this.bulbY.set(Math.max(6, Math.min(94, newY)));

			// Adjust glow based on tilt (more subtle effect)
			const tiltAmount = Math.sqrt(beta * beta + gamma * gamma) / 90;
			this.bulbGlow.set(Math.max(0.9, Math.min(1.1, 1 + tiltAmount * 0.1)));
		}
	}
}
